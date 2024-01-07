import { expect, test, setSystemTime, beforeAll, afterEach } from "bun:test";
import { execSync } from "child_process";
import { existsSync, unlinkSync } from "node:fs";
import { logs } from "../lib/views/logs";
import { getTrace } from "../lib/views/traces";
import path from "path";

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
test("Metrics are inserted into the DB", () => {
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
  expect(traceResult).toEqual(
    expect.objectContaining({
      ...trace,
      attrs: [expect.objectContaining(attr)],
      metrics: [expect.objectContaining(metric)],
    }),
  );
});
