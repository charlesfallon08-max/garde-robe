import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { outfits } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const all = await db.select().from(outfits).where(eq(outfits.user_id, session.user.id));
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const outfit = {
    id:          randomUUID(),
    user_id:     session.user.id,
    pieces_ids:  JSON.stringify(body.pieces_ids),
    occasion:    body.occasion ?? null,
    explication: body.explication ?? null,
    score:       body.score ?? null,
    prix_total:  body.prix_total ?? null,
    date_ajout:  new Date().toISOString(),
  };
  await db.insert(outfits).values(outfit);
  return NextResponse.json(outfit, { status: 201 });
}
