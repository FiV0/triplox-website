---
title: Incremental Queries
description: Incremental queries in Triplox.
---

**🚧 Incremental queries are the most experimental part of Triplox. There will likely be issues about the non-happy paths and
they need more testing under heavy workloads. They are under active development. 🚧**

An incremental query delivers a stream of changes between two subsequent database values. A standard [query](/query-language/overview/) delivers a result set at a given point in time $t$. Let us call the database at that time $DB_t$. A transaction creates a new database $DB_{t+1}$. An incremental query gives you the changes of the static query between $DB_t$ and $DB_{t+1}$ from a given $t$ onwards (this is sometimes written as $\Delta DB$).

Let's say you query for the name and the residence of people:

```clojure
'{:find [?name ?residence]
  :where [[?p :person/name ?name]
          [?p :person/residence ?residence]]}
```
A static result for a given $t$ would be
```clojure
[["Ada Lovelace" "12 St. James's Square"]
 ["Alan Turing" "Bletchley Park"]]
```
Let's assume Ada Lovelace now moves to Buckingham Palace and we transact the following
```clojure
[[:db/add [:person/name "Ada Lovelace"] :person/residence "Buckingham Palace"]]
```
Then the new result set a time $t+1$ would be
```clojure
[["Ada Lovelace" "Buckingham Palace"]
 ["Alan Turing" "Bletchley Park"]]
```
The above assumes `:person/name` is a unique attribute and that a given person can only have a single residence (which are both questionable data modelling choices).
The incremental version of the above query would therefore return the following result for the change of address of Ada Lovelace:
```clojure
[["Ada Lovelace" "12 St. James's Square" -1]
 ["Ada Lovelace" "Buckingham Palace" 1]]
```
A result tuple of an incremental query is made up of the usual unified variables plus one extra integer (sometimes called `:db/diff`) which specifies the change in the corresponding static query result set.

The above shows an incremental query with some basic unification of variables. In Triplox final version incremental queries will support the same
feature set as [standard queries](/query-language/datalog). This means Triplox deals with the incremental evaluation of `or`, `and`, `not`, predicates and function evaluation.
Supporting rules will comes in a later step as it involves compiling recursive DBSP circuit for calculating fixed points which is a lot more tricky then
compiling a circuit without recursion.


### Incremental query API and setup

An incremental query is registered on a connection. Incremental queries (IQs) are defined with the same syntax as [standard queries](/query-language/datalog/). The reason IQs take a connection and not a db value as standard queries is because they return change between db values. This change happens between two subsequent DB values (in other systems you would call these DB snapshots). Every Client API has a concept of a `subscribe` method which registers the incremental query on the server. `subscribe` returns a stateful object that either needs to get closed or explicitly unregistered depending on the API. Incremental queries require resources on the server and the closing mechanics assure that these resources are properly cleaned up on the server. `subscribe` takes the connection and the query as arguments.

When an incremental query gets registered it takes out a DB value at a given `TxBasis`. For now this just happens to be the basis the node has caught up to, meaning you can currently only register incremental queries at roughly where the indexer is at. It builds, what is called in [DBSP](https://docs.rs/dbsp/latest/dbsp/) terminology, a circuit. This circuit gets primed by the data from the given `TxBasis`, meaning the data that is currently present in the indexes. You can think of this priming as running the static one-shot query through the circuit. This means the circuit initialization might take quite a while depending on how much data is already in the indexes that is relevant for the given incremental query. To give you some intuition of why the circuit needs to get primed with the old data when we are only interested in future deltas, consider a join of two abstract relations $A \bowtie B$. When something in $A$ changes (written as $\Delta A$) we still might need to join it against the old data, i.e. $\Delta A \bowtie B_{old}$.

### Incremental query evaluation

Once a circuit is primed, we can start listening to changes. For this we use SlateDB's [Change Data Capture](https://slatedb.io/docs/design/change-data-capture/) with which we are tailing WAL files (here we mean WAL files from SlateDB not our external log) as they appear on object storage. A WAL file might contain many transactions, so we construct the transactions in order from the WAL and apply them to all registered incremental queries. Applying every transaction is of course heavier than applying coarser changes. In the future we might support applying all changes from one WAL file in one go to the circuits. The upside of this approach is that incremental query evaluation is likely quicker, but you lose granularity in the output. If a fact was added and later retracted and this addition and retraction happens to reside in the same WAL file, you won't see any delta changes in a corresponding delta query in the output as the two changes cancelled each other out when constructing the changes for a WAL file, so the tradeoff will be speed vs granularity.


### Outlook

As all the historical data is available in the indexes, nothing prevents us to start an incremental query at older transaction basis values. The main issue is the catch-up phase (the phase where we play through transactions that have already made it through the indexer)
needs a different way to be played through compared to the CDC listening of SlateDB. We essentially need to play through old transactions.
