---
title: Life of a transaction
description: The lifecycle of a Triplox transaction.
---

Below is a diagram of a Triplox setup with the single writer node + a single
reader node. In the following we are going to describe how a triplox transaction
flows through this system and how it's data is eventually queryable.

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
verbatim to a log. This could be a Kafka log or a WAL writer to S3. You might ask why there
is an extra log and if the transactions could not be buffered on the primary server. The problem
is more that the
