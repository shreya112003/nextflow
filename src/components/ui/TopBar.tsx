// src/components/ui/TopBar.tsx
"use client";
import { UserButton } from "@clerk/nextjs";
import { Play, Save, Undo2, Redo2, Download, Loader2 } from "lucide-react";

interface Props {
  workflowName: string;
  onNameChange: (v: string) => void;
  isRunning: boolean;
  onRun: () => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export default function TopBar({
  workflowName, onNameChange, isRunning,
  onRun, onSave, onUndo, onRedo, onExport,
  canUndo, canRedo,
}: Props) {
  return (
    <div className="h-12 bg-[#111118] border-b border-[#1e1e2e] flex items-center px-4 gap-3 flex-shrink-0 z-10">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-2">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#7c6af7] to-[#3b82f6] flex items-center justify-center text-white font-bold text-xs">
          N
        </div>
        <span className="font-semibold text-sm tracking-tight text-white hidden sm:block">NextFlow</span>
      </div>

      {/* Workflow name */}
      <input
        value={workflowName}
        onChange={(e) => onNameChange(e.target.value)}
        className="bg-transparent text-sm font-medium text-[#c0c0d8] border-none outline-none w-48 truncate hover:text-white focus:text-white transition-colors"
        maxLength={60}
      />

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <IconBtn onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
          <Undo2 size={14} />
        </IconBtn>
        <IconBtn onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">
          <Redo2 size={14} />
        </IconBtn>
        <div className="w-px h-5 bg-[#2a2a3a] mx-1" />
        <IconBtn onClick={onExport} title="Export JSON">
          <Download size={14} />
        </IconBtn>
        <IconBtn onClick={onSave} title="Save">
          <Save size={14} />
        </IconBtn>
        <div className="w-px h-5 bg-[#2a2a3a] mx-1" />
        <button
          onClick={isRunning ? undefined : onRun}
          disabled={isRunning}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#7c6af7]/20 border border-[#7c6af7]/40 text-[#a090f8] text-xs font-medium hover:bg-[#7c6af7]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
          {isRunning ? "Running…" : "Run Workflow"}
        </button>
      </div>

      <div className="ml-2">
        <UserButton afterSignOutUrl="/" />
      </div>
    </div>
  );
}

function IconBtn({ onClick, disabled, title, children }: {
  onClick: () => void; disabled?: boolean; title?: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={title}
      className="w-7 h-7 rounded-md flex items-center justify-center text-[#8080a0] hover:text-[#c0c0d8] hover:bg-[#1a1a2a] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}
