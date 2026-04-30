import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pieces } from "@/db/schema";
import { eq } from "drizzle-orm";

// PUT /api/pieces/[id] — modifie une pièce existante
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  await db.update(pieces).set({
    marque:      body.marque,
    nom:         body.nom,
    categorie:   body.categorie,
    sous_type:   body.sous_type,
    couleur_hex: body.couleur_hex,
    couleur_nom: body.couleur_nom,
    prix_cad:    body.prix_cad ?? null,
    url_achat:   body.url_achat ?? null,
    image_url:   body.image_url ?? null,
    notes:       body.notes ?? null,
  }).where(eq(pieces.id, id));
  return NextResponse.json({ updated: id });
}

// DELETE /api/pieces/[id] — supprime une pièce
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(pieces).where(eq(pieces.id, id));
  return NextResponse.json({ deleted: id });
}
