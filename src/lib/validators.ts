// src/lib/validators.ts
import { z } from "zod";

export const NodeTypeSchema = z.enum(["text", "image", "video", "llm", "crop", "extract"]);

export const WorkflowNodeSchema = z.object({
  id: z.string(),
  type: NodeTypeSchema,
  label: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  value: z.any(),
  output: z.string().nullable(),
  status: z.enum(["idle", "running", "success", "failed"]),
});

export const WorkflowEdgeSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  fromHandle: z.string().optional(),
  toHandle: z.string().optional(),
});

export const SaveWorkflowSchema = z.object({
  workflowId: z.string().optional(),
  name: z.string().min(1).max(100),
  nodes: z.array(WorkflowNodeSchema),
  edges: z.array(WorkflowEdgeSchema),
});

export const RunWorkflowSchema = z.object({
  workflowId: z.string(),
  scope: z.enum(["FULL", "SINGLE", "SELECTED"]),
  nodeIds: z.array(z.string()).optional(),
});

export const LLMNodeValueSchema = z.object({
  model: z.string(),
  systemPrompt: z.string().optional().default(""),
  userMessage: z.string().optional().default(""),
});

export const CropNodeValueSchema = z.object({
  x: z.number().min(0).max(100).default(10),
  y: z.number().min(0).max(100).default(10),
  width: z.number().min(1).max(100).default(80),
  height: z.number().min(1).max(100).default(80),
});

export const ExtractFrameValueSchema = z.object({
  timestamp: z.string().default("50%"),
  videoUrl: z.string().url().optional(),
});
