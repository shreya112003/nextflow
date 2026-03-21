// src/store/workflow.ts
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { WorkflowNode, WorkflowEdge, WorkflowRunEntry } from "@/types";

interface WorkflowStore {
  // Workflow identity
  workflowId: string | null;
  workflowName: string;

  // Canvas state
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;

  // Execution
  isRunning: boolean;
  history: WorkflowRunEntry[];

  // Canvas viewport
  pan: { x: number; y: number };
  zoom: number;

  // Undo/redo stacks
  past: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }[];
  future: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }[];

  // Actions
  setWorkflowId: (id: string) => void;
  setWorkflowName: (name: string) => void;
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;
  addNode: (node: WorkflowNode) => void;
  updateNode: (id: string, patch: Partial<WorkflowNode>) => void;
  deleteNode: (id: string) => void;
  addEdge: (edge: WorkflowEdge) => void;
  deleteEdge: (id: string) => void;
  setSelectedNode: (id: string | null) => void;
  setIsRunning: (v: boolean) => void;
  setNodeStatuses: (statuses: Record<string, WorkflowNode["status"]>) => void;
  setNodeOutput: (id: string, output: string | null) => void;
  resetStatuses: () => void;
  addHistoryEntry: (entry: WorkflowRunEntry) => void;
  setHistory: (entries: WorkflowRunEntry[]) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setZoom: (zoom: number) => void;
  undo: () => void;
  redo: () => void;
  loadWorkflow: (data: { id: string; name: string; nodes: WorkflowNode[]; edges: WorkflowEdge[]; history: WorkflowRunEntry[] }) => void;
}

export const useWorkflowStore = create<WorkflowStore>()(
  immer((set) => ({
    workflowId: null,
    workflowName: "Untitled Workflow",
    nodes: [],
    edges: [],
    selectedNodeId: null,
    isRunning: false,
    history: [],
    pan: { x: 0, y: 0 },
    zoom: 0.85,
    past: [],
    future: [],

    setWorkflowId: (id) => set((s) => { s.workflowId = id; }),
    setWorkflowName: (name) => set((s) => { s.workflowName = name; }),

    setNodes: (nodes) => set((s) => { s.nodes = nodes; }),
    setEdges: (edges) => set((s) => { s.edges = edges; }),

    addNode: (node) =>
      set((s) => {
        s.past.push({ nodes: [...s.nodes], edges: [...s.edges] });
        s.future = [];
        s.nodes.push(node);
      }),

    updateNode: (id, patch) =>
      set((s) => {
        const idx = s.nodes.findIndex((n) => n.id === id);
        if (idx !== -1) Object.assign(s.nodes[idx], patch);
      }),

    deleteNode: (id) =>
      set((s) => {
        s.past.push({ nodes: [...s.nodes], edges: [...s.edges] });
        s.future = [];
        s.nodes = s.nodes.filter((n) => n.id !== id);
        s.edges = s.edges.filter((e) => e.from !== id && e.to !== id);
        if (s.selectedNodeId === id) s.selectedNodeId = null;
      }),

    addEdge: (edge) =>
      set((s) => {
        s.past.push({ nodes: [...s.nodes], edges: [...s.edges] });
        s.future = [];
        s.edges.push(edge);
      }),

    deleteEdge: (id) =>
      set((s) => {
        s.edges = s.edges.filter((e) => e.id !== id);
      }),

    setSelectedNode: (id) => set((s) => { s.selectedNodeId = id; }),
    setIsRunning: (v) => set((s) => { s.isRunning = v; }),

    setNodeStatuses: (statuses) =>
      set((s) => {
        for (const node of s.nodes) {
          if (statuses[node.id]) node.status = statuses[node.id];
        }
      }),

    setNodeOutput: (id, output) =>
      set((s) => {
        const node = s.nodes.find((n) => n.id === id);
        if (node) node.output = output;
      }),

    resetStatuses: () =>
      set((s) => {
        for (const node of s.nodes) {
          node.status = "idle";
          node.output = null;
        }
      }),

    addHistoryEntry: (entry) =>
      set((s) => {
        s.history.unshift(entry);
      }),

    setHistory: (entries) => set((s) => { s.history = entries; }),
    setPan: (pan) => set((s) => { s.pan = pan; }),
    setZoom: (zoom) => set((s) => { s.zoom = zoom; }),

    undo: () =>
      set((s) => {
        const prev = s.past.pop();
        if (!prev) return;
        s.future.push({ nodes: [...s.nodes], edges: [...s.edges] });
        s.nodes = prev.nodes;
        s.edges = prev.edges;
      }),

    redo: () =>
      set((s) => {
        const next = s.future.pop();
        if (!next) return;
        s.past.push({ nodes: [...s.nodes], edges: [...s.edges] });
        s.nodes = next.nodes;
        s.edges = next.edges;
      }),

    loadWorkflow: ({ id, name, nodes, edges, history }) =>
      set((s) => {
        s.workflowId = id;
        s.workflowName = name;
        s.nodes = nodes;
        s.edges = edges;
        s.history = history;
        s.past = [];
        s.future = [];
        s.selectedNodeId = null;
      }),
  }))
);
