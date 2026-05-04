import { NextResponse } from "next/server";
import { db } from "@/db";
import { usage_stats, outfits } from "@/db/schema";

export async function GET() {
  const mois = new Date().toISOString().slice(0, 7);
  const stats = await db.select().from(usage_stats);
  const allOutfits = await db.select().from(outfits);

  const thisMois = stats.find((s) => s.date === mois);
  const totalOutfits = allOutfits.length;

  // Coût estimé : $3/M input, $0.30/M cached, $15/M output (Sonnet 4.6)
  const inputCost   = ((thisMois?.input_tokens  ?? 0) / 1_000_000) * 3;
  const cachedCost  = ((thisMois?.cached_tokens  ?? 0) / 1_000_000) * 0.30;
  const outputCost  = ((thisMois?.output_tokens  ?? 0) / 1_000_000) * 15;
  const totalCost   = inputCost + cachedCost + outputCost;

  return NextResponse.json({
    mois,
    input_tokens:    thisMois?.input_tokens    ?? 0,
    output_tokens:   thisMois?.output_tokens   ?? 0,
    cached_tokens:   thisMois?.cached_tokens   ?? 0,
    outfits_generes: thisMois?.outfits_generes ?? 0,
    outfits_sauves:  totalOutfits,
    cout_estime_usd: Math.round(totalCost * 10000) / 10000,
  });
}
