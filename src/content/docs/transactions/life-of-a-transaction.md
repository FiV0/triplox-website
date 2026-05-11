---
title: Life of a transaction
description: The lifecycle of a Triplox transaction.
---

Below is a diagram of a Triplox setup with the single writer node + a single
reader node. In the following we are going to describe how a Triplox transaction
flows through this system and the data eventually becomes queryable.

```
                   ┌────────────────────────────────────────┐
                   │           Object Storage (S3)          │
                   │                                        │
                   │  ┌─────────────┐      ┌─────────────┐  │
                   │  │   SlateDB   │      │   SlateDB   │  │
                   │  │  (Writer)   │      │  (Reader 1) │  │
                   │  └──────┬──────┘      └──────┬──────┘  │
                   │         │                    │         │
                   └─────────┼────────────────────┼─────────┘
                             │                    │
     Queries/Indices         ▲ read/write         ▼ read
                             │                    │
        ┌────────────────────┴────────┐  ┌────────┴────────┐
        │         Writer Node         │  │  Reader Node 1  │
        │                             │  │                 │
        │      ┌──────────────┐       │  │                 │
  ┌─────┼────▶│   Indexer    │       │  │                 │
  │     │      └──────────────┘       │  │                 │
  │     │                             │  │                 │
  │     └─────────────┬───────────────┘  └─────────────────┘
  │                   │
  │  Transactions     │ write
  │                   ▼
  │     ┌──────────────────────────────────────────────────┐
  │     │                                                  │
  │     │                      Log                         │
  │     │                                                  │
  │     │    ┌─────┬─────┬─────┬─────┬─────┬─────┐         │
  └─────┼────┤ tx0 │ tx1 │ tx2 │ tx3 │ tx4 │ ... │         │
   read │    └─────┴─────┴─────┴─────┴─────┴─────┘         │
        │                                                  │
        └──────────────────────────────────────────────────┘
```

A transaction is send to the primary node for indexing. The node appends the transaction data
verbatim (serializing the transaction to some canonical format) to a log. This could be a Kafka log
or a WAL writing directly to for example an S3 express bucket. You might ask why there is an extra log and
if the transactions could not be buffered on the primary server. As Triplox
is a client/server system, we want to acknowledge transactions without a
lot of latency even when there is a lot of back pressure from indexing.

A transaction is appended to the log and a `TxKey` is returned. The
`TxKey` holds a `tx_id`, an offset into the log (file or Kafka)
identifying the transaction and a `system_time`, the wall-clock instant the transaction
was appended. At this point the transaction is durable but lives on the log as plain,
unindexed data. The indexer subscribes to the log and, for each record, materializes the
transaction data into the [covering indexes]
as a *transaction entity* in the `TX_PARTITION` partition.
  This entity carries:
    - a freshly allocated transaction entity id (`tx_eid`)
    - `:db/txId` — the `tx_id` from above
    - `:db/txInstant` — the `system_time` from above
    - `:db/txResult` — whether the transaction was committed or aborted
    - `:db/txError` — an optional transaction error
- Every indexed datom is tagged with the `tx_eid` of the transaction that
  wrote it, so it is the `tx_eid` — not the `tx_id` — that actually filters
  the indexes when a query runs against a given snapshot.
- Because the `tx_eid` is allocated *inside* the indexer, callers that only
  hold a `TxKey` cannot scan immediately: they would first have to resolve
  `:db/txId → tx_eid` via the AVE index. To avoid that lookup on the hot
  path of every `db_as_of`, the indexed transaction handle is `TxBasis`,
  which bundles the `TxKey` with its resolved `tx_eid`:

  ```rust
  pub struct TxBasis {
      pub tx_key: TxKey,
      pub tx_eid: i64,
  }
  ```

- `TxBasis` is what flows through the system once a transaction has been
  indexed:
    - The indexer's `transact_tx` and its completion broadcast return a
      `TxBasis`, so the `tx_eid` is known the moment a transaction is
      indexed.
    - `latest_tx_basis_from_snapshot` reads the latest basis directly from
      `TX_PARTITION` when reopening a DB.
    - `Database::db_as_of` takes a `TxBasis` directly, so callers that
      already have one (e.g. from awaiting a submitted transaction) open a
      snapshot without any extra lookup.
    - `TransactionResult` wraps `TxBasis`
      (`TxCommited(TxBasis)` / `TxAborted(TxBasis, _)`).
    - The Rust and JVM wire DTOs for opening an as-of DB carry `tx_eid`
      alongside `tx_id` and `system_time`, so a client can pass a full
      basis over the wire (`TxBasis(long txId, Instant systemTime, long
      txEid)` on the JVM side).

Note that the log offset (`tx_id`) and the entity id (`tx_eid`) are kept
as distinct concerns rather than unified into a single dense id. `TxBasis`
pairs them so callers get the lookup-free behavior without coupling the
entity-id allocator to the log's offset scheme.

### Concepts

- **TxKey** — identifies a unique transaction on the log (`tx_id` +
  `system_time`). Returned by the submit-tx API.
- **tx_id** — an offset into the transaction log identifying the start of the
  transaction record; also serves as the transaction's identity on the log.
- **transaction entity** — the entity in the `TX_PARTITION` partition that carries
  information about the result and state of a transaction *after* it has
  been indexed.
- **tx_eid (transaction entity id)** — the entity id of that transaction
  entity. This is what every indexed datom is tagged with in the `T`, and what a
  query execution uses to filter indexes to a given snapshot.
- **TxBasis** — the indexed transaction handle: a `TxKey` paired with the
  `tx_eid` of its transaction entity. Lets callers open a DB at a snapshot
  without a `tx_id → tx_eid` lookup.
