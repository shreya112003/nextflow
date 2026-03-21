// src/app/api/workflows/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SaveWorkflowSchema } from "@/lib/validators";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    const parsed = SaveWorkflowSchema.parse(body);

    let workflow;
    if (parsed.workflowId) {
      // Update existing
      const existing = await prisma.workflow.findFirst({
        where: { id: parsed.workflowId, userId: user.id },
      });
      if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

      workflow = await prisma.workflow.update({
        where: { id: parsed.workflowId },
        data: {
          name: parsed.name,
          nodes: parsed.nodes as any,
          edges: parsed.edges as any,
        },
      });
    } else {
      // Create new
      workflow = await prisma.workflow.create({
        data: {
          userId: user.id,
          name: parsed.name,
          nodes: parsed.nodes as any,
          edges: parsed.edges as any,
        },
      });
    }

    return NextResponse.json({ workflow });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", issues: e.errors }, { status: 400 });
    }
    console.error("[POST /api/workflows]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ workflows: [] });

    const workflows = await prisma.workflow.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, updatedAt: true },
    });

    return NextResponse.json({ workflows });
  } catch (e) {
    console.error("[GET /api/workflows]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
