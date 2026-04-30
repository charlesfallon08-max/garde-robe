"use client";

import { useState } from "react";
import type { Piece } from "@/db/schema";
import EditPieceModal from "./EditPieceModal";

type Props = {
  piece: Piece;
  onDelete: (id: string) => void;
  onEdit: () => void;
};

export default function PieceCard({ piece, onDelete, onEdit }: Props) {
  const [hover, setHover]               = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showEdit, setShowEdit]         = useState(false);

  const handleDelete = () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    onDelete(piece.id);
  };

  return (
    <>
      <div
        className="relative bg-white rounded-sm overflow-hidden shadow-sm border border-sand/20 transition-all duration-200 hover:shadow-md"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => { setHover(false); setConfirmDelete(false); }}
      >
        {/* Zone image ou bande couleur */}
        {piece.image_url ? (
          <div className="w-full aspect-square bg-cream flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={piece.image_url}
              alt={piece.nom}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div
            className="h-2 w-full"
            style={{ backgroundColor: piece.couleur_hex }}
          />
        )}

        {/* Contenu texte */}
        <div className="p-4">
          <p className="text-xs uppercase tracking-widest text-sand font-body mb-1">
            {piece.marque}
          </p>
          <h3
            className="text-lg leading-tight text-ink mb-2"
            style={{ fontFamily: "var(--font-cormorant)" }}
          >
            {piece.nom}
          </h3>

          <div className="flex items-center gap-2 mb-3">
            <span
              className="w-3 h-3 rounded-full border border-black/10 flex-shrink-0"
              style={{ backgroundColor: piece.couleur_hex }}
            />
            <span className="text-xs text-ink/60">{piece.couleur_nom}</span>
            <span className="text-xs text-ink/30">·</span>
            <span className="text-xs text-ink/60 capitalize">{piece.sous_type}</span>
          </div>

          {piece.prix_cad && (
            <p className="text-sm font-medium text-navy">{piece.prix_cad} $</p>
          )}

          {piece.notes && (
            <p
              className="text-xs text-ink/50 mt-2 line-clamp-2 italic"
              style={{ fontFamily: "var(--font-instrument)" }}
            >
              {piece.notes}
            </p>
          )}
        </div>

        {/* Actions au hover */}
        {hover && (
          <div className="absolute bottom-0 left-0 right-0 flex border-t border-sand/20 bg-white">
            {/* Voir ↗ */}
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

            {/* Éditer */}
            <button
              onClick={() => setShowEdit(true)}
              className="flex-1 py-2 text-center text-xs text-sand hover:bg-sand hover:text-white transition-colors"
            >
              Éditer
            </button>

            {/* Supprimer */}
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

      {/* Modal d'édition */}
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
