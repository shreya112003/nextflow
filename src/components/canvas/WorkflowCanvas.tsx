// src/components/canvas/WorkflowCanvas.tsx
"use client";
import { useCallback, useEffect, useRef } from "react";
import { useWorkflowStore } from "@/store/workflow";
import NodeCard from "../nodes/NodeCard";
import EdgeLine from "./EdgeLine";
import MiniMap from "./MiniMap";
import type { WorkflowNode, WorkflowEdge } from "@/types";

let _edgeCounter = 500;
const nextEdgeId = () => `edge-${++_edgeCounter}`;

export default function WorkflowCanvas() {
  const store = useWorkflowStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef<{ id: string; ox: number; oy: number } | null>(null);
  const panStartRef = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);
  const connectingRef = useRef<{ from: string; sx: number; sy: number } | null>(null);
  const liveLineRef = useRef<SVGPathElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && store.selectedNodeId) {
        // Don't delete when typing in inputs
        if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
        store.deleteNode(store.selectedNodeId);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") store.undo();
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "z"))) store.redo();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [store]);

  // Wheel zoom
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      store.setZoom(Math.min(2, Math.max(0.15, store.zoom - e.deltaY * 0.001)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [store.zoom]);

  const getSVGPoint = useCallback((e: React.MouseEvent | MouseEvent) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - store.pan.x) / store.zoom,
      y: (e.clientY - rect.top  - store.pan.y) / store.zoom,
    };
  }, [store.pan, store.zoom]);

  const onBgMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target !== svgRef.current && !(e.target as SVGElement).classList.contains("canvas-bg")) return;
    panStartRef.current = { mx: e.clientX, my: e.clientY, px: store.pan.x, py: store.pan.y };
    store.setSelectedNode(null);
  }, [store]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (panStartRef.current) {
      store.setPan({
        x: panStartRef.current.px + e.clientX - panStartRef.current.mx,
        y: panStartRef.current.py + e.clientY - panStartRef.current.my,
      });
    }
    if (draggingRef.current) {
      const pt = getSVGPoint(e);
      store.updateNode(draggingRef.current.id, {
        x: pt.x - draggingRef.current.ox,
        y: pt.y - draggingRef.current.oy,
      });
    }
    if (connectingRef.current && liveLineRef.current) {
      const pt = getSVGPoint(e);
      const { sx, sy } = connectingRef.current;
      const dx = Math.abs(pt.x - sx) * 0.5;
      liveLineRef.current.setAttribute(
        "d",
        `M${sx},${sy} C${sx + dx},${sy} ${pt.x - dx},${pt.y} ${pt.x},${pt.y}`
      );
      liveLineRef.current.style.display = "block";
    }
  }, [store, getSVGPoint]);

  const onMouseUp = useCallback(() => {
    panStartRef.current = null;
    draggingRef.current = null;
    if (liveLineRef.current) liveLineRef.current.style.display = "none";
    connectingRef.current = null;
  }, []);

  const onNodeMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    store.setSelectedNode(id);
    const node = store.nodes.find((n) => n.id === id)!;
    const pt = getSVGPoint(e);
    draggingRef.current = { id, ox: pt.x - node.x, oy: pt.y - node.y };
  }, [store, getSVGPoint]);

  const onOutputPortClick = useCallback((e: React.MouseEvent, fromId: string) => {
    e.stopPropagation();
    const node = store.nodes.find((n) => n.id === fromId)!;
    connectingRef.current = {
      from: fromId,
      sx: node.x + node.width,
      sy: node.y + node.height / 2,
    };
  }, [store.nodes]);

  const onInputPortClick = useCallback((e: React.MouseEvent, toId: string) => {
    e.stopPropagation();
    if (!connectingRef.current || connectingRef.current.from === toId) {
      connectingRef.current = null;
      return;
    }
    const from = connectingRef.current.from;
    // DAG check: prevent cycles
    const wouldCycle = (from: string, to: string): boolean => {
      // Simple DFS from 'to' — if we reach 'from' there's a cycle
      const visited = new Set<string>();
      const dfs = (id: string): boolean => {
        if (id === from) return true;
        if (visited.has(id)) return false;
        visited.add(id);
        return store.edges.filter((e) => e.from === id).some((e) => dfs(e.to));
      };
      return dfs(to);
    };
    if (wouldCycle(from, toId)) { connectingRef.current = null; return; }

    const alreadyExists = store.edges.some((e) => e.from === from && e.to === toId);
    if (!alreadyExists) {
      store.addEdge({ id: nextEdgeId(), from, to: toId });
    }
    connectingRef.current = null;
    if (liveLineRef.current) liveLineRef.current.style.display = "none";
  }, [store]);

  const cursor =
    panStartRef.current ? "grabbing" : connectingRef.current ? "crosshair" : "default";

  return (
    <div className="flex-1 relative overflow-hidden" style={{ cursor }}>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        className="absolute inset-0"
        onMouseDown={onBgMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <defs>
          {/* Dot grid */}
          <pattern
            id="dotgrid"
            x={(store.pan.x % (20 * store.zoom))}
            y={(store.pan.y % (20 * store.zoom))}
            width={20 * store.zoom}
            height={20 * store.zoom}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={store.zoom} cy={store.zoom} r={0.7} fill="#252535" />
          </pattern>
          {/* Arrow marker */}
          <marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5"
            markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background */}
        <rect className="canvas-bg" width="100%" height="100%" fill="url(#dotgrid)" />

        <g transform={`translate(${store.pan.x},${store.pan.y}) scale(${store.zoom})`}>
          {/* Edges */}
          {store.edges.map((edge) => (
            <EdgeLine
              key={edge.id}
              edge={edge}
              nodes={store.nodes}
              onDelete={() => store.deleteEdge(edge.id)}
            />
          ))}

          {/* Live connection line (hidden by default) */}
          <path
            ref={liveLineRef}
            fill="none"
            stroke="#7c6af7"
            strokeWidth={1.5}
            strokeDasharray="6 3"
            opacity={0.8}
            style={{ display: "none" }}
          />

          {/* Nodes */}
          {store.nodes.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              selected={store.selectedNodeId === node.id}
              onMouseDown={(e) => onNodeMouseDown(e, node.id)}
              onOutputPortClick={(e) => onOutputPortClick(e, node.id)}
              onInputPortClick={(e) => onInputPortClick(e, node.id)}
              onDelete={() => store.deleteNode(node.id)}
              onUpdate={(patch) => store.updateNode(node.id, patch)}
            />
          ))}
        </g>
      </svg>

      {/* MiniMap */}
      <MiniMap nodes={store.nodes} pan={store.pan} zoom={store.zoom} />

      {/* Zoom controls */}
      <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-[#111118] border border-[#1e1e2e] rounded-lg px-2 py-1">
        <button
          onClick={() => store.setZoom(Math.max(0.15, store.zoom - 0.1))}
          className="w-5 h-5 flex items-center justify-center text-[#6b7280] hover:text-white text-sm"
        >−</button>
        <span className="text-[10px] text-[#6b7280] w-9 text-center">
          {Math.round(store.zoom * 100)}%
        </span>
        <button
          onClick={() => store.setZoom(Math.min(2, store.zoom + 0.1))}
          className="w-5 h-5 flex items-center justify-center text-[#6b7280] hover:text-white text-sm"
        >+</button>
        <button
          onClick={() => { store.setPan({ x: 0, y: 0 }); store.setZoom(0.85); }}
          className="text-[9px] text-[#4b5563] hover:text-[#8080a0] ml-1 transition-colors"
          title="Reset view"
        >FIT</button>
      </div>
    </div>
  );
}
