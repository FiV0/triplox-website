---
title: Transaction Model
description: Triplox's transaction model.
---

This page tries to give a high-level overview of how Triplox's transaction model works.
We try to follow [Datomic's transaction model](https://docs.datomic.com/transactions/model.html),
so it is encouraged to also read that page (just be aware that we don't support
all features Datomic supports). This page is likely a bit more ad hoc and concerns
the transaction pipeline of Triplox so you have some understanding of how data gets validated
and why transactions get rejected or not indexed.

Every transaction is a set of facts (also called Datoms) that either get indexed into Triplox
or not for reasons below. The order of these facts and how they appear in
[transaction data](/transactions/transaction-data) is not important. Every transaction gets
validated with the state of Triplox just before this transaction is applied. This is also
why we need a total order for our transactions, before they go through the tx pipeline.
The Datomic folks have done a much more thorough job explaining why you might want such semantics
than I ever could, so I encourage you to read that document.

The rest of the page is mainly concerned with transaction validation and why a transaction might
not get indexed. It kind of illustrates the transaction semantics via all the validation that
happens in the tx pipeline before a transaction gets written to SlateDB indexes.

In Triplox every submitted transaction gets processed by the indexer. The indexer is the
single writer (see [Life of a transaction](/transactions/life-of-a-transaction/)) and the
only component that mutates the [covering indexes](/data-model/#indexes). Every transaction
(be it valid or not) is on the log and gets processed by the indexer.


The following are the steps the tx pipeline roughly goes through (subject to change):

#### Transaction data expansion

Expand the submitted transaction data of the transaction. Triplox turns assertions, retractions, map forms,
idents and `:db/id` sugar into the internal Datom data structure used by the rest of the
pipeline. Idents that don't exist, malformed `:db/id` or lookup-refs are caught at this step.

#### Lookup-ref resolving

Next, the tx pipeline resolves lookup-refs. Lookup-refs are only accepted for `:db.unique/identity` attributes.
Also, the value type of the lookup-ref is verified. Finally, the lookup-ref is resolved via the
VAE index. If no value can be found against the previous state of Triplox, the transaction is
aborted.

#### Explicit entity ids check

The tx pipeline then checks that any explicit entity ids in the Datoms map to already allocated
entities. This holds for the entity id position as well as for ref-typed values that point nowhere.
The transaction is aborted when nonsensical entity ids are found.

#### Tempid and upsert resolution

We continue resolving tempids and upserts. This is, I think, the hairiest step in the tx pipeline.
Tempids are the way to create or connect entities inside one transaction. Tempids with `:db.unique/identity`
attributes may upsert onto an existing entity. Otherwise Triplox allocates new entities
in the appropriate partitions for the new entities. We also need to ensure that a tempid upserting
to two or more entities aborts the transaction. Tempids only appearing in value ref
position are also disallowed.

#### Schema validation

We validate the datoms against the schema. Attributes must exist, values must have the type declared by the
attribute, and cardinality-one attributes cannot get multiple distinct values from the
same transaction. For cardinality-one attributes, an assertion and retraction of the exact same fact
in one transaction is also treated as a conflict.

#### Cardinality-one retractions

After this step we add the implicit cardinality-one retractions.
For [cardinality-one](/transactions/schema/#dbcardinality)
attributes the indexer reads the current value from the EAV index. If the new value equals
the old one the assertion is dropped as a no-op; if it differs, a retraction for the old
value is added alongside the new assertion.

#### Uniqueness constraints

Next, uniqueness is checked. [Uniqueness constraints](/transactions/schema/#dbunique) are checked
both inside the transaction datoms and against existing data. Two entities in the same
transaction cannot claim the same unique value. A transaction also cannot claim a unique
value that is already owned by another live entity, unless that old owner is retracted in
the same transaction.

#### Schema update

If in the previous steps a schema update was detected, we prepare it now. Schema is just data,
but there are some constraints on schema entity updates that are tighter than standard
entity updates. We currently also require certain attributes to be present for a schema
entity to be valid.

#### Commit

Finally, we write and commit the datoms to SlateDB. All accepted datoms are encoded into the covering indexes
(EAV/AVE/AEV, plus VAE for unique attributes) and written to SlateDB atomically.

Only after a successful commit does the in-memory schema get updated and the partition counters set.
We also broadcast that the transaction in question has been indexed.

In case of an error, for example a uniqueness constraint violation,
the indexer does not commit the user data. It still
transacts a *transaction entity* recording the failure.
See [transaction entity](/transactions/life-of-a-transaction/#transaction-entity).

:::note
Transactions that violate some constraint usually don't have any trace in Datomic and
get rejected by the transactor. In Triplox these transactions always get a
transaction entity documenting that failure.
:::
