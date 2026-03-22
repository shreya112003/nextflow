"use client";
import { useRef } from "react";
import { X, Play } from "lucide-react";
import type { WorkflowNode } from "@/types";
import { useWorkflowStore } from "@/store/workflow";

const COLORS: Record<string, string> = {
  text: "#7c6af7", image: "#3b82f6", video: "#10b981",
  llm: "#f59e0b", crop: "#ec4899", extract: "#8b5cf6",
};

const LLM_MODELS = [
  "gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash", "gemini-pro",
];

interface Props {
  node: WorkflowNode;
  onClose: () => void;
  onRunSingle: () => void;
}

export default function NodeInspector({ node, onClose, onRunSingle }: Props) {
  const store = useWorkflowStore();
  const color = COLORS[node.type] ?? "#7c6af7";
  const patch = (p: Partial<WorkflowNode>) => store.updateNode(node.id, p);
  const patchValue = (v: object) => patch({ value: { ...(node.value as object), ...v } as any });
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    patchValue({ url, fileName: file.name, mimeType: file.type });
  };

  const cropValue = node.value as Record<string, unknown>;

  return (
    <div
      className="absolute bottom-0 left-0 right-0 bg-[#111118] z-20 overflow-y-auto"
      style={{ borderTop: `2px solid ${color}50`, maxHeight: 240 }}
    >
      <div className="flex items-center justify-between px-5 py-2.5 sticky top-0 bg-[#111118] border-b border-[#1e1e2e]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color }}>{node.label}</span>
          <span className="text-[10px] text-[#6b7280] bg-[#1a1a2a] px-1.5 py-0.5 rounded">{node.type}</span>
          <span className="text-[10px] text-[#3a3a5a]">ID: {node.id}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRunSingle}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium"
            style={{ background: color + "20", border: `1px solid ${color}40`, color: color }}
          >
            <Play size={10} />
            Run node
          </button>
          <button onClick={onClose} className="text-[#6b7280] hover:text-[#c0c0d8] transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="px-5 py-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Field label="Node label">
          <input
            value={node.label}
            onChange={(e) => patch({ label: e.target.value })}
            className="inspector-input"
            style={{ borderColor: color + "30" }}
          />
        </Field>

        {node.type === "text" && (
          <Field label="Text content" colSpan>
            <textarea
              value={(node.value as { content?: string })?.content ?? ""}
              onChange={(e) => patchValue({ content: e.target.value })}
              rows={3}
              className="inspector-input resize-none"
              style={{ borderColor: color + "30" }}
            />
          </Field>
        )}

        {node.type === "llm" && (
          <>
            <Field label="Model">
              <select
                value={(node.value as { model?: string })?.model ?? "gemini-1.5-flash"}
                onChange={(e) => patchValue({ model: e.target.value })}
                className="inspector-input"
                style={{ borderColor: color + "30" }}
              >
                {LLM_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="System prompt" colSpan>
              <textarea
                value={(node.value as { systemPrompt?: string })?.systemPrompt ?? ""}
                onChange={(e) => patchValue({ systemPrompt: e.target.value })}
                rows={2}
                placeholder="Optional system instructions…"
                className="inspector-input resize-none"
                style={{ borderColor: color + "30" }}
              />
            </Field>
            <Field label="User message (fallback if no input)" colSpan>
              <textarea
                value={(node.value as { userMessage?: string })?.userMessage ?? ""}
                onChange={(e) => patchValue({ userMessage: e.target.value })}
                rows={2}
                placeholder="Used when no upstream text node is connected…"
                className="inspector-input resize-none"
                style={{ borderColor: color + "30" }}
              />
            </Field>
          </>
        )}

        {node.type === "crop" && (
          <>
            {(["x", "y", "width", "height"] as const).map((k) => (
              <Field key={k} label={k === "width" ? "Width %" : k === "height" ? "Height %" : k + " offset %"}>
                <input
                  type="number" min={0} max={100}
                  value={(cropValue?.[k] as number) ?? 0}
                  onChange={(e) => patchValue({ [k]: Number(e.target.value) })}
                  className="inspector-input"
                  style={{ borderColor: color + "30" }}
                />
              </Field>
            ))}
          </>
        )}

        {node.type === "extract" && (
          <Field label='Timestamp ("50%" or seconds)'>
            <input
              value={(node.value as { timestamp?: string })?.timestamp ?? "50%"}
              onChange={(e) => patchValue({ timestamp: e.target.value })}
              placeholder='e.g. "50%" or "10"'
              className="inspector-input"
              style={{ borderColor: color + "30" }}
            />
          </Field>
        )}

        {(node.type === "image" || node.type === "video") && (
          <Field label={node.type === "image" ? "Upload image" : "Upload video"} colSpan>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fileRef.current?.click()}
                className="px-3 py-1.5 text-[11px] rounded-md border transition-colors"
                style={{ borderColor: color + "40", color, background: color + "15" }}
              >
                Choose file
              </button>
              <span className="text-[11px] text-[#6b7280]">
                {(node.value as { fileName?: string })?.fileName ?? "No file selected"}
              </span>
              <input
                ref={fileRef}
                type="file"
                accept={node.type === "image" ? "image/*" : "video/*"}
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </Field>
        )}

        {node.output && (
          <Field label="Last output" colSpan>
            <div
              className="text-[10px] font-mono rounded-md p-2 break-all leading-relaxed"
              style={{ background: "#0a0a14", border: `1px solid ${color}20`, color: "#50d070" }}
            >
              {node.output.slice(0, 300)}{node.output.length > 300 ? "…" : ""}
            </div>
          </Field>
        )}
      </div>

      <style>{`
        .inspector-input {
          width: 100%;
          font-size: 11px;
          padding: 5px 8px;
          background: #0f0f1a;
          border: 1px solid #1e1e2e;
          border-radius: 6px;
          color: #c0c0d8;
          outline: none;
          font-family: inherit;
          transition: border-color 0.15s;
        }
        .inspector-input:focus { border-color: #3a3a6a; }
        select.inspector-input { cursor: pointer; }
      `}</style>
    </div>
  );
}

function Field({ label, children, colSpan }: {
  label: string; children: React.ReactNode; colSpan?: boolean;
}) {
  return (
    <div className={colSpan ? "col-span-2 md:col-span-4" : ""}>
      <label className="block text-[10px] text-[#6b7280] mb-1">{label}</label>
      {children}
    </div>
  );
}
