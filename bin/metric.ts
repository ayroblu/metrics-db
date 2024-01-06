#!/usr/bin/env bun
import { z } from "zod";
import { addTraceMetrics } from "../lib/api/metric";

export type TraceMetricsParams = z.infer<typeof traceMetricsParamsSchema>;

const traceMetricsParamsSchema = z.object({
  traceId: z.string(),
  name: z.string(),
  type: z.union([z.literal("counter"), z.literal("stat"), z.literal("gauge")]),
  value: z.number(),
});
const input = process.argv[2];
const params = traceMetricsParamsSchema.parse(input);

addTraceMetrics(params);
