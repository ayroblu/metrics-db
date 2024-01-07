import { tableNameMetric } from "../db/constants";
import { getDb, type MetricsTable } from "../db/setup";

type MetricsResult = {
  timestamps: number[];
  datapoints: [name: string, values: (number | null)[]][];
};

type MetricsQuery = {
  name: string;
  startTime: Date;
  endTime: Date | null;
  incrementSize: "secs" | "mins" | "hours" | "days";
  groupType: "sum" | "avg" | "p95";
};
export function getMetrics({
  name,
  startTime,
  endTime,
  incrementSize,
  groupType,
}: MetricsQuery): MetricsResult {
  const db = getDb();
  const metricQuery = db.query(
    `SELECT * FROM ${tableNameMetric}
WHERE 1=1
  AND createdAt >= $startTime
  ${endTime ? "AND createdAt <= $endTime" : ""}
  AND name LIKE $name
`,
  );
  const metrics = metricQuery.all({
    $startTime: startTime.getTime(),
    ...(endTime ? { $endTime: endTime.getTime() } : {}),
    $name: name,
  }) as MetricsTable[];
  const timestamps = getTimestamps(startTime, endTime, incrementSize);
  const incrementSizeMs = increments[incrementSize];
  const datapoints = groupMetrics(
    metrics,
    groupType,
    timestamps[0] ?? startTime.getTime(),
    incrementSizeMs,
    timestamps.length,
  );

  return { timestamps, datapoints };
}
function getTimestamps(
  startTime: Date,
  endTime: Date | null,
  incrementSize: MetricsQuery["incrementSize"],
): number[] {
  const incrementSizeMs = increments[incrementSize];
  const startTimeMs = startTime.getTime();
  const endTimeMs = endTime?.getTime() ?? Date.now();
  const remainderStart = modUp(startTimeMs, incrementSizeMs);
  const timestamps = [];
  for (
    let i = startTimeMs + remainderStart;
    i < endTimeMs;
    i += incrementSizeMs
  ) {
    timestamps.push(i);
  }
  return timestamps;
}
function modUp(left: number, right: number): number {
  const mod = left % right;
  return mod === 0 ? 0 : right - mod;
}

function groupMetrics(
  metrics: MetricsTable[],
  groupType: MetricsQuery["groupType"],
  startTimeMs: number,
  incrementSizeMs: number,
  numIncrements: number,
): MetricsResult["datapoints"] {
  const results: Record<string, (number | null)[]> = {};
  const avgMetadata: Record<string, number[]> = {};
  const percentileMetadata: Record<string, number[][]> = {};
  for (const metric of metrics) {
    if (!results[metric.name]) {
      results[metric.name] = Array(numIncrements).fill(null);
      if (groupType === "avg") {
        avgMetadata[metric.name] = Array(numIncrements).fill(0);
      } else if (groupType === "p95") {
        percentileMetadata[metric.name] = Array(numIncrements)
          .fill(null)
          .map(() => [] as number[]);
      }
    }
    const bucket = Math.floor(
      (metric.createdAt - startTimeMs) / incrementSizeMs,
    );
    if (bucket < 0) continue;
    const existingValue = results[metric.name][bucket];
    if (existingValue === null) {
      results[metric.name][bucket] = metric.value;
    } else {
      switch (groupType) {
        case "sum":
          results[metric.name][bucket] = existingValue + metric.value;
          break;
        case "avg":
          avgMetadata[metric.name][bucket] += 1;
          results[metric.name][bucket] =
            existingValue +
            (metric.value - existingValue) / avgMetadata[metric.name][bucket];
          break;
        case "p95":
          percentileMetadata[metric.name][bucket].push(metric.value);
          break;
      }
    }
  }
  if (groupType === "p95") {
    Object.entries(results).forEach(([key, value]) => {
      for (let i = 0; i < value.length; ++i) {
        percentileMetadata[key][i].sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));
        const items = percentileMetadata[key][i];
        value[i] =
          percentileMetadata[key][i][getPercentileIndex(items.length, 0.95)];
      }
    });
  }
  return Object.entries(results);
}
function getPercentileIndex(length: number, percentile: number): number {
  return Math.floor(percentile * length);
}

const increments: Record<MetricsQuery["incrementSize"], number> = {
  secs: 1000,
  mins: 60 * 1000,
  hours: 60 * 60 * 1000,
  days: 24 * 60 * 60 * 1000,
};
