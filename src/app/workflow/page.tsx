// src/app/workflow/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import WorkflowBuilder from "@/components/WorkflowBuilder";
import { SAMPLE_NODES, SAMPLE_EDGES } from "@/lib/sampleWorkflow";

export default async function WorkflowPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  // Ensure user exists in DB
  let user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    const clerkUser = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
    }).then((r) => r.json());

    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email: clerkUser.email_addresses?.[0]?.email_address ?? "",
        name: `${clerkUser.first_name ?? ""} ${clerkUser.last_name ?? ""}`.trim(),
      },
    });
  }

  // Load most recent workflow or create sample
  let workflow = await prisma.workflow.findFirst({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { runs: { include: { nodeResults: true }, orderBy: { createdAt: "desc" }, take: 20 } },
  });

  if (!workflow) {
    workflow = await prisma.workflow.create({
      data: {
        userId: user.id,
        name: "Product Marketing Kit Generator",
        nodes: SAMPLE_NODES as any,
        edges: SAMPLE_EDGES as any,
      },
      include: { runs: { include: { nodeResults: true }, orderBy: { createdAt: "desc" }, take: 20 } },
    });
  }

  return (
    <WorkflowBuilder
      initialWorkflow={{
        id: workflow.id,
        name: workflow.name,
        nodes: workflow.nodes as any,
        edges: workflow.edges as any,
        history: workflow.runs.map((run) => ({
          id: run.id,
          scope: run.scope,
          status: run.status,
          duration: run.duration ?? undefined,
          nodeIds: run.nodeIds,
          createdAt: run.createdAt,
          finishedAt: run.finishedAt ?? undefined,
          nodeResults: run.nodeResults.map((nr) => ({
            nodeId: nr.nodeId,
            nodeType: nr.nodeType,
            nodeLabel: nr.nodeLabel,
            status: nr.status,
            output: nr.output ?? undefined,
            error: nr.error ?? undefined,
            durationMs: nr.durationMs ?? undefined,
          })),
        })),
      }}
    />
  );
}
