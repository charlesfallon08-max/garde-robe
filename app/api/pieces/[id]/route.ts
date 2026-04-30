import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pieces } from "@/db/schema";
import { eq } from "drizzle-orm";

// DELETE /api/pieces/[id] — supprime une pièce
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(pieces).where(eq(pieces.id, id));
  return NextResponse.json({ deleted: id });
}
