#!/usr/bin/env bun
import { z } from "zod";
import { addTraceAttributes } from "../lib/api/attr";

export type TraceAttrParams = z.infer<typeof traceAttrParamsSchema>;

const traceAttrParamsSchema = z.object({
  traceId: z.string(),
  name: z.string(),
  value: z.string(),
});
const input = process.argv[2];
const params = traceAttrParamsSchema.parse(input);

addTraceAttributes(params);
