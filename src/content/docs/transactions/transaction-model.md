---
title: Transaction Model
description: Triplox's transaction model.
---

In Triplox every submitted transaction gets processed by the indexer. The indexer is the
single writer (see [Life of a transaction](/transactions/life-of-a-transaction/)) and the
only component that mutates the [covering indexes](/data-model/#indexes). Every transaction
(be it valid or not) is on the log and gets processed by the indexer. When transaction data
arrives a list of steps happen.

The steps are roughly the following (and subject to change):

1. **Allocate the transaction entity.** The indexer clones the current
   [partition map](/transactions/partitions/) and allocates a fresh entity id (`tx_eid`) in
   the `TX_PARTITION` partition. This becomes the first-class
   [transaction entity](/transactions/life-of-a-transaction/#concepts) that every datom in
   this transaction is tagged with in the `tx` position.

2. **Expand the operations.** The submitted operations are expanded into datoms. Idents
   (keywords like `:person/name`) are resolved to their attribute entity ids, while lookup
   refs and [tempids](/transactions/transaction-data/#tempids) are kept symbolic for the next
   steps.

3. **Resolve lookup refs.** Lookup refs (e.g. `[:person/email "ada@example.com"]`) are
   resolved against the AVE index to the concrete entity id that owns the unique value.

4. **Resolve tempids.** Tempids are turned into concrete entity ids, allocating new ones from
   the partition map where needed. A tempid that asserts a `:db.unique/identity` value can
   *upsert* onto an existing entity instead of creating a new one. The transaction entity's
   own datoms (`:db/txInstant`, `:db/txId`, `:db/txResult`) are added at this point.

5. **Finalize for commit.** For [cardinality-one](/transactions/schema/#dbcardinality)
   attributes the indexer reads the current value from the EAV index. If the new value equals
   the old one the assertion is dropped as a no-op; if it differs, a retraction for the old
   value is added alongside the new assertion. This is what keeps "overwriting" an attribute
   from leaving two live values behind.

6. **Validate.** [Uniqueness constraints](/transactions/schema/#dbunique) are checked, both
   within the transaction itself and against existing data via the VAE index, followed by
   general [schema](/transactions/schema/) validation (value types, cardinality, schema
   immutability, and so on).

7. **Prepare schema changes.** If the transaction modifies the schema, the schema update is
   prepared *before* anything is written, so that a transaction that is later rejected never
   leaks datoms into the live schema.

8. **Write and commit.** All datoms are encoded into the covering indexes (EAV/AVE/AEV, plus
   VAE for unique attributes) and written to SlateDB atomically.

9. **Apply on success.** Only after the commit succeeds does the indexer swap in the new
   partition map, apply any prepared schema update, advance the latest indexed transaction,
   and broadcast completion to anyone waiting on this transaction.

In case of an error, for example a uniqueness constraint violation or wrongly typed user
data, the indexer does obviously not commit the user data, but it still transacts a
*transaction entity* recording the failure.
See [transaction entity](/transactions/life-of-a-transaction/#transaction-entity).


:::note
Transactions that violate some constraint usually don't have any trace in Datomic and
get rejected by the transactor.
:::
