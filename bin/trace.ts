#!/usr/bin/env bun
import { z } from "zod";
import { addTrace } from "../lib/api/trace";
import { parseJson } from "../lib/parse";

export type TraceParams = z.infer<typeof traceParamsSchema>;

const traceParamsSchema = z.object({
  traceId: z.string(),
  name: z.string(),
  startTime: z.union([z.string(), z.null()]),
  endTime: z.union([z.string(), z.null()]),
});
const input = parseJson(process.argv[2]);
const params = traceParamsSchema.parse(input);

addTrace(params);
