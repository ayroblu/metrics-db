import type { TraceParams } from "../../bin/trace";
import { tableName } from "../db/constants";
import { getDb } from "../db/setup";

const db = getDb();

export function addTrace({ name, traceId, startTime, endTime }: TraceParams) {
  const query = db.query(
    `INSERT OR REPLACE INTO ${tableName} (traceId, name, startTime, endTime) VALUES (:traceId, :name, :startTime :endTime)`,
  );
  query.run({ traceId, name, startTime, endTime });
}
