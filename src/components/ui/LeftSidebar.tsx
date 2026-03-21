// src/components/ui/LeftSidebar.tsx
"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useWorkflowStore } from "@/store/workflow";
import type { NodeType, WorkflowNode } from "@/types";

const NODE_DEFS: { type: NodeType; label: string; icon: string; color: string; desc: string }[] = [
  { type: "text",    label: "Text",          icon: "T",  color: "#7c6af7", desc: "Text input or prompt" },
  { type: "image",   label: "Upload Image",  icon: "🖼", color: "#3b82f6", desc: "Upload & preview image" },
  { type: "video",   label: "Upload Video",  icon: "▶", color: "#10b981", desc: "Upload & preview video" },
  { type: "llm",     label: "Run LLM",       icon: "✦", color: "#f59e0b", desc: "Gemini model execution" },
  { type: "crop",    label: "Crop Image",    icon: "⊞", color: "#ec4899", desc: "FFmpeg crop via Trigger.dev" },
  { type: "extract", label: "Extract Frame", icon: "⎯", color: "#8b5cf6", desc: "FFmpeg frame extraction" },
];

let _nodeCounter = 200;
const nextId = () => `node-${++_nodeCounter}`;

const DEFAULT_VALUES: Record<NodeType, any> = {
  text:    { content: "" },
  image:   { url: null, fileName: null, mimeType: null },
  video:   { url: null, fileName: null, mimeType: null },
  llm:     { model: "gemini-1.5-flash", systemPrompt: "", userMessage: "" },
  crop:    { x: 10, y: 10, width: 80, height: 80 },
  extract: { timestamp: "50%", videoUrl: "" },
};

const DEFAULT_SIZES: Record<NodeType, { w: number; h: number }> = {
  text:    { w: 240, h: 140 },
  image:   { w: 240, h: 170 },
  video:   { w: 240, h: 170 },
  llm:     { w: 260, h: 220 },
  crop:    { w: 240, h: 190 },
  extract: { w: 240, h: 165 },
};

export default function LeftSidebar() {
  const [open, setOpen] = useState(true);
  const [search, setSearch] = useState("");
  const store = useWorkflowStore();

  const filtered = NODE_DEFS.filter(
    (n) =>
      !search ||
      n.label.toLowerCase().includes(search.toLowerCase()) ||
      n.desc.toLowerCase().includes(search.toLowerCase())
  );

  const addNode = (type: NodeType) => {
    const def = NODE_DEFS.find((d) => d.type === type)!;
    const sz = DEFAULT_SIZES[type];
    const node: WorkflowNode = {
      id: nextId(),
      type,
      label: def.label,
      x: 120 - store.pan.x / store.zoom,
      y: 80  - store.pan.y / store.zoom + Math.random() * 80,
      width: sz.w,
      height: sz.h,
      value: DEFAULT_VALUES[type],
      output: null,
      status: "idle",
    };
    store.addNode(node);
    store.setSelectedNode(node.id);
  };

  return (
    <div
      style={{ width: open ? 208 : 44 }}
      className="bg-[#111118] border-r border-[#1e1e2e] flex-shrink-0 flex flex-col transition-all duration-200 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2.5 py-2.5 border-b border-[#1e1e2e]">
        {open && (
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6b7280]">
            Nodes
          </span>
        )}
        <button
          onClick={() => setOpen((o) => !o)}
          className="ml-auto w-6 h-6 flex items-center justify-center rounded text-[#6b7280] hover:text-[#a0a0b8] hover:bg-[#1a1a2a] transition-all"
        >
          {open ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {open && (
        <>
          {/* Search */}
          <div className="px-2 pt-2 pb-1">
            <div className="relative">
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4b5563]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search nodes…"
                className="w-full bg-[#0f0f1a] border border-[#1e1e2e] rounded-md text-[11px] pl-7 pr-2 py-1.5 text-[#a0a0b8] placeholder:text-[#3a3a5a] outline-none focus:border-[#2a2a4a]"
              />
            </div>
          </div>

          {/* Node list */}
          <div className="flex flex-col gap-1 p-2 overflow-y-auto flex-1">
            <p className="text-[9px] uppercase tracking-widest text-[#3a3a5a] px-1 mb-1">
              Quick Access
            </p>
            {filtered.map((nt) => (
              <button
                key={nt.type}
                onClick={() => addNode(nt.type)}
                className="flex items-center gap-2 px-2 py-2 rounded-lg text-left bg-transparent border border-[#1e1e2e] hover:bg-[#1a1a2a] transition-all group"
                style={{ "--hover-border": nt.color + "40" } as any}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = nt.color + "50")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1e1e2e")}
              >
                <span
                  className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] flex-shrink-0"
                  style={{ background: nt.color + "20", border: `1px solid ${nt.color}30`, color: nt.color }}
                >
                  {nt.icon}
                </span>
                <div>
                  <div className="text-[11px] font-medium text-[#c0c0d8]">{nt.label}</div>
                  <div className="text-[9px] text-[#4b5563] leading-tight">{nt.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Collapsed icons */}
      {!open && (
        <div className="flex flex-col gap-1.5 p-1.5 items-center pt-3">
          {NODE_DEFS.map((nt) => (
            <button
              key={nt.type}
              title={nt.label}
              onClick={() => addNode(nt.type)}
              className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] transition-all hover:scale-110"
              style={{ background: nt.color + "20", border: `1px solid ${nt.color}30`, color: nt.color }}
            >
              {nt.icon}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
