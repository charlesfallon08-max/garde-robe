import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { preferences } from "@/db/schema";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const pref = {
    id:         randomUUID(),
    user_id:    session.user.id,
    type:       body.type,
    pieces_ids: JSON.stringify(body.pieces_ids),
    occasion:   body.occasion ?? null,
    meteo:      body.meteo ?? null,
    raison:     body.raison ?? null,
    date_ajout: new Date().toISOString(),
  };
  await db.insert(preferences).values(pref);
  return NextResponse.json(pref, { status: 201 });
}
