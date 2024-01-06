#!/usr/bin/env bun
import { z } from "zod";
import { addTraceAttributes } from "../lib/api/attr";
import { parseJson } from "../lib/parse";

export type TraceAttrParams = z.infer<typeof traceAttrParamsSchema>;

const traceAttrParamsSchema = z.object({
  traceId: z.string(),
  name: z.string(),
  value: z.string(),
});
const input = parseJson(process.argv[2]);
const params = traceAttrParamsSchema.parse(input);

addTraceAttributes(params);
