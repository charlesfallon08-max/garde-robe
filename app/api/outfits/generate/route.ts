import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/db";
import { pieces, preferences, usage_stats } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Rate limiting simple en mémoire
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const LIMIT_PER_MINUTE = 10;
const WARN_PER_HOUR = 50;

function checkRateLimit(ip: string): { ok: boolean; warning?: string } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) ?? { count: 0, resetAt: now + 60_000 };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + 60_000; }
  entry.count++;
  rateLimitMap.set(ip, entry);
  if (entry.count > LIMIT_PER_MINUTE) return { ok: false };
  return { ok: true };
}

// Fallback sans IA : règles de couleur + catégorie
function fallbackOutfit(ancreId: string, allPieces: typeof pieces.$inferSelect[]) {
  const ancre = allPieces.find((p) => p.id === ancreId);
  if (!ancre) return null;

  const neutrals = ["#FFFFFF", "#F5F1E8", "#E8DCC0", "#1A1A1A", "#8B8680"];
  const isNeutral = (hex: string) => neutrals.some((n) => n.toLowerCase() === hex.toLowerCase());

  const needed: Record<string, string> = { hauts: "", bas: "", chaussures: "" };
  needed[ancre.categorie] = ancre.id;

  for (const cat of ["hauts", "bas", "chaussures"] as const) {
    if (needed[cat]) continue;
    const candidates = allPieces.filter((p) => p.categorie === cat);
    // Préfère les couleurs neutres ou compatibles
    const match = candidates.find((p) => isNeutral(p.couleur_hex)) ?? candidates[0];
    if (match) needed[cat] = match.id;
  }

  const ids = Object.values(needed).filter(Boolean);
  return {
    pieces_ids: ids,
    explication: "Suggestion basée sur les règles de couleur de ta garde-robe (mode hors-ligne).",
    score: 6,
    source: "fallback",
  };
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const { ok } = checkRateLimit(ip);
  if (!ok) {
    return NextResponse.json({ error: "Trop de requêtes. Attends 1 minute." }, { status: 429 });
  }

  const { ancre_id, occasion, meteo, meteo_reel } = await req.json();
  // meteo_reel = { temp: number, label: string, meteo: string } depuis l'API météo

  // Charge toutes les pièces + préférences récentes
  const allPieces = await db.select().from(pieces);
  const recentPrefs = await db.select().from(preferences).orderBy(desc(preferences.date_ajout)).limit(20);

  // Contexte de la garde-robe (sera mis en cache par Claude)
  const gardeRobeContext = JSON.stringify({
    style: "Coastal starboy / Old money décontracté, Printemps-Été 2026",
    style_notes: [
      "Masculin, oversized/relaxed fits uniquement",
      "Esthétique côte méditerranéenne / European summer",
      "Palette dominante : blanc, écru, navy, beige, sand, kaki",
      "Graphic tees signature à thématique côtière",
      "Chaussures : sneakers blanches canvas, Sambas, Birkenstocks, espadrilles",
    ],
    color_rules: {
      rule: "Mélanger max 1 neutre + 1 accent, éviter navy+noir ensemble",
      neutrals: ["blanc", "écru", "beige", "gris"],
      accents: ["navy", "terracotta", "sand", "sage"],
    },
    forbidden_combos: ["graphic tee + chemise à motifs", "2 graphics", "hoodie + chemise"],
    garde_robe: allPieces.map((p) => ({
      id: p.id, marque: p.marque, nom: p.nom,
      categorie: p.categorie, sous_type: p.sous_type,
      couleur: p.couleur_nom, prix: p.prix_cad,
    })),
  });

  const ancre = allPieces.find((p) => p.id === ancre_id);
  if (!ancre) return NextResponse.json({ error: "Pièce introuvable" }, { status: 404 });

  const likesContext = recentPrefs.filter((p) => p.type === "like")
    .map((p) => `Likes: ${JSON.parse(p.pieces_ids).join(", ")}${p.occasion ? ` pour ${p.occasion}` : ""}${p.meteo ? ` (météo: ${p.meteo})` : ""}`).join("\n");
  const dislikesContext = recentPrefs.filter((p) => p.type === "dislike")
    .map((p) => `N'aime pas: ${JSON.parse(p.pieces_ids).join(", ")}`).join("\n");

  const meteoReelContext = meteo_reel
    ? `Météo réelle actuelle: ${meteo_reel.temp}°C, ${meteo_reel.label} → catégorie "${meteo_reel.meteo}"`
    : null;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: [
        {
          // La garde-robe est mise en cache (économise ~90% des tokens)
          type: "text",
          text: `Tu es un styliste personnel expert en mode masculine contemporaine. Voici la garde-robe complète et les règles de style à respecter:\n\n${gardeRobeContext}`,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Génère 3 propositions d'outfit pour la pièce ancre suivante:
- Pièce ancre: ${ancre.marque} ${ancre.nom} (${ancre.couleur_nom}, ${ancre.sous_type})
- Occasion: ${occasion ?? "casual"}
- Météo sélectionnée: ${meteo ?? "chaud"}
${meteoReelContext ? `- ${meteoReelContext}` : ""}
${likesContext ? `\nCombos que j'aime (apprendre de ces préférences):\n${likesContext}` : ""}
${dislikesContext ? `\nCombos à éviter:\n${dislikesContext}` : ""}

Réponds UNIQUEMENT en JSON valide avec ce format exact:
{
  "propositions": [
    {
      "pieces_ids": ["id1", "id2", "id3"],
      "explication": "2-3 phrases sur le style et pourquoi ces pièces matchent",
      "score": 8
    }
  ]
}

Règles importantes:
- Inclure obligatoirement: 1 haut + 1 bas + 1 chaussure (+ 1 accessoire si pertinent)
- La pièce ancre DOIT être incluse dans chaque proposition
- Utiliser UNIQUEMENT les ids existants dans la garde-robe
- Respecter les color_rules et forbidden_combos
${meteoReelContext ? `- IMPORTANT: La PREMIÈRE proposition doit être parfaitement adaptée à la météo réelle (${meteo_reel!.temp}°C, ${meteo_reel!.label}). Mentionne explicitement dans l'explication pourquoi cet outfit convient à cette météo.` : ""}`,
        },
      ],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON invalide");
    const parsed = JSON.parse(jsonMatch[0]);

    // Enregistre les stats d'utilisation
    const mois = new Date().toISOString().slice(0, 7);
    const usage = response.usage as {
      input_tokens: number;
      output_tokens: number;
      cache_read_input_tokens?: number;
    };
    const existingStat = await db.select().from(usage_stats).where(eq(usage_stats.date, mois));
    if (existingStat.length > 0) {
      await db.update(usage_stats).set({
        input_tokens:    existingStat[0].input_tokens + (usage.input_tokens ?? 0),
        output_tokens:   existingStat[0].output_tokens + (usage.output_tokens ?? 0),
        cached_tokens:   existingStat[0].cached_tokens + (usage.cache_read_input_tokens ?? 0),
        outfits_generes: existingStat[0].outfits_generes + 1,
      }).where(eq(usage_stats.date, mois));
    } else {
      await db.insert(usage_stats).values({
        id: randomUUID(), date: mois,
        input_tokens:    usage.input_tokens ?? 0,
        output_tokens:   usage.output_tokens ?? 0,
        cached_tokens:   usage.cache_read_input_tokens ?? 0,
        outfits_generes: 1,
      });
    }

    return NextResponse.json({ propositions: parsed.propositions, source: "claude" });

  } catch {
    // Fallback si API indisponible
    const fallback = fallbackOutfit(ancre_id, allPieces);
    return NextResponse.json({
      propositions: fallback ? [fallback] : [],
      source: "fallback",
      warning: "IA indisponible — suggestion basée sur les règles de style.",
    });
  }
}
