import { Database } from "bun:sqlite";
import { tableName, tableNameAttr, tableNameMetric } from "./constants";
import path from "path";

const dbPath = path.resolve(
  path.dirname(import.meta.path),
  "..",
  "..",
  "observability.sqlite",
);

export function getDb(): Database {
  const db = new Database(dbPath);
  // db.exec("PRAGMA journal_mode = WAL;");
  createIfNotExists(db);
  return db;
}
function createIfNotExists(db: Database): void {
  const tableExists = db
    .query(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`,
    )
    .get();
  if (tableExists) {
    return;
  }
  const queries = [
    // try to leverage name: server/endpoint style names, aka on the same "namespace" they should use the same prefix
    `CREATE TABLE ${tableName}(traceId TEXT PRIMARY KEY, name TEXT, startTime TEXT, endTime TEXT)`,
    `CREATE INDEX ${tableName}_name_index ON ${tableName}(name)`,
    `CREATE INDEX ${tableName}_startTime_index ON ${tableName}(startTime)`,
    `CREATE INDEX ${tableName}_endTime_index ON ${tableName}(endTime)`,

    `CREATE TABLE ${tableNameAttr}(traceId TEXT, name TEXT, value TEXT)`,
    `CREATE INDEX ${tableNameAttr}_traceId_index ON ${tableNameAttr}(traceId)`,
    `CREATE INDEX ${tableNameAttr}_name_index ON ${tableNameAttr}(name)`,
    `CREATE UNIQUE INDEX ${tableNameAttr}_traceId_name_index ON ${tableNameAttr}(traceId, name)`,
    // No value index cause we assume that we will always filter by atleast name or traceId

    `CREATE TABLE ${tableNameMetric}(traceId TEXT, name TEXT, type Text, value TEXT)`,
    `CREATE INDEX ${tableNameMetric}_metric_traceId_index ON ${tableNameMetric}(traceId)`,
    `CREATE INDEX ${tableNameMetric}_metric_name_index ON ${tableNameMetric}(name)`,
    // No type or value index cause we assume that we will always filter by atleast name or traceId
  ];
  for (const query of queries) {
    db.query(query).run();
  }
}
