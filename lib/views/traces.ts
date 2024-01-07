import { tableName, tableNameAttr, tableNameMetric } from "../db/constants";
import {
  getDb,
  type AttrTable,
  type TraceTable,
  type MetricsTable,
} from "../db/setup";

type TraceResult = TraceTable & {
  attrs: AttrTable[];
  metrics: MetricsTable[];
};

export function getTrace(traceId: string): TraceResult {
  const db = getDb();
  const query = db.query(
    `SELECT * FROM ${tableName}
WHERE traceId=$traceId`,
  );
  const trace = query.get({ $traceId: traceId }) as TraceTable;
  const attrQuery = db.query(
    `SELECT * FROM ${tableNameAttr}
WHERE traceId=$traceId`,
  );
  const attrs = attrQuery.all({ $traceId: traceId }) as AttrTable[];
  const metricQuery = db.query(
    `SELECT * FROM ${tableNameMetric}
WHERE traceId=$traceId`,
  );
  const metrics = metricQuery.all({ $traceId: traceId }) as MetricsTable[];

  return { ...trace, attrs, metrics };
}
