import type { TraceAttrParams } from "../../bin/attr";
import { tableNameAttr } from "../db/constants";
import { getDb } from "../db/setup";

const db = getDb();

export function addTraceAttributes({ name, traceId, value }: TraceAttrParams) {
  const query = db.query(
    `INSERT OR REPLACE INTO ${tableNameAttr} (traceId, name, value, createdAt) VALUES ($traceId, $name, $value, $createdAt)`,
  );
  query.run({
    $traceId: traceId,
    $name: name,
    $value: value,
    $createdAt: Date.now(),
  });
}
