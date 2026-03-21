// src/hooks/useSaveWorkflow.ts
"use client";
import { useCallback, useEffect, useRef } from "react";
import { useWorkflowStore } from "@/store/workflow";

export function useSaveWorkflow() {
  const store = useWorkflowStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);

  const save = useCallback(async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId: store.workflowId ?? undefined,
          name: store.workflowName,
          nodes: store.nodes,
          edges: store.edges,
        }),
      });
      const data = await res.json();
      if (data.workflow?.id && !store.workflowId) {
        store.setWorkflowId(data.workflow.id);
      }
    } catch (e) {
      console.error("Auto-save failed:", e);
    } finally {
      savingRef.current = false;
    }
  }, [store]);

  // Debounced auto-save on node/edge changes
  const debouncedSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, 2000);
  }, [save]);

  useEffect(() => {
    debouncedSave();
  }, [store.nodes, store.edges, store.workflowName]);

  return { save };
}
