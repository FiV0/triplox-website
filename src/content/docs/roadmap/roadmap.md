---
title: Roadmap
description: Planned work and direction for Triplox.
---

In an initial version, Triplox will have quite the bare bones API. We want to focus on transactions, queries and incremental queries.
In later steps the APIs can be extended to support all the other features Datomic offers. This includes the `pull` and `entity` API as well querying over the whole history and all of that in an incremental way.

Some parts which are (currently) explicitly different to Datomic Datalog are:
- Triplox Datalog doesn't support the `:with` clause. As everything is bag based for now (see [bag vs. set semantics]()) there is no need or rather no use for a `:with` clause.
- No support for variables in the attribute position. This makes the current join algorithm a little easier. We will likely add support for variables in attribute position.
- No support for entity ids in attribute position. This just makes planning a little easier. Even though underneath the idents are resolved to entity ids, we are currently only support idents in attribute position.

### Features on the Roadmap

The following is a non-exhaustive list of things that we plan to add to Triplox eventually.

- query API features
  - `or-join`
  - `not-join`
  - rules
  - queries over all of history
- incremental queries
  - `or`/`or-join`
  - `and`
  - `not`/`not-join`
  - `predicate`/`function` patterns
- Extending the Expression Engine with more standard functions
- the `entity` API
- the `pull` API
- Transaction Functions - This is likely quite far away and I don't know when get to that. It likely involves compiling transaction functions to WASM.
