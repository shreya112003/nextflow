// src/hooks/useRunWorkflow.ts
"use client";
import { useCallback } from "react";
import { useWorkflowStore } from "@/store/workflow";
import type { WorkflowRunEntry } from "@/types";

export function useRunWorkflow() {
  const store = useWorkflowStore();

  const run = useCallback(
    async (scope: "FULL" | "SINGLE" | "SELECTED", nodeIds?: string[]) => {
      if (!store.workflowId || store.isRunning) return;

      // First save current state
      await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId: store.workflowId,
          name: store.workflowName,
          nodes: store.nodes,
          edges: store.edges,
        }),
      });

      store.setIsRunning(true);
      store.resetStatuses();

      try {
        const response = await fetch("/api/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workflowId: store.workflowId,
            scope,
            nodeIds,
          }),
        });

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let runId: string | null = null;
        const nodeResultsMap: Record<string, any> = {};

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

          for (const line of lines) {
            try {
              const event = JSON.parse(line.slice(6));

              if (event.type === "run_started") {
                runId = event.runId;
              } else if (event.type === "node_started") {
                store.updateNode(event.nodeId, { status: "running" });
              } else if (event.type === "node_done") {
                const status = event.status === "SUCCESS" ? "success" : "failed";
                store.updateNode(event.nodeId, { status, output: event.output ?? null });
                nodeResultsMap[event.nodeId] = event;
              } else if (event.type === "run_complete") {
                // Build history entry
                const overallStatus =
                  event.status === "SUCCESS"
                    ? "SUCCESS"
                    : event.status === "PARTIAL"
                    ? "PARTIAL"
                    : "FAILED";

                const targetNodes =
                  scope === "FULL"
                    ? store.nodes
                    : store.nodes.filter((n) => nodeIds?.includes(n.id));

                const entry: WorkflowRunEntry = {
                  id: runId ?? `run-${Date.now()}`,
                  scope,
                  status: overallStatus,
                  duration: event.duration,
                  nodeIds: targetNodes.map((n) => n.id),
                  createdAt: new Date(),
                  nodeResults: targetNodes.map((n) => {
                    const r = nodeResultsMap[n.id];
                    return {
                      nodeId: n.id,
                      nodeType: n.type,
                      nodeLabel: n.label,
                      status: r ? (r.status as "SUCCESS" | "FAILED") : "SUCCESS",
                      output: r?.output,
                      error: r?.error,
                      durationMs: r?.durationMs,
                    };
                  }),
                };

                store.addHistoryEntry(entry);
              } else if (event.type === "run_error") {
                console.error("Run error:", event.error);
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      } catch (e) {
        console.error("Run failed:", e);
      } finally {
        store.setIsRunning(false);
      }
    },
    [store]
  );

  return { run, isRunning: store.isRunning };
}
