import type { TraceMetricsParams } from "../../bin/metric";
import { tableNameMetric } from "../db/constants";
import { getDb } from "../db/setup";

const db = getDb();

export function addTraceMetrics({
  name,
  traceId,
  type,
  value,
}: TraceMetricsParams) {
  const query = db.query(
    `INSERT INTO ${tableNameMetric} (traceId, name, type, value) VALUES ($traceId, $name, $type, $value)`,
  );
  query.run({ $traceId: traceId, $name: name, $type: type, $value: value });
}
