import type { TraceAttrParams } from "../../bin/attr";
import { tableNameAttr } from "../db/constants";
import { getDb } from "../db/setup";

const db = getDb();

export function addTraceAttributes({ name, traceId, value }: TraceAttrParams) {
  const query = db.query(
    `INSERT OR REPLACE INTO ${tableNameAttr} (traceId, name, value) VALUES ($traceId, $name, $value)`,
  );
  query.run({ $traceId: traceId, $name: name, $value: value });
}
