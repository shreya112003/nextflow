// src/components/ui/RightSidebar.tsx
"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { useWorkflowStore } from "@/store/workflow";
import type { WorkflowRunEntry, NodeResultEntry } from "@/types";

export default function RightSidebar() {
  const [open, setOpen] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const history = useWorkflowStore((s) => s.history);

  return (
    <div
      style={{ width: open ? 264 : 44 }}
      className="bg-[#111118] border-l border-[#1e1e2e] flex-shrink-0 flex flex-col transition-all duration-200 overflow-hidden"
    >
      <div className="flex items-center justify-between px-2.5 py-2.5 border-b border-[#1e1e2e]">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-6 h-6 flex items-center justify-center rounded text-[#6b7280] hover:text-[#a0a0b8] hover:bg-[#1a1a2a] transition-all"
        >
          {open ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        {open && (
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6b7280] ml-1">
            History
          </span>
        )}
        {open && (
          <span className="text-[10px] text-[#3a3a5a] ml-auto">
            {history.length} run{history.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {open && (
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
          {history.length === 0 && (
            <div className="text-center mt-8 text-[11px] text-[#3a3a5a]">
              No runs yet.<br />Press Run Workflow to start.
            </div>
          )}
          {history.map((run) => (
            <RunCard
              key={run.id}
              run={run}
              expanded={expandedId === run.id}
              onToggle={() => setExpandedId(expandedId === run.id ? null : run.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RunCard({ run, expanded, onToggle }: {
  run: WorkflowRunEntry; expanded: boolean; onToggle: () => void;
}) {
  const statusIcon = {
    SUCCESS: <CheckCircle2 size={10} className="text-emerald-400" />,
    FAILED:  <XCircle     size={10} className="text-red-400" />,
    PARTIAL: <AlertCircle size={10} className="text-amber-400" />,
    RUNNING: <Clock       size={10} className="text-amber-400 animate-spin" />,
  }[run.status];

  const scopeLabel = { FULL: "Full run", SINGLE: "Single node", SELECTED: "Selected" }[run.scope];

  return (
    <div className="rounded-lg border border-[#1e1e2e] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-[#1a1a2a] transition-colors"
      >
        {statusIcon}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-medium text-[#c0c0d8] truncate">
            {new Date(run.createdAt).toLocaleString("en-US", {
              month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
            })}
          </div>
          <div className="text-[9px] text-[#6b7280]">
            {scopeLabel} · {run.duration ? run.duration.toFixed(1) + "s" : "—"}
          </div>
        </div>
        <span className="text-[9px] text-[#3a3a5a]">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="border-t border-[#1e1e2e] bg-[#0f0f1a] px-3 py-2">
          {run.nodeResults.map((nr, i) => (
            <NodeResultRow key={nr.nodeId} result={nr} isLast={i === run.nodeResults.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function NodeResultRow({ result, isLast }: { result: NodeResultEntry; isLast: boolean }) {
  const [showOutput, setShowOutput] = useState(false);

  const statusDot = (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1"
      style={{ background: result.status === "SUCCESS" ? "#10b981" : result.status === "FAILED" ? "#ef4444" : "#f59e0b" }}
    />
  );

  return (
    <div className="flex gap-2 mb-2 text-[10px]">
      <div className="flex flex-col items-center">
        <span className="text-[#2a2a4a] text-[10px]">{isLast ? "└" : "├"}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="flex items-center gap-1.5 cursor-pointer"
          onClick={() => result.output && setShowOutput((v) => !v)}
        >
          {statusDot}
          <span className="font-medium text-[#a0a0b8] truncate">{result.nodeLabel}</span>
          <span className="text-[#4b5563] ml-auto flex-shrink-0">
            {result.durationMs ? (result.durationMs / 1000).toFixed(1) + "s" : "—"}
          </span>
        </div>
        {result.error && (
          <div className="mt-0.5 text-red-400 text-[9px] italic truncate">{result.error}</div>
        )}
        {showOutput && result.output && (
          <div className="mt-1 text-[9px] text-emerald-400 font-mono bg-[#0a0a14] rounded p-1.5 break-all leading-relaxed">
            {result.output.slice(0, 200)}{result.output.length > 200 ? "…" : ""}
          </div>
        )}
        {result.output && !showOutput && (
          <div className="text-[9px] text-[#3a3a5a] italic truncate mt-0.5">
            {result.output.slice(0, 50)}{result.output.length > 50 ? "…" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
