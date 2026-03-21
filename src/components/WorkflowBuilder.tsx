// src/components/WorkflowBuilder.tsx
"use client";
import { useEffect } from "react";
import { useWorkflowStore } from "@/store/workflow";
import { useSaveWorkflow } from "@/hooks/useSaveWorkflow";
import { useRunWorkflow } from "@/hooks/useRunWorkflow";
import TopBar from "./ui/TopBar";
import LeftSidebar from "./ui/LeftSidebar";
import RightSidebar from "./ui/RightSidebar";
import WorkflowCanvas from "./canvas/WorkflowCanvas";
import NodeInspector from "./ui/NodeInspector";
import type { WorkflowRunEntry, WorkflowNode, WorkflowEdge } from "@/types";

interface Props {
  initialWorkflow: {
    id: string;
    name: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    history: WorkflowRunEntry[];
  };
}

export default function WorkflowBuilder({ initialWorkflow }: Props) {
  const store = useWorkflowStore();
  const { save } = useSaveWorkflow();
  const { run, isRunning } = useRunWorkflow();

  // Load initial data
  useEffect(() => {
    store.loadWorkflow(initialWorkflow);
  }, []);

  const selectedNode = store.nodes.find((n) => n.id === store.selectedNodeId) ?? null;

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] text-white overflow-hidden">
      <TopBar
        workflowName={store.workflowName}
        onNameChange={store.setWorkflowName}
        isRunning={isRunning}
        onRun={() => run("FULL")}
        onSave={save}
        onUndo={store.undo}
        onRedo={store.redo}
        onExport={() => {
          if (store.workflowId) window.open(`/api/workflows/${store.workflowId}/export`);
        }}
        canUndo={store.past.length > 0}
        canRedo={store.future.length > 0}
      />

      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <WorkflowCanvas />
        <RightSidebar />
      </div>

      {selectedNode && (
        <NodeInspector
          node={selectedNode}
          onClose={() => store.setSelectedNode(null)}
          onRunSingle={() => run("SINGLE", [selectedNode.id])}
        />
      )}
    </div>
  );
}
