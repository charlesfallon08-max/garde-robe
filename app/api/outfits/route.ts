import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { outfits } from "@/db/schema";
import { randomUUID } from "crypto";

export async function GET() {
  const all = await db.select().from(outfits);
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const outfit = {
    id:          randomUUID(),
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
