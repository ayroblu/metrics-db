import { expect, test, beforeAll, afterEach } from "bun:test";
import { execSync } from "child_process";
import { existsSync, unlinkSync } from "node:fs";
import { logs } from "../lib/views/logs";
import { getTrace } from "../lib/views/traces";
import path from "path";
import { getMetrics } from "../lib/views/metrics";

const testDbPath = path.resolve(
  path.dirname(import.meta.path),
  "input.test.sqlite",
);
globalThis.dbPath = testDbPath;
process.env.DB_PATH = testDbPath;
beforeAll(() => {
  if (existsSync(testDbPath)) {
    unlinkSync(testDbPath);
  }
});
afterEach(() => {
  unlinkSync(testDbPath);
});
test("Metrics are inserted into the DB", async () => {
  const trace = {
    traceId: "first",
    name: "todo",
    startTime: "2024-01-06T20:57:58.015Z",
    endTime: null,
  };
  const attr = { traceId: "first", name: "git log", value: "2 entries" };
  const metric = {
    traceId: "first",
    name: "todo/count",
    type: "counter",
    value: 2,
  };

  const startTime = new Date(Date.now() - 2000);
  if (startTime.getTime() % 1000 > 900) {
    await wait(100);
  }
  execSync('./bin/trace.ts "$INPUT"', {
    env: { ...process.env, INPUT: JSON.stringify(trace) },
  });
  execSync('./bin/attr.ts "$INPUT"', {
    env: { ...process.env, INPUT: JSON.stringify(attr) },
  });
  execSync('./bin/metric.ts "$INPUT"', {
    env: { ...process.env, INPUT: JSON.stringify(metric) },
  });

  const logResults = logs();
  expect(logResults).toEqual([expect.objectContaining(attr)]);
  const traceResult = getTrace("first");
  expect(traceResult).toEqual({
    ...trace,
    attrs: [expect.objectContaining(attr)],
    metrics: [expect.objectContaining(metric)],
  });

  const metricsResult = getMetrics({
    name: "todo/%",
    startTime,
    endTime: null,
    groupType: "sum",
    incrementSize: "secs",
  });
  expect(metricsResult.timestamps).toHaveLength(2);
  expect(metricsResult.datapoints).toEqual([["todo/count", [null, 2]]]);

  const traceEnd = {
    ...trace,
    endTime: "2024-01-06T20:57:59.015Z",
  };
  execSync('./bin/trace.ts "$INPUT"', {
    env: { ...process.env, INPUT: JSON.stringify(traceEnd) },
  });
  execSync('./bin/metric.ts "$INPUT"', {
    env: { ...process.env, INPUT: JSON.stringify(metric) },
  });

  const traceResult2 = getTrace("first");
  expect(traceResult2).toEqual({
    ...traceEnd,
    attrs: [expect.objectContaining(attr)],
    metrics: [expect.objectContaining(metric), expect.objectContaining(metric)],
  });

  const metricsResult2 = getMetrics({
    name: "todo/%",
    startTime,
    endTime: null,
    groupType: "sum",
    incrementSize: "secs",
  });
  expect(metricsResult2.timestamps).toHaveLength(2);
  expect(metricsResult2.datapoints).toEqual([["todo/count", [null, 4]]]);
});
function wait(numMillis: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, numMillis));
}
