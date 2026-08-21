---
title: Transaction Data
description: Triplox transaction data.
---

Transaction data is how data of a transaction is represented in Triplox.
Triplox uses transaction-data forms inspired by [Datomic](https://docs.datomic.com/transactions/transaction-data-reference.html).
It purely concerns the transaction data constructs and not the semantics of a Triplox transaction.
We will explain every concept via [EDN](https://github.com/edn-format/edn) syntax used
by the [Clojure client](/apis/clojure/). The Java and Rust client also support
the EDN syntax as strings, but they both also have explicit typed constructors for the transaction data.
Every transaction data construct gets in the end translated to a [Datom](/getting-started/concepts/#datom) or a set of Datoms.
The Datom is the most important concept to understand if you wish to understand transaction data.
Transaction data is a vector of a assertions, retractions,
assertions in map form (asserting multiple attributes about an entity) or an entity retraction.

### Assertion / Retraction

The most basic form to assert a fact is via a standard assertion.
```clojure
[:db/add entity-id attribute value]
```
The following example asserts that the entity id `123` (presumably a person) should have the name "Lovelace".
```clojure
[:db/add 123 :person/name "Lovelace"]
```
To remove data in Triplox, one retracts the EAV triple.
```clojure
[:db/retract entity-id attribute value]
```
We currently expect a value for a retraction. A retraction without a value will fail.
Transaction entity ids are not known at transaction time. These are assigned when the indexer
has validated the transaction only then the transaction id is appended to the EAV permutations.

### Map assertion form

Often when asserting facts about an entity we want to assert more than one fact. Asserting multiple
facts about the same entity can be achieved via a `map assertion`. The map contains key/value pairs
corresponding to attribute/value pairs.

For example asserting facts about a person could be achieved via
```clojure
{:person/first-name "Ada"
 :person/last-name "Lovelace"
 :person/profession "Programmer"}
```

There key `:db/id` is special syntax sugar for identifying an entity via entity id. A map of the form
```clojure
{:db/id 123
 :person/first-name "Ada"
 :person/last-name "Lovelace" }
```
is the same as the two transaction operations
```clojure
[:db/add 123 :person/first-name "Ada"]
[:db/add 123 :person/last-name "Lovelace"]
```
### Entity retraction

Entity retraction is the way to remove an entity entirely. It results in all currently visible attributes being retracted.
No part of the of the entity is visible at the new DB value.

```clojure
[:db/retractEntity 123]
```
If the entity also has a `:db.unique/identity` attribute, the entity can also be retracted via a lookup ref. For example
a social security number.
```clojure
[:db/retract [:person/ssn "123-45-6789"]]
```
:::note
Triplox currently does not do recursive or cascading retractions. References to the retracted entity will remain active.
It is currently the users responsibility to assure consistency in this regard.
:::

### Tempids

TODO

### Lookup refs

TODO

### Idents

TODO

### Entity erasure

Entity erasure is a way to completely erase any trace of an entity. It removes all versions of an entity from Triplox. Use it with care and seldom. It is for example useful to comply with GDPR Right to Erasure. This is the only operation that has an effect on queries on old DB values.

```clojure
[:db/erase 123]
```
:::note
Triplox currently does not support entity erasure. The Client APIs will accept these operations, but the indexer will throw and create an aborted transaction entity. I want to spend some time on how erasure should behave and dealt with in incremental queries. As there
will be no retraction appearing in the SlateDB WAL, some thought needs to be put into how this gets communicated to the incremental
query circuits.

As with entity retraction, triplox does (currently) not deal with recursive or cascading erasure.
:::
