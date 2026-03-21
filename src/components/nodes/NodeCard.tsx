// src/components/nodes/NodeCard.tsx
"use client";
import type { WorkflowNode } from "@/types";

const COLORS: Record<string, { bg: string; border: string; badge: string }> = {
  text:    { bg: "#1a1630", border: "#7c6af7", badge: "#7c6af7" },
  image:   { bg: "#0f1e35", border: "#3b82f6", badge: "#3b82f6" },
  video:   { bg: "#0d2519", border: "#10b981", badge: "#10b981" },
  llm:     { bg: "#211a0d", border: "#f59e0b", badge: "#f59e0b" },
  crop:    { bg: "#1f0d1a", border: "#ec4899", badge: "#ec4899" },
  extract: { bg: "#160f2b", border: "#8b5cf6", badge: "#8b5cf6" },
};

const ICONS: Record<string, string> = {
  text: "T", image: "🖼", video: "▶", llm: "✦", crop: "⊞", extract: "⎯",
};

function statusColor(s: string) {
  return s === "success" ? "#10b981"
    : s === "failed"  ? "#ef4444"
    : s === "running" ? "#f59e0b"
    : "#2a2a4a";
}

interface Props {
  node: WorkflowNode;
  selected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onOutputPortClick: (e: React.MouseEvent) => void;
  onInputPortClick: (e: React.MouseEvent) => void;
  onDelete: () => void;
  onUpdate: (patch: Partial<WorkflowNode>) => void;
}

export default function NodeCard({
  node, selected,
  onMouseDown, onOutputPortClick, onInputPortClick,
  onDelete,
}: Props) {
  const c = COLORS[node.type] ?? COLORS.text;
  const isRunning = node.status === "running";
  const { width: w, height: h } = node;

  return (
    <g transform={`translate(${node.x},${node.y})`} onMouseDown={onMouseDown} style={{ cursor: "pointer" }}>
      {/* Running glow */}
      {isRunning && (
        <rect x={-6} y={-6} width={w + 12} height={h + 12} rx={14}
          fill={c.border + "18"} filter="url(#glow)">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite" />
        </rect>
      )}

      {/* Card background */}
      <rect x={0} y={0} width={w} height={h} rx={10}
        fill={c.bg}
        stroke={selected ? c.border : isRunning ? c.border : c.border + "55"}
        strokeWidth={selected ? 1.5 : 1}
      />

      {/* Header band */}
      <rect x={0} y={0} width={w} height={34} rx={10} fill={c.border + "1a"} />
      <rect x={0} y={24} width={w} height={10} fill={c.border + "1a"} />

      {/* Icon */}
      <rect x={10} y={8} width={18} height={18} rx={4} fill={c.badge + "25"} />
      <text x={19} y={20} textAnchor="middle" fontSize={10} fill={c.badge}
        style={{ userSelect: "none", dominantBaseline: "central" }}>
        {ICONS[node.type]}
      </text>

      {/* Label */}
      <text x={34} y={21} fontSize={11} fontWeight="600" fill="#d0d0e0"
        style={{ userSelect: "none", dominantBaseline: "central" }}>
        {node.label.slice(0, 22)}{node.label.length > 22 ? "…" : ""}
      </text>

      {/* Status dot */}
      <circle cx={w - 10} cy={17} r={4} fill={statusColor(node.status)}>
        {isRunning && <animate attributeName="r" values="3;5;3" dur="0.8s" repeatCount="indefinite" />}
      </circle>

      {/* Node body */}
      <NodeBody node={node} />

      {/* Input port (left) */}
      <circle cx={0} cy={h / 2} r={6} fill="#0a0a0f" stroke={c.border + "80"} strokeWidth={1.5}
        style={{ cursor: "pointer" }} onClick={onInputPortClick} />
      <circle cx={0} cy={h / 2} r={3} fill={c.border + "90"} style={{ pointerEvents: "none" }} />

      {/* Output port (right) */}
      <circle cx={w} cy={h / 2} r={6} fill="#0a0a0f" stroke={c.border + "80"} strokeWidth={1.5}
        style={{ cursor: "crosshair" }} onClick={onOutputPortClick} />
      <circle cx={w} cy={h / 2} r={3} fill={c.border + "90"} style={{ pointerEvents: "none" }} />

      {/* Delete button (visible when selected) */}
      {selected && (
        <g onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ cursor: "pointer" }}>
          <rect x={w - 22} y={-14} width={22} height={14} rx={4} fill="#ef444430" />
          <text x={w - 11} y={-4} textAnchor="middle" fontSize={9} fill="#ef4444"
            style={{ userSelect: "none", dominantBaseline: "central" }}>✕ DEL</text>
        </g>
      )}
    </g>
  );
}

// ── Per-node body content ─────────────────────────────────────────────────────
function NodeBody({ node }: { node: WorkflowNode }) {
  const c = COLORS[node.type];
  const { width: w, height: h } = node;

  if (node.type === "text") {
    const val = (node.value as { content?: string })?.content ?? "";
    return (
      <foreignObject x={10} y={38} width={w - 20} height={h - 50}>
        <div style={{ fontSize: 10, color: "#7070a0", lineHeight: "1.45", overflow: "hidden", height: "100%", paddingTop: 2 }}>
          {val ? val.slice(0, 130) : <span style={{ color: "#2a2a4a", fontStyle: "italic" }}>Empty…</span>}
        </div>
      </foreignObject>
    );
  }

  if (node.type === "llm") {
    const val = node.value as { model?: string; systemPrompt?: string };
    return (
      <>
        <rect x={10} y={40} width={w - 20} height={22} rx={4} fill={c.border + "18"} />
        <text x={16} y={55} fontSize={9} fill="#5a5a7a" style={{ dominantBaseline: "middle" }}>Model: </text>
        <text x={52} y={55} fontSize={9} fill="#9090c0" style={{ dominantBaseline: "middle" }}>
          {(val?.model ?? "gemini-1.5-flash").replace("gemini-", "")}
        </text>
        {node.output ? (
          <foreignObject x={10} y={68} width={w - 20} height={h - 80}>
            <div style={{ fontSize: 9, color: "#50d070", lineHeight: 1.4, overflow: "hidden", height: "100%", fontFamily: "monospace" }}>
              {node.output.slice(0, 120)}{node.output.length > 120 ? "…" : ""}
            </div>
          </foreignObject>
        ) : (
          <text x={16} y={90} fontSize={9} fill="#2a2a4a" fontStyle="italic">Connect inputs & run…</text>
        )}
      </>
    );
  }

  if (node.type === "crop") {
    const val = node.value as { x?: number; y?: number; width?: number; height?: number } ?? {};
    const pw = w - 20, ph = h - 90;
    const cx = pw * ((val.x ?? 10) / 100);
    const cy = ph * ((val.y ?? 10) / 100);
    const cw = pw * ((val.width ?? 80) / 100);
    const chh = ph * ((val.height ?? 80) / 100);
    return (
      <>
        <text x={16} y={52} fontSize={9} fill="#5a5a7a">x:{val.x ?? 10}% y:{val.y ?? 10}%  w:{val.width ?? 80}% h:{val.height ?? 80}%</text>
        <rect x={10} y={62} width={pw} height={ph} rx={4} fill={c.border + "10"} stroke={c.border + "20"} strokeWidth={0.5} />
        <rect x={10 + cx} y={62 + cy} width={cw} height={chh} rx={2}
          fill={c.border + "20"} stroke={c.border} strokeWidth={1} strokeDasharray="3 2" />
      </>
    );
  }

  if (node.type === "extract") {
    const val = node.value as { timestamp?: string } ?? {};
    return (
      <>
        <text x={16} y={52} fontSize={9} fill="#5a5a7a">Timestamp: {val.timestamp ?? "50%"}</text>
        <rect x={10} y={62} width={w - 20} height={h - 75} rx={4} fill={c.border + "10"} stroke={c.border + "20"} strokeWidth={0.5} />
        <text x={w / 2} y={62 + (h - 75) / 2} textAnchor="middle" fontSize={10} fill={c.border + "70"}
          style={{ dominantBaseline: "middle" }}>▶ Frame preview</text>
      </>
    );
  }

  if (node.type === "image" || node.type === "video") {
    const val = node.value as { url?: string | null; fileName?: string | null } ?? {};
    return (
      <>
        <rect x={10} y={40} width={w - 20} height={h - 54} rx={6}
          fill={c.border + "10"} stroke={c.border + "20"} strokeWidth={0.5} />
        {val.fileName ? (
          <>
            <text x={w / 2} y={40 + (h - 54) / 2 - 6} textAnchor="middle" fontSize={9} fill={c.border + "a0"}
              style={{ dominantBaseline: "middle" }}>✓ {val.fileName.slice(0, 20)}</text>
            <text x={w / 2} y={40 + (h - 54) / 2 + 8} textAnchor="middle" fontSize={8} fill="#10b981"
              style={{ dominantBaseline: "middle" }}>Uploaded</text>
          </>
        ) : (
          <text x={w / 2} y={40 + (h - 54) / 2} textAnchor="middle" fontSize={10} fill={c.border + "60"}
            style={{ dominantBaseline: "middle" }}>
            {node.type === "image" ? "🖼 Upload image" : "▶ Upload video"}
          </text>
        )}
      </>
    );
  }

  return null;
}
