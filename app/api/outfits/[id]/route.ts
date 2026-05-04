import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { outfits } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(outfits).where(eq(outfits.id, id));
  return NextResponse.json({ deleted: id });
}
