import { tableNameAttr } from "../db/constants";
import { getDb, type AttrTable } from "../db/setup";

type LogResult = AttrTable;

type Params = {
  filter?: string;
  before?: number;
  after?: number;
};
export function logs({ filter, before, after }: Params = {}): LogResult[] {
  const db = getDb();
  const query = db.query(
    `SELECT * FROM ${tableNameAttr}
WHERE 1=1
  ${
    filter
      ? "AND (name LIKE $filter OR traceId LIKE $filter OR value LIKE $filter)"
      : ""
  }
  ${before ? "AND createdAt < $before" : ""}
  ${after ? "AND createdAt > $after" : ""}
ORDER BY createdAt DESC LIMIT 1000`,
  );
  const results = query.all({
    ...(filter ? { $filter: `%${filter}%` } : {}),
    ...(before ? { $before: before } : {}),
    ...(after ? { $after: after } : {}),
  }) as AttrTable[];
  return results;
}
