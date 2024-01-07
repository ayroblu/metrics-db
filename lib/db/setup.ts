import { Database } from "bun:sqlite";
import { tableName, tableNameAttr, tableNameMetric } from "./constants";
import path from "path";

declare global {
  var dbPath: string | undefined;
}

let db: Database | undefined;
export function getDb(): Database {
  if (db) return db;
  const dbPath =
    process.env.DB_PATH ??
    globalThis.dbPath ??
    path.resolve(
      path.dirname(import.meta.path),
      "..",
      "..",
      "observability.sqlite",
    );
  db = new Database(dbPath);
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
    `CREATE TABLE ${tableName}(traceId TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, startTime TEXT, endTime TEXT) STRICT`,
    `CREATE INDEX ${tableName}_name_index ON ${tableName}(name)`,
    `CREATE INDEX ${tableName}_startTime_index ON ${tableName}(startTime)`,
    `CREATE INDEX ${tableName}_endTime_index ON ${tableName}(endTime)`,

    `CREATE TABLE ${tableNameAttr}(traceId TEXT NOT NULL, name TEXT NOT NULL, value TEXT NOT NULL, createdAt INTEGER NOT NULL) STRICT`,
    `CREATE INDEX ${tableNameAttr}_traceId_index ON ${tableNameAttr}(traceId)`,
    `CREATE INDEX ${tableNameAttr}_name_index ON ${tableNameAttr}(name)`,
    `CREATE INDEX ${tableNameAttr}_value ON ${tableNameAttr}(value)`,
    `CREATE INDEX ${tableNameAttr}_createdAt_index ON ${tableNameAttr}(createdAt)`,
    `CREATE UNIQUE INDEX ${tableNameAttr}_traceId_name_index ON ${tableNameAttr}(traceId, name)`,

    `CREATE TABLE ${tableNameMetric}(traceId TEXT NOT NULL, name TEXT NOT NULL, type TEXT NOT NULL, value REAL NOT NULL, createdAt INTEGER NOT NULL) STRICT`,
    `CREATE INDEX ${tableNameMetric}_metric_traceId_index ON ${tableNameMetric}(traceId)`,
    `CREATE INDEX ${tableNameMetric}_metric_name_index ON ${tableNameMetric}(name)`,
    `CREATE INDEX ${tableNameMetric}_metric_createdAt_index ON ${tableNameMetric}(createdAt)`,
    // No type or value index cause we assume that we will always filter by atleast name or traceId
  ];
  for (const query of queries) {
    db.query(query).run();
  }
}

export type TraceTable = {
  traceId: string;
  name: string;
  startTime: string | null;
  endTime: string | null;
};
export type AttrTable = {
  traceId: string;
  name: string;
  value: string;
  createdAt: number;
};
export type MetricsTable = {
  traceId: string;
  name: string;
  type: string;
  value: number;
  createdAt: number;
};
