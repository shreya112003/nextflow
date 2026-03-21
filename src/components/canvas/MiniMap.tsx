// src/components/canvas/MiniMap.tsx
"use client";
import type { WorkflowNode } from "@/types";

const NODE_COLORS: Record<string, string> = {
  text: "#7c6af7", image: "#3b82f6", video: "#10b981",
  llm: "#f59e0b", crop: "#ec4899", extract: "#8b5cf6",
};

interface Props {
  nodes: WorkflowNode[];
  pan: { x: number; y: number };
  zoom: number;
}

export default function MiniMap({ nodes }: Props) {
  const W = 140, H = 86;
  if (!nodes.length) return null;

  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const minX = Math.min(...xs) - 20;
  const minY = Math.min(...ys) - 20;
  const maxX = Math.max(...nodes.map((n) => n.x + n.width))  + 20;
  const maxY = Math.max(...nodes.map((n) => n.y + n.height)) + 20;
  const sw = maxX - minX || 1;
  const sh = maxY - minY || 1;
  const sc = Math.min(W / sw, H / sh, 1);

  return (
    <div className="absolute bottom-4 right-4 bg-[#111118]/90 border border-[#1e1e2e] rounded-lg p-1.5 backdrop-blur-sm">
      <p className="text-[8px] text-[#3a3a5a] uppercase tracking-widest mb-1 px-0.5">Map</p>
      <svg width={W} height={H}>
        {nodes.map((n) => (
          <rect
            key={n.id}
            x={(n.x - minX) * sc}
            y={(n.y - minY) * sc}
            width={Math.max(n.width * sc, 4)}
            height={Math.max(n.height * sc, 3)}
            rx={2}
            fill={NODE_COLORS[n.type] + "30"}
            stroke={NODE_COLORS[n.type] + "80"}
            strokeWidth={0.5}
          />
        ))}
      </svg>
    </div>
  );
}
