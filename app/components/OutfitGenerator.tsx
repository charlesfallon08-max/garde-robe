"use client";

import { useState, useEffect } from "react";
import type { Piece } from "@/db/schema";
import OutfitFlatlay from "./OutfitFlatlay";
import { getLocationWeather, type WeatherData } from "@/lib/weather";

type Proposition = {
  pieces_ids: string[];
  explication: string;
  score: number;
};

type Props = {
  allPieces: Piece[];
  season?: "ete" | "hiver";
  onSaved: () => void;
};

const OCCASIONS = ["jour", "soir", "beach", "terrasse", "école"];
const METEOS    = ["chaud", "frais", "froid", "pluvieux"];

const OCCASION_ICONS: Record<string, string> = {
  jour: "☀️", soir: "🌙", beach: "🏖", terrasse: "☕", "école": "🎒",
};
const METEO_ICONS: Record<string, string> = {
  chaud: "🌡", frais: "🍃", froid: "❄️", pluvieux: "🌧",
};

export default function OutfitGenerator({ allPieces, season, onSaved }: Props) {
  const [ancreId, setAncreId]       = useState<string | null>(null);
  const [occasion, setOccasion]     = useState("jour");
  const [meteo, setMeteo]           = useState(season === "hiver" ? "froid" : "chaud");
  const [meteoReel, setMeteoReel]   = useState<WeatherData | null>(null);
  const [meteoLoading, setMeteoLoading] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [propositions, setPropositions] = useState<Proposition[]>([]);
  const [source, setSource]         = useState<"claude" | "fallback" | null>(null);
  const [warning, setWarning]       = useState<string | null>(null);
  const [saved, setSaved]           = useState<Set<number>>(new Set());
  const [disliked, setDisliked]     = useState<Set<number>>(new Set());

  useEffect(() => {
    setMeteoLoading(true);
    getLocationWeather().then((data) => {
      if (data) {
        setMeteoReel(data);
        setMeteo(data.meteo);
      }
      setMeteoLoading(false);
    });
  }, []);

  const ancre = allPieces.find((p) => p.id === ancreId);

  const generate = async () => {
    if (!ancreId) return;
    setLoading(true);
    setPropositions([]);
    setSaved(new Set());
    setDisliked(new Set());
    setWarning(null);

    const res = await fetch("/api/outfits/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ancre_id: ancreId, occasion, meteo, meteo_reel: meteoReel, saison: season }),
    });
    const data = await res.json();
    setPropositions(data.propositions ?? []);
    setSource(data.source);
    setWarning(data.warning ?? null);
    setLoading(false);
  };

  const saveOutfit = async (idx: number) => {
    const prop = propositions[idx];
    const propPieces = prop.pieces_ids
      .map((id) => allPieces.find((p) => p.id === id))
      .filter(Boolean) as Piece[];
    const prixTotal = propPieces.reduce((sum, p) => sum + (p.prix_cad ?? 0), 0);

    await fetch("/api/outfits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pieces_ids: prop.pieces_ids,
        occasion,
        explication: prop.explication,
        score: prop.score,
        prix_total: prixTotal,
      }),
    });
    await fetch("/api/outfits/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "like", pieces_ids: prop.pieces_ids, occasion, meteo }),
    });
    setSaved((prev) => new Set(prev).add(idx));
    onSaved();
  };

  const dislikeOutfit = async (idx: number) => {
    const prop = propositions[idx];
    await fetch("/api/outfits/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "dislike", pieces_ids: prop.pieces_ids, occasion, meteo }),
    });
    setDisliked((prev) => new Set(prev).add(idx));
  };

  return (
    <div className="space-y-8">
      {/* ── Panneau de sélection ── */}
      <div className="bg-white rounded-sm border border-sand/20 p-6 shadow-sm">
        <h2 className="text-2xl text-navy mb-5" style={{ fontFamily: "var(--font-cormorant)" }}>
          Générer un outfit
        </h2>

        {/* Sélecteur occasion */}
        <div className="mb-5">
          <p className="text-xs uppercase tracking-widest text-sand mb-2">Occasion</p>
          <div className="flex gap-2 flex-wrap">
            {OCCASIONS.map((o) => (
              <button key={o} onClick={() => setOccasion(o)}
                className={`px-4 py-1.5 text-xs rounded-full border capitalize transition-colors ${
                  occasion === o ? "bg-navy text-cream border-navy" : "border-sand/40 text-ink/60 hover:border-navy"
                }`}>
                {OCCASION_ICONS[o]} {o}
              </button>
            ))}
          </div>
        </div>

        {/* Sélecteur météo */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <p className="text-xs uppercase tracking-widest text-sand">Météo</p>
            {meteoLoading && <span className="text-[10px] text-ink/30 animate-pulse">Détection…</span>}
            {meteoReel && !meteoLoading && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-navy/10 text-navy">
                {meteoReel.temp}°C · {meteoReel.label}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {METEOS.map((m) => (
              <button key={m} onClick={() => setMeteo(m)}
                className={`px-4 py-1.5 text-xs rounded-full border capitalize transition-colors ${
                  meteo === m ? "bg-sand text-white border-sand" : "border-sand/40 text-ink/60 hover:border-sand"
                }`}>
                {METEO_ICONS[m]} {m}
                {meteoReel?.meteo === m && <span className="ml-1 opacity-70">●</span>}
              </button>
            ))}
          </div>
          {meteoReel && (
            <p className="text-[10px] text-ink/30 mt-1.5">
              Météo réelle détectée · le 1er outfit sera adapté à {meteoReel.temp}°C
            </p>
          )}
        </div>

        {/* Sélecteur pièce ancre */}
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest text-sand mb-2">Pièce de départ</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-64 overflow-y-auto pr-1">
            {allPieces.map((p) => (
              <button key={p.id} onClick={() => setAncreId(p.id)}
                className={`relative rounded-sm border p-2 transition-all text-left ${
                  ancreId === p.id
                    ? "border-navy bg-navy/5 shadow-sm"
                    : "border-sand/20 hover:border-sand bg-white"
                }`}>
                <div className="w-full aspect-square rounded-sm overflow-hidden mb-1 flex items-center justify-center"
                  style={{ backgroundColor: p.couleur_hex + "33" }}>
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt={p.nom} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: p.couleur_hex }} />
                  )}
                </div>
                <p className="text-[9px] text-ink/50 uppercase tracking-wide">{p.marque}</p>
                <p className="text-[10px] text-ink leading-tight line-clamp-2">{p.nom}</p>
                {ancreId === p.id && (
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-navy" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Bouton générer */}
        <button onClick={generate} disabled={!ancreId || loading}
          className="w-full py-3 bg-navy text-cream text-sm uppercase tracking-widest rounded-sm hover:bg-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          {loading ? (
            <span className="animate-pulse">Claude analyse ta garde-robe…</span>
          ) : (
            "✦ Générer un outfit"
          )}
        </button>

        {warning && (
          <p className="mt-3 text-xs text-terracotta text-center">{warning}</p>
        )}
      </div>

      {/* ── Propositions ── */}
      {propositions.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-xl text-navy" style={{ fontFamily: "var(--font-cormorant)" }}>
              {propositions.length} proposition{propositions.length > 1 ? "s" : ""}
            </h3>
            {source === "claude" && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-navy/10 text-navy">Claude IA</span>
            )}
            {source === "fallback" && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-sand/20 text-sand">Règles locales</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {propositions.map((prop, idx) => {
              const propPieces = prop.pieces_ids
                .map((id) => allPieces.find((p) => p.id === id))
                .filter(Boolean) as Piece[];
              const prixTotal = propPieces.reduce((sum, p) => sum + (p.prix_cad ?? 0), 0);
              const isSaved    = saved.has(idx);
              const isDisliked = disliked.has(idx);

              return (
                <div key={idx}
                  className={`bg-white rounded-sm border shadow-sm transition-all ${
                    isSaved ? "border-navy/40 bg-navy/5" : isDisliked ? "border-sand/10 opacity-50" : "border-sand/20"
                  }`}>
                  <div className="p-5">
                    {/* Flat-lay */}
                    <div className="flex justify-center mb-5 py-3 bg-cream rounded-sm">
                      <OutfitFlatlay pieces={propPieces} />
                    </div>

                    {/* Score */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs uppercase tracking-widest text-sand">
                        Proposition {idx + 1}
                      </span>
                      <span className="text-xs font-medium text-ink/50">
                        Score {prop.score}/10
                      </span>
                    </div>

                    {/* Explication */}
                    <p className="text-sm text-ink/70 leading-relaxed mb-3 italic"
                      style={{ fontFamily: "var(--font-instrument)" }}>
                      {prop.explication}
                    </p>

                    {/* Pièces listées */}
                    <div className="space-y-1 mb-4">
                      {propPieces.map((p) => (
                        <div key={p.id} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.couleur_hex }} />
                          <span className="text-xs text-ink/60">{p.marque} — {p.nom}</span>
                        </div>
                      ))}
                    </div>

                    {/* Prix + actions */}
                    <div className="border-t border-sand/20 pt-3">
                      <p className="text-xs text-ink/40 mb-3">{prixTotal.toFixed(0)} $ CAD</p>
                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => saveOutfit(idx)} disabled={isSaved || isDisliked}
                          className={`py-2 text-xs rounded-sm border transition-colors ${
                            isSaved ? "bg-navy/10 text-navy border-navy/30" : "border-sand/30 text-ink/60 hover:bg-navy hover:text-white hover:border-navy"
                          } disabled:cursor-not-allowed`}>
                          {isSaved ? "Sauvé ✓" : "❤ Garder"}
                        </button>
                        <button onClick={() => dislikeOutfit(idx)} disabled={isSaved || isDisliked}
                          className={`py-2 text-xs rounded-sm border transition-colors ${
                            isDisliked ? "bg-sand/10 text-sand border-sand/30" : "border-sand/30 text-ink/60 hover:bg-terracotta hover:text-white hover:border-terracotta"
                          } disabled:cursor-not-allowed`}>
                          {isDisliked ? "Noté ✓" : "✗ Pas fan"}
                        </button>
                        <button onClick={generate} disabled={loading}
                          className="py-2 text-xs rounded-sm border border-sand/30 text-ink/60 hover:border-navy hover:text-navy transition-colors disabled:opacity-40">
                          🔄 Regen
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
