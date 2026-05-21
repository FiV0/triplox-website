---
title: APIs Overview
description: The core methods every Triplox client API exposes.
---

Every Triplox client API, regardless of language, exposes the same small set of methods. `connect` returns a node object, and on that node you get two ways to submit transactions (`submit_tx` and `execute_tx`), a way to take a consistent snapshot (`db` or `db_as_of`), and a way to query that snapshot (`q` / `query`).

## connect

Establishes a connection to a running Triplox server and returns a client node. The node is the entry point for everything else: submitting transactions and opening DB snapshots. A node holds network resources, so it should be closed when no longer needed.

## submit

`submit_tx` appends a transaction to the log and returns as soon as the server has accepted it, yielding a `TxKey`. It does **not** wait for the transaction to be indexed, so the change is not yet visible to queries when the call returns. Use it when the caller is not interested when a transaction has been indexed.

## execute

`execute_tx` submits a transaction and waits until the indexer has applied it, returning a `TransactionResult` that reports whether the transaction committed or aborted along with the assigned `tx_id` and system time. This is the method you want when you need to know the outcome of the transaction before continuing, or when the next step relies on the new data being visible.

## A db value

Open an immutable database value at the latest transaction known to the node with `db`. All reads happening against this db value see a consistent point-in-time view that is unaffected by concurrent writes.

## query

Runs a Datalog query against a db value and returns the matching facts.
See the [query language overview](/query-language/overview/) for the syntax of EDN Datalog.

## The typical flow

1. `connect` to the server to obtain a node.
2. `execute_tx` the schema attributes
3. Submit some data via `execute_tx` or `submit_tx`
4. Open a `db` value.
5. `query` againt that database value.
6. Enjoy 😎!

See the language-specific pages ([Clojure](/apis/clojure/), [Rust](/apis/rust/), [Java](/apis/java/)) for the exact signatures and idioms in each binding. If you want to build a new client, the wire format is documented in the [protocol doc](https://github.com/FiV0/triplox/blob/main/design/PROTOCOL.md).
