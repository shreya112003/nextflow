// src/types/index.ts

export type NodeType = "text" | "image" | "video" | "llm" | "crop" | "extract";

export type NodeStatus = "idle" | "running" | "success" | "failed";

export interface TextNodeValue {
  content: string;
}

export interface LLMNodeValue {
  model: string;
  systemPrompt: string;
  userMessage: string;
}

export interface CropNodeValue {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExtractFrameNodeValue {
  timestamp: string; // e.g. "50%" or "10" (seconds)
}

export interface MediaNodeValue {
  url: string | null;
  fileName: string | null;
  mimeType: string | null;
}

export type NodeValue =
  | TextNodeValue
  | LLMNodeValue
  | CropNodeValue
  | ExtractFrameNodeValue
  | MediaNodeValue
  | null;

export interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  value: NodeValue;
  output: string | null;
  status: NodeStatus;
}

export interface WorkflowEdge {
  id: string;
  from: string;
  to: string;
  fromHandle?: string;
  toHandle?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NodeResultEntry {
  nodeId: string;
  nodeType: string;
  nodeLabel: string;
  status: "RUNNING" | "SUCCESS" | "FAILED";
  output?: string;
  error?: string;
  durationMs?: number;
}

export interface WorkflowRunEntry {
  id: string;
  scope: "FULL" | "SINGLE" | "SELECTED";
  status: "RUNNING" | "SUCCESS" | "FAILED" | "PARTIAL";
  duration?: number;
  nodeIds: string[];
  createdAt: Date;
  finishedAt?: Date;
  nodeResults: NodeResultEntry[];
}

// Zod-validated API payloads
export interface SaveWorkflowPayload {
  workflowId?: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface RunWorkflowPayload {
  workflowId: string;
  scope: "FULL" | "SINGLE" | "SELECTED";
  nodeIds?: string[]; // for SINGLE / SELECTED
}
