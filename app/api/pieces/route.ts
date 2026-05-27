import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { pieces } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const all = await db.select().from(pieces).where(eq(pieces.user_id, session.user.id));
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const newPiece = {
    id:          body.id ?? randomUUID(),
    user_id:     session.user.id,
    marque:      body.marque,
    nom:         body.nom,
    categorie:   body.categorie,
    sous_type:   body.sous_type,
    style_type:  body.style_type ?? null,
    statut:      body.statut ?? "possédé",
    couleur_hex: body.couleur_hex ?? "#000000",
    couleur_nom: body.couleur_nom ?? "",
    prix_cad:    body.prix_cad ?? null,
    url_achat:   body.url_achat ?? null,
    image_url:   body.image_url ?? null,
    notes:       body.notes ?? null,
    date_ajout:  new Date().toISOString(),
  };
  await db.insert(pieces).values(newPiece);
  return NextResponse.json(newPiece, { status: 201 });
}
