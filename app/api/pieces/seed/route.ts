import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { pieces } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = session.user.id;
  const [{ value }] = await db.select({ value: count() }).from(pieces).where(eq(pieces.user_id, userId));
  if (value > 0) {
    return NextResponse.json({ message: "Déjà peuplé", count: value });
  }

  const jsonPath = path.join(process.cwd(), "garde-robe-export.json");
  if (!fs.existsSync(jsonPath)) {
    return NextResponse.json({ message: "Pas de données initiales", count: 0 });
  }

  const raw = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(raw);

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
    notes:       item.note,
    date_ajout:  now,
  }));

  await db.insert(pieces).values(rows);
  return NextResponse.json({ message: "Import OK", count: rows.length });
}
