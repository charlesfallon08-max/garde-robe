"use client";

import { useState } from "react";
import type { Outfit, Piece } from "@/db/schema";
import OutfitFlatlay from "./OutfitFlatlay";

type Props = {
  outfit: Outfit;
  allPieces: Piece[];
  onDelete: (id: string) => void;
};

const OCCASION_LABELS: Record<string, string> = {
  jour: "Jour", soir: "Soir", beach: "Beach",
  terrasse: "Terrasse", école: "École",
};

export default function OutfitCard({ outfit, allPieces, onDelete }: Props) {
  const [hover, setHover]         = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const ids = JSON.parse(outfit.pieces_ids) as string[];
  const outfitPieces = ids.map((id) => allPieces.find((p) => p.id === id)).filter(Boolean) as Piece[];

  return (
    <div
      className="relative bg-white rounded-sm border border-sand/20 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setConfirmDel(false); }}
    >
      <div className="p-4">
        {/* Flat-lay miniature */}
        <div className="flex justify-center mb-4">
          <OutfitFlatlay pieces={outfitPieces} mini />
        </div>

        {/* Occasion + score */}
        <div className="flex items-center justify-between mb-2">
          {outfit.occasion && (
            <span className="text-xs uppercase tracking-widest px-2 py-0.5 rounded-full border border-sand/40 text-sand">
              {OCCASION_LABELS[outfit.occasion] ?? outfit.occasion}
            </span>
          )}
          {outfit.score && (
            <span className="text-xs text-ink/40">Score {outfit.score}/10</span>
          )}
        </div>

        {/* Explication */}
        {outfit.explication && (
          <p className="text-xs text-ink/60 line-clamp-3 italic" style={{ fontFamily: "var(--font-instrument)" }}>
            {outfit.explication}
          </p>
        )}

        {/* Prix total */}
        {outfit.prix_total && (
          <p className="text-sm font-medium text-navy mt-2">{outfit.prix_total.toFixed(0)} $ total</p>
        )}
      </div>

      {/* Bouton supprimer au hover */}
      {hover && (
        <div className="absolute bottom-0 left-0 right-0 border-t border-sand/20">
          <button
            onClick={() => confirmDel ? onDelete(outfit.id) : setConfirmDel(true)}
            className={`w-full py-2 text-xs transition-colors ${
              confirmDel ? "bg-terracotta text-white" : "text-terracotta hover:bg-terracotta hover:text-white"
            }`}
          >
            {confirmDel ? "Confirmer la suppression ?" : "Supprimer"}
          </button>
        </div>
      )}
    </div>
  );
}
