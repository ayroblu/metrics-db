# metrics-db

Metrics DB is a local implementation of a observability server, using a trace first pattern, where everything is a trace. Inspiration from: https://www.youtube.com/watch?v=FqcSImVgxrs

Traces have "attributes" and "metrics". An attribute could be various log points in the trace journey and the same for the metrics. Note that the counters aren't monotonic anymore, and we store more information than in traditional metrics servers which discard after performing the percentile operation over a time interval (e.g. minute), used for p99999, because we don't need to handle that many requests.

### Getting started

To install dependencies:

```sh
bun install
```

Run with:

```sh
$ ./bin/trace.ts '{"traceId": "first", "name": "todo", "startTime": "2024-01-06T20:57:58.015Z", "endTime": null }'
$ ./bin/attr.ts '{"traceId": "first", "name": "git log", "value": "2 entries" }'
$ ./bin/metric.ts '{"traceId": "first", "name": "todo/count", "type": "counter", "value": 2 }'
```
