"use client";

import { useState } from "react";
import type { Piece } from "@/db/schema";
import EditPieceModal from "./EditPieceModal";

type Props = {
  piece: Piece;
  onDelete: (id: string) => void;
  onEdit: () => void;
  onStatutChange?: (id: string, statut: string) => void;
};

export default function PieceCard({ piece, onDelete, onEdit, onStatutChange }: Props) {
  const [hover, setHover]                 = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showEdit, setShowEdit]           = useState(false);
  const [statut, setStatut]               = useState(piece.statut ?? "possédé");

  const toggleStatut = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = statut === "possédé" ? "wishlist" : "possédé";
    setStatut(next);
    await fetch(`/api/pieces/${piece.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...piece, statut: next }),
    });
    onStatutChange?.(piece.id, next);
  };

  const handleDelete = () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    onDelete(piece.id);
  };

  return (
    <>
      <div
        className="relative bg-white rounded-sm overflow-hidden shadow-sm border border-sand/20 transition-all duration-200 hover:shadow-md flex flex-col"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => { setHover(false); setConfirmDelete(false); }}
      >
        {/* ── Zone photo (grande, occupe la majorité de la carte) ── */}
        <div
          className="relative w-full aspect-[3/4] flex items-center justify-center overflow-hidden cursor-pointer"
          style={{ backgroundColor: piece.image_url ? "var(--cream)" : piece.couleur_hex + "18" }}
          onClick={() => setShowEdit(true)}
        >
          {piece.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={piece.image_url}
              alt={piece.nom}
              className="w-full h-full object-contain"
            />
          ) : (
            /* Placeholder quand pas de photo */
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-12 h-12 rounded-full border-2 border-dashed opacity-40"
                style={{ borderColor: piece.couleur_hex, backgroundColor: piece.couleur_hex + "33" }}
              />
              <span className="text-[10px] uppercase tracking-widest text-ink/30">+ Photo</span>
            </div>
          )}

          {/* Badge catégorie */}
          <span className="absolute top-2 left-2 text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-white/80 text-ink/50">
            {piece.sous_type}
          </span>

          {/* Badge wishlist */}
          <button
            onClick={toggleStatut}
            title={statut === "wishlist" ? "Marquer comme possédé" : "Ajouter à la wishlist"}
            className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all text-sm ${
              statut === "wishlist"
                ? "bg-terracotta text-white shadow-sm"
                : "bg-white/70 text-ink/20 hover:bg-white hover:text-ink/40"
            }`}
          >
            ★
          </button>
        </div>

        {/* ── Infos texte (compactes en bas) ── */}
        <div className="px-3 py-3 flex flex-col gap-1 flex-1">
          <p className="text-[10px] uppercase tracking-widest text-sand leading-none">{piece.marque}</p>
          <h3
            className="text-base leading-tight text-ink"
            style={{ fontFamily: "var(--font-cormorant)" }}
          >
            {piece.nom}
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-2.5 h-2.5 rounded-full border border-black/10 flex-shrink-0"
              style={{ backgroundColor: piece.couleur_hex }} />
            <span className="text-[11px] text-ink/50">{piece.couleur_nom}</span>
          </div>
          {piece.prix_cad && (
            <p className="text-xs font-medium text-navy mt-0.5">{piece.prix_cad} $</p>
          )}
        </div>

        {/* ── Actions au hover ── */}
        {hover && (
          <div className="absolute bottom-0 left-0 right-0 flex border-t border-sand/20 bg-white/95 backdrop-blur-sm">
            {piece.url_achat && (
              <a
                href={piece.url_achat}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 text-center text-xs text-navy hover:bg-navy hover:text-white transition-colors"
              >
                Voir ↗
              </a>
            )}
            <button
              onClick={() => setShowEdit(true)}
              className="flex-1 py-2 text-center text-xs text-sand hover:bg-sand hover:text-white transition-colors"
            >
              Éditer
            </button>
            <button
              onClick={handleDelete}
              className={`flex-1 py-2 text-center text-xs transition-colors ${
                confirmDelete
                  ? "bg-terracotta text-white"
                  : "text-terracotta hover:bg-terracotta hover:text-white"
              }`}
            >
              {confirmDelete ? "Confirmer ?" : "×"}
            </button>
          </div>
        )}
      </div>

      {showEdit && (
        <EditPieceModal
          piece={piece}
          onSave={() => { setShowEdit(false); onEdit(); }}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  );
}
