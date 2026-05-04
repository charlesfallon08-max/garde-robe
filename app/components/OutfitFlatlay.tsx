"use client";

import type { Piece } from "@/db/schema";

type Props = {
  pieces: Piece[];
  mini?: boolean; // version réduite pour la grille des outfits sauvegardés
};

function PieceSlot({ piece, size = "md" }: { piece: Piece | undefined; size?: "sm" | "md" }) {
  if (!piece) return null;
  const dim = size === "sm" ? "w-14 h-14" : "w-20 h-20";

  return (
    <div className={`${dim} rounded-sm border border-sand/20 bg-white flex items-center justify-center overflow-hidden shadow-sm`}>
      {piece.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={piece.image_url} alt={piece.nom} className="w-full h-full object-contain" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 px-1"
          style={{ backgroundColor: piece.couleur_hex + "22" }}>
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: piece.couleur_hex }} />
          <span className="text-[9px] text-center text-ink/60 leading-tight line-clamp-2">{piece.nom}</span>
        </div>
      )}
    </div>
  );
}

export default function OutfitFlatlay({ pieces: outfitPieces, mini = false }: Props) {
  const haut        = outfitPieces.find((p) => p.categorie === "hauts");
  const bas         = outfitPieces.find((p) => p.categorie === "bas");
  const chaussures  = outfitPieces.find((p) => p.categorie === "chaussures");
  const accessoire  = outfitPieces.find((p) => p.categorie === "accessoires");

  const size = mini ? "sm" : "md";

  return (
    <div className="flex gap-3 items-start">
      {/* Colonne principale : haut → bas → chaussures */}
      <div className="flex flex-col items-center gap-2">
        <PieceSlot piece={haut}       size={size} />
        <PieceSlot piece={bas}        size={size} />
        <PieceSlot piece={chaussures} size={size} />
      </div>

      {/* Colonne accessoire */}
      {accessoire && (
        <div className="flex flex-col items-start gap-1 mt-2">
          <PieceSlot piece={accessoire} size={size} />
        </div>
      )}
    </div>
  );
}
