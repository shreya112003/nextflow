// src/lib/sampleWorkflow.ts
import type { WorkflowNode, WorkflowEdge } from "@/types";

export const SAMPLE_NODES: WorkflowNode[] = [
  {
    id: "n1", type: "text", label: "System Prompt",
    x: 60, y: 80, width: 240, height: 140,
    value: { content: "You are a professional marketing copywriter. Generate a compelling one-paragraph product description." },
    output: null, status: "idle",
  },
  {
    id: "n2", type: "text", label: "Product Details",
    x: 60, y: 280, width: 240, height: 140,
    value: { content: "Product: Wireless Bluetooth Headphones\nFeatures: Noise cancellation, 30-hour battery, foldable design." },
    output: null, status: "idle",
  },
  {
    id: "n3", type: "image", label: "Product Photo",
    x: 60, y: 480, width: 240, height: 160,
    value: { url: null, fileName: null, mimeType: null },
    output: null, status: "idle",
  },
  {
    id: "n4", type: "crop", label: "Crop Image",
    x: 380, y: 80, width: 240, height: 180,
    value: { x: 10, y: 10, width: 80, height: 80 },
    output: null, status: "idle",
  },
  {
    id: "n5", type: "llm", label: "Product Description",
    x: 380, y: 320, width: 260, height: 210,
    value: { model: "gemini-1.5-flash", systemPrompt: "", userMessage: "" },
    output: null, status: "idle",
  },
  {
    id: "n6", type: "video", label: "Demo Video",
    x: 720, y: 80, width: 240, height: 160,
    value: { url: null, fileName: null, mimeType: null },
    output: null, status: "idle",
  },
  {
    id: "n7", type: "extract", label: "Extract Frame",
    x: 720, y: 300, width: 240, height: 160,
    value: { timestamp: "50%", videoUrl: "" },
    output: null, status: "idle",
  },
  {
    id: "n8", type: "llm", label: "Marketing Post",
    x: 720, y: 520, width: 260, height: 210,
    value: {
      model: "gemini-1.5-pro",
      systemPrompt: "You are a social media manager. Create a tweet-length marketing post based on the product image and video frame.",
      userMessage: "",
    },
    output: null, status: "idle",
  },
];

export const SAMPLE_EDGES: WorkflowEdge[] = [
  { id: "e1", from: "n3", to: "n4" },
  { id: "e2", from: "n1", to: "n5", toHandle: "system" },
  { id: "e3", from: "n2", to: "n5", toHandle: "user" },
  { id: "e4", from: "n4", to: "n5", toHandle: "image" },
  { id: "e5", from: "n6", to: "n7" },
  { id: "e6", from: "n5", to: "n8", toHandle: "user" },
  { id: "e7", from: "n7", to: "n8", toHandle: "image" },
  { id: "e8", from: "n1", to: "n8", toHandle: "system" },
];
