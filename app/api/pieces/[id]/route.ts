import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { pieces } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  await db.update(pieces).set({
    marque:      body.marque,
    nom:         body.nom,
    categorie:   body.categorie,
    sous_type:   body.sous_type,
    style_type:  body.style_type ?? null,
    statut:      body.statut ?? "possédé",
    couleur_hex: body.couleur_hex,
    couleur_nom: body.couleur_nom,
    prix_cad:    body.prix_cad ?? null,
    url_achat:   body.url_achat ?? null,
    image_url:   body.image_url ?? null,
    notes:       body.notes ?? null,
  }).where(and(eq(pieces.id, id), eq(pieces.user_id, session.user.id)));
  return NextResponse.json({ updated: id });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  await db.delete(pieces).where(and(eq(pieces.id, id), eq(pieces.user_id, session.user.id)));
  return NextResponse.json({ deleted: id });
}
