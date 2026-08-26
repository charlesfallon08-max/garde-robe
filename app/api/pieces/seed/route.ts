import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { pieces } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import seedData from "@/garde-robe-export.json";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = session.user.id;
  const [{ value }] = await db.select({ value: count() }).from(pieces).where(eq(pieces.user_id, userId));
  if (value > 0) {
    return NextResponse.json({ message: "Déjà peuplé", count: value });
  }

  // Migrer les pièces d'un ancien user_id vers le compte Google actuel
  const allPieces = await db.select({ user_id: pieces.user_id }).from(pieces);
  const oldUserId = allPieces[0]?.user_id ?? null;
  if (oldUserId) {
    await db.update(pieces).set({ user_id: userId }).where(eq(pieces.user_id, oldUserId));
    return NextResponse.json({ message: "Migration OK", count: allPieces.length });
  }

  const data = seedData;

  const now = new Date().toISOString();
  const rows = data.items.map((item: {
    id: string; brand: string; name: string; category: string;
    subtype: string; color_hex: string; color_name: string;
    price_cad: number; url: string; note: string;
  }) => ({
    id:          item.id,
    user_id:     userId,
    marque:      item.brand,
    nom:         item.name,
    categorie:   item.category,
    sous_type:   item.subtype,
    couleur_hex: item.color_hex,
    couleur_nom: item.color_name,
    prix_cad:    item.price_cad,
    url_achat:   item.url,
    image_url:   null,
    saison:      "ete",
    notes:       item.note,
    date_ajout:  now,
  }));

  await db.insert(pieces).values(rows);
  return NextResponse.json({ message: "Import OK", count: rows.length });
}
