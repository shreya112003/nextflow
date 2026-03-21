// src/app/api/workflows/[id]/history/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ history: [] });

    const workflow = await prisma.workflow.findFirst({
      where: { id: params.id, userId: user.id },
    });
    if (!workflow) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const runs = await prisma.workflowRun.findMany({
      where: { workflowId: params.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { nodeResults: { orderBy: { createdAt: "asc" } } },
    });

    return NextResponse.json({ history: runs });
  } catch (e) {
    console.error("[GET /api/workflows/[id]/history]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
