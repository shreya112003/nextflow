// src/app/api/workflows/[id]/export/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const workflow = await prisma.workflow.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!workflow) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const exportData = {
    name: workflow.name,
    nodes: workflow.nodes,
    edges: workflow.edges,
    exportedAt: new Date().toISOString(),
    version: "1.0",
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${workflow.name.replace(/\s+/g, "-").toLowerCase()}.json"`,
    },
  });
}
