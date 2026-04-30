"use client";

import { useEffect, useState, useCallback } from "react";
import type { Piece } from "@/db/schema";
import PieceCard from "./components/PieceCard";
import AddPieceModal from "./components/AddPieceModal";

const CATEGORIES = [
  { key: "all",         label: "Tout" },
  { key: "hauts",       label: "Hauts" },
  { key: "bas",         label: "Bas" },
  { key: "chaussures",  label: "Chaussures" },
  { key: "accessoires", label: "Accessoires" },
];

export default function Home() {
  const [pieces, setPieces]       = useState<Piece[]>([]);
  const [filter, setFilter]       = useState("all");
  const [search, setSearch]       = useState("");
  const [showModal, setShowModal] = useState(false);
  const [seeded, setSeeded]       = useState(false);
  const [loading, setLoading]     = useState(true);

  const fetchPieces = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/pieces");
    const data = await res.json();
    setPieces(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!seeded) {
        await fetch("/api/pieces/seed", { method: "POST" });
        setSeeded(true);
      }
      await fetchPieces();
    };
    init();
  }, [seeded, fetchPieces]);

  const handleDelete = async (id: string) => {
    await fetch(`/api/pieces/${id}`, { method: "DELETE" });
    setPieces((prev) => prev.filter((p) => p.id !== id));
  };

  // Filtre par catégorie puis par recherche (nom, marque, couleur)
  const visible = pieces
    .filter((p) => filter === "all" || p.categorie === filter)
    .filter((p) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        p.nom.toLowerCase().includes(q) ||
        p.marque.toLowerCase().includes(q) ||
        p.couleur_nom.toLowerCase().includes(q) ||
        p.sous_type.toLowerCase().includes(q)
      );
    });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--cream)" }}>
      {/* En-tête */}
      <header className="border-b border-sand/30 px-6 py-8">
        <p className="text-xs uppercase tracking-[0.3em] text-sand mb-2">Collection personnelle</p>
        <h1
          className="text-5xl text-navy leading-none"
          style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300 }}
        >
          Garde-Robe
        </h1>
        <p
          className="text-xl text-ink/50 mt-1"
          style={{ fontFamily: "var(--font-instrument)", fontStyle: "italic" }}
        >
          Printemps — Été 2026
        </p>
      </header>

      {/* Navigation onglets */}
      <nav className="border-b border-sand/30 px-6 flex gap-8">
        <button className="py-4 text-sm uppercase tracking-widest text-navy border-b-2 border-navy -mb-px">
          Ma Garde-Robe
        </button>
        <button className="py-4 text-sm uppercase tracking-widest text-ink/30 cursor-not-allowed" disabled>
          Outfits
        </button>
        <button className="py-4 text-sm uppercase tracking-widest text-ink/30 cursor-not-allowed" disabled>
          Avatar
        </button>
      </nav>

      {/* Filtres + Recherche + Bouton ajouter */}
      <div className="px-6 py-5 flex flex-col gap-4">
        {/* Ligne 1 : filtres catégorie */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(({ key, label }) => {
              const count = key === "all"
                ? pieces.length
                : pieces.filter((p) => p.categorie === key).length;
              return (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-4 py-1.5 text-xs uppercase tracking-widest rounded-full border transition-colors ${
                    filter === key
                      ? "bg-navy text-cream border-navy"
                      : "border-sand/40 text-ink/60 hover:border-navy hover:text-navy"
                  }`}
                >
                  {label}
                  <span className={`ml-1.5 ${filter === key ? "text-sand" : "text-ink/30"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2 bg-navy text-cream text-xs uppercase tracking-widest rounded-sm hover:bg-ink transition-colors"
          >
            <span className="text-lg leading-none">+</span> Ajouter une pièce
          </button>
        </div>

        {/* Ligne 2 : barre de recherche */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30 text-sm">⌕</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, marque, couleur…"
            className="w-full pl-8 pr-4 py-2 border border-sand/30 rounded-sm bg-white/60 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:border-navy"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Grille */}
      <main className="px-6 pb-12">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <p className="text-ink/40 text-sm tracking-widest uppercase">Chargement…</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex items-center justify-center py-24 flex-col gap-2">
            <p className="text-ink/40 text-sm">Aucune pièce trouvée.</p>
            {search && (
              <button onClick={() => setSearch("")} className="text-xs text-navy underline">
                Effacer la recherche
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {visible.map((piece) => (
              <PieceCard
                key={piece.id}
                piece={piece}
                onDelete={handleDelete}
                onEdit={fetchPieces}
              />
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <AddPieceModal
          onAdd={() => { setShowModal(false); fetchPieces(); }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
