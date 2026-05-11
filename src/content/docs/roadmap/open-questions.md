---
title: Open questions
description: Open questions about the log, bag vs set semantics, and the transaction pipeline.
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


### Bag vs Set semantics


### Tx Pipeline

Placeholder — open questions about the transaction pipeline.
