// src/components/canvas/EdgeLine.tsx
"use client";
import { useState } from "react";
import type { WorkflowEdge, WorkflowNode } from "@/types";

const NODE_COLORS: Record<string, string> = {
  text:    "#7c6af7",
  image:   "#3b82f6",
  video:   "#10b981",
  llm:     "#f59e0b",
  crop:    "#ec4899",
  extract: "#8b5cf6",
};

interface Props {
  edge: WorkflowEdge;
  nodes: WorkflowNode[];
  onDelete: () => void;
}

export default function EdgeLine({ edge, nodes, onDelete }: Props) {
  const [hovered, setHovered] = useState(false);
  const from = nodes.find((n) => n.id === edge.from);
  const to   = nodes.find((n) => n.id === edge.to);
  if (!from || !to) return null;

  const x1 = from.x + from.width;
  const y1 = from.y + from.height / 2;
  const x2 = to.x;
  const y2 = to.y + to.height / 2;
  const dx = Math.abs(x2 - x1) * 0.5;
  const d = `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;

  const color = NODE_COLORS[from.type] ?? "#7c6af7";
  const isRunning = from.status === "running";
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Invisible thick hit area */}
      <path d={d} fill="none" stroke="transparent" strokeWidth={12} style={{ cursor: "pointer" }} />

      {/* Glow track */}
      <path d={d} fill="none" stroke={color + "20"} strokeWidth={3} />

      {/* Main edge */}
      <path
        d={d}
        fill="none"
        stroke={hovered ? color : color + (isRunning ? "ff" : "80")}
        strokeWidth={isRunning ? 2 : 1.5}
        strokeDasharray={isRunning ? "8 4" : undefined}
        markerEnd="url(#arrowhead)"
        style={isRunning ? { animation: "edgeDash 0.5s linear infinite" } : undefined}
      />

      {/* Delete button on hover */}
      {hovered && (
        <g onClick={onDelete} style={{ cursor: "pointer" }}>
          <circle cx={mx} cy={my} r={8} fill="#1a1a2a" stroke={color + "60"} strokeWidth={1} />
          <text x={mx} y={my + 4} textAnchor="middle" fontSize={10} fill="#ef4444">✕</text>
        </g>
      )}
    </g>
  );
}
