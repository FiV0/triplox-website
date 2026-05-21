---
title: Open questions
description: Open questions about the architecture of Triplox.
---

### Log

As you can see in the [Architecture](/getting-started/architecture/) section, Triplox currently uses an external log to serialize the transaction history.
The external log is currently the main wrinkle for me in the architecture. It adds extra complexity that we would like to avoid.
[AutoMQ](https://github.com/automq/automq) is Kafka backed by S3. This would probably give good latency but is another service in the architecture.
Some kind of log component that writes directly to object storage to which the writer node just appends data would be preferable.
You will likely get higher latencies (although you could use something like S3 Express), but operationally this is likely the best option.
We are not using SlateDB's [MVCC](https://en.wikipedia.org/wiki/Multiversion_concurrency_control), because Triplox needs to control the
[total order](https://en.wikipedia.org/wiki/Total_order) of transactions before they hit the indexes, rather than having that order
determined internally by SlateDB.
Something like [wal3](https://www.trychroma.com/engineering/wal3) would be something to consider, but it is currently not available as standalone dependency.
We have also discussed creating a standalone slatedb-wal, extracting the wal component of SlateDB into a standalone dependency and simply use it as a log.
So far this seems to be the best option to me, but I am happy to hear other ideas.


### Bag vs set semantics

On the query side there is a question of bag vs set semantics. Currently we are implementing bag semantics for query results
and this differs to traditional Datomic. Set semantics would remain closer to the traditional Datalog literature and
also avoids certain awkward query patterns where variables otherwise "leak"
into aggregates (see some thoughts in the [semantics document](https://github.com/FiV0/triplox/blob/main/design/SEMANTICS.md)).
On the other hand, bags allow you to stream result sets in batches (no deduplication of the full result set) and in
theory also need less DBSP distinct operators (an operator that is expensive to maintain). The decision on this
needs some more thought. If you have strong opinions regarding the set vs bag question, feel free to raise them on Discord
or in a ticket.

### Tx pipeline

Placeholder — open questions about the transaction pipeline.


### External Log vs SlateDb WAL

As Triplox has an extra Log sitting in front of SlateDb, we don't really need SlateDb's WAL feature for durability. The problem is
that we want to use the WAL for CDC (Change Data Capture). We don't want to use the External Log for that as we want to see the
changes to the indexes when they have gone through the indexer. We don't want to do the transaction resolving and validation dance
done by the indexer once more on a reader node just to get the data for a incremental query pipeline. The downside of all this is
more object storage put requests and operation costs.
