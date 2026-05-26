---
title: Incremental Queries
description: Incremental queries in Triplox.
---

**🚧 Incremental queries are the most experimental part of Triplox. There will likely be issues about the non-happy paths and
these they need more testing under heavy workloads. They are under active development. 🚧**

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

### Incremental query setup

TODO
- Describe SlateDB CDC
- Transactions vs WAL changes
- Circuit initialization
