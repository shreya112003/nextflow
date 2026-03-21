// src/lib/dag.ts
// Topological sort + parallel execution engine for the workflow DAG

import type { WorkflowNode, WorkflowEdge } from "@/types";

export interface ExecutionPlan {
  /** Ordered tiers — nodes within the same tier can run in parallel */
  tiers: string[][];
}

/**
 * Build a topological execution plan from nodes + edges.
 * Uses Kahn's algorithm (BFS).
 * Nodes in the same tier have no dependency between each other → run concurrently.
 */
export function buildExecutionPlan(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  targetNodeIds?: string[]
): ExecutionPlan {
  const ids = targetNodeIds ?? nodes.map((n) => n.id);
  const idSet = new Set(ids);

  // Build in-degree map and adjacency list restricted to target nodes
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>(); // node → nodes that depend on it

  for (const id of ids) {
    inDegree.set(id, 0);
    dependents.set(id, []);
  }

  for (const edge of edges) {
    if (idSet.has(edge.from) && idSet.has(edge.to)) {
      inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1);
      dependents.get(edge.from)!.push(edge.to);
    }
  }

  const tiers: string[][] = [];
  let queue = ids.filter((id) => inDegree.get(id) === 0);

  while (queue.length > 0) {
    tiers.push([...queue]);
    const next: string[] = [];
    for (const id of queue) {
      for (const dep of dependents.get(id) ?? []) {
        const deg = (inDegree.get(dep) ?? 1) - 1;
        inDegree.set(dep, deg);
        if (deg === 0) next.push(dep);
      }
    }
    queue = next;
  }

  return { tiers };
}

/**
 * Resolve the input value for a node handle, by looking up connected node outputs.
 */
export function resolveInputs(
  nodeId: string,
  edges: WorkflowEdge[],
  nodeOutputs: Map<string, string | null>
): { [handle: string]: string | null } {
  const inputs: { [handle: string]: string | null } = {};
  for (const edge of edges) {
    if (edge.to === nodeId) {
      const handle = edge.toHandle ?? "default";
      inputs[handle] = nodeOutputs.get(edge.from) ?? null;
    }
  }
  return inputs;
}
