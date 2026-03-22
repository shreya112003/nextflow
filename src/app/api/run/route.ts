import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RunWorkflowSchema } from "@/lib/validators";
import { buildExecutionPlan, resolveInputs } from "@/lib/dag";
import { runGemini } from "@/lib/gemini";
import type { WorkflowNode, WorkflowEdge } from "@/types";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { workflowId, scope, nodeIds } = RunWorkflowSchema.parse(body);

    const workflow = await prisma.workflow.findFirst({
      where: { id: workflowId, userId: user.id },
    });
    if (!workflow) return NextResponse.json({ error: "Workflow not found" }, { status: 404 });

    const nodes = workflow.nodes as unknown as WorkflowNode[];
    const edges = workflow.edges as unknown as WorkflowEdge[];

    const targetIds =
      scope === "FULL"
        ? nodes.map((n) => n.id)
        : scope === "SINGLE" && nodeIds?.length
        ? [nodeIds[0]]
        : nodeIds ?? nodes.map((n) => n.id);

    const run = await prisma.workflowRun.create({
      data: { workflowId, scope: scope as any, status: "RUNNING", nodeIds: targetIds },
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: object) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        send({ type: "run_started", runId: run.id });

        const plan = buildExecutionPlan(nodes, edges, targetIds);
        const nodeOutputs = new Map<string, string | null>();
        const nodeResults: { nodeId: string; status: string; output?: string; error?: string; durationMs: number }[] = [];
        const startTime = Date.now();

        try {
          for (const tier of plan.tiers) {
            await Promise.all(
              tier.map(async (nodeId) => {
                const node = nodes.find((n) => n.id === nodeId);
                if (!node) return;

                send({ type: "node_started", nodeId });

                const t0 = Date.now();
                let output: string | null = null;
                let status: "SUCCESS" | "FAILED" = "SUCCESS";
                let error: string | undefined;

                try {
                  const inputs = resolveInputs(nodeId, edges, nodeOutputs);

                  if (node.type === "text") {
                    const v = node.value as { content: string };
                    output = v?.content ?? "";
                  } else if (node.type === "image" || node.type === "video") {
                    const v = node.value as { url: string | null };
                    output = v?.url ?? null;
                  } else if (node.type === "crop") {
                    const imageUrl = inputs["default"] ?? inputs["image"] ?? null;
                    if (!imageUrl) throw new Error("No image input connected");
                    await new Promise((r) => setTimeout(r, 1200));
                    output = imageUrl + "?crop=true";
                  } else if (node.type === "extract") {
                    const videoUrl = inputs["default"] ?? inputs["video_url"] ?? null;
                    const v = node.value as { timestamp: string };
                    if (!videoUrl) throw new Error("No video input connected");
                    await new Promise((r) => setTimeout(r, 1500));
                    output = videoUrl + "?frame=" + (v?.timestamp ?? "50pct");
                  } else if (node.type === "llm") {
                    const v = node.value as { model: string; systemPrompt?: string; userMessage?: string };
                    const systemPrompt = inputs["system"] ?? v?.systemPrompt ?? "";
                    const userMessage = inputs["user"] ?? v?.userMessage ?? "Hello";
                    const imageUrls = [inputs["image"]].filter(Boolean) as string[];
                    output = await runGemini({
                      model: (v?.model ?? "gemini-1.5-flash") as any,
                      systemPrompt: systemPrompt || undefined,
                      userMessage,
                      imageUrls,
                    });
                  }
                } catch (e) {
                  status = "FAILED";
                  error = e instanceof Error ? e.message : String(e);
                }

                const durationMs = Date.now() - t0;
                nodeOutputs.set(nodeId, output);
                nodeResults.push({ nodeId, status, output: output ?? undefined, error, durationMs });

                await prisma.nodeResult.create({
                  data: {
                    runId: run.id, nodeId, nodeType: node.type, nodeLabel: node.label,
                    status: status as any, output: output ?? null, error: error ?? null, durationMs,
                  },
                });

                send({ type: "node_done", nodeId, status, output, error, durationMs });
              })
            );
          }

          const duration = (Date.now() - startTime) / 1000;
          const overallStatus = nodeResults.every((r) => r.status === "SUCCESS")
            ? "SUCCESS" : nodeResults.some((r) => r.status === "SUCCESS") ? "PARTIAL" : "FAILED";

          await prisma.workflowRun.update({
            where: { id: run.id },
            data: { status: overallStatus as any, duration, finishedAt: new Date() },
          });

          send({ type: "run_complete", runId: run.id, status: overallStatus, duration });
        } catch (e) {
          await prisma.workflowRun.update({
            where: { id: run.id },
            data: { status: "FAILED", finishedAt: new Date() },
          });
          send({ type: "run_error", error: e instanceof Error ? e.message : String(e) });
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", issues: e.errors }, { status: 400 });
    }
    console.error("[POST /api/run]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
