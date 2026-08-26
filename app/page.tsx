"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import type { Piece, Outfit } from "@/db/schema";
import PieceCard from "./components/PieceCard";
import AddPieceModal from "./components/AddPieceModal";
import OutfitCard from "./components/OutfitCard";
import OutfitGenerator from "./components/OutfitGenerator";
import StatsWidget from "./components/StatsWidget";
import { getStyleSortIndex } from "@/lib/styleTypes";

type Tab = "garderobe" | "outfits";
type Season = "ete" | "hiver";

function defaultSeason(): Season {
  const month = new Date().getMonth(); // 0 = janvier
  return month === 11 || month === 0 || month === 1 ? "hiver" : "ete";
}

const PIECE_CATEGORIES = [
  { key: "all", label: "Tout" },
  { key: "hauts", label: "Hauts" },
  { key: "bas", label: "Bas" },
  { key: "chaussures", label: "Chaussures" },
  { key: "accessoires", label: "Accessoires" },
  { key: "wishlist", label: "★ Wishlist" },
];

const OUTFIT_OCCASIONS = [
  { key: "all", label: "Tous" },
  { key: "jour", label: "☀️ Jour" },
  { key: "soir", label: "🌙 Soir" },
  { key: "beach", label: "🏖 Beach" },
  { key: "terrasse", label: "☕ Terrasse" },
  { key: "école", label: "🎒 École" },
];

export default function Home() {
  const { data: session } = useSession();
  const [tab, setTab]             = useState<Tab>("garderobe");
  const [pieces, setPieces]       = useState<Piece[]>([]);
  const [outfits, setOutfits]     = useState<Outfit[]>([]);
  const [pieceFilter, setPieceFilter] = useState("all");
  const [outfitFilter, setOutfitFilter] = useState("all");
  const [search, setSearch]       = useState("");
  const [showModal, setShowModal] = useState(false);
  const [seeded, setSeeded]       = useState(false);
  const [loading, setLoading]     = useState(true);
  const [showGenerator, setShowGenerator] = useState(false);
  const [season, setSeason] = useState<Season>("ete");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("garde-robe-season");
    setSeason(stored === "ete" || stored === "hiver" ? stored : defaultSeason());
  }, []);

  const handleSeasonChange = (s: Season) => {
    setSeason(s);
    localStorage.setItem("garde-robe-season", s);
  };

  const fetchPieces = useCallback(async () => {
    const res = await fetch("/api/pieces");
    if (!res.ok) return;
    setPieces(await res.json());
  }, []);

  const fetchOutfits = useCallback(async () => {
    const res = await fetch("/api/outfits");
    if (!res.ok) return;
    setOutfits(await res.json());
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    const init = async () => {
      if (!seeded) {
        await fetch("/api/pieces/seed", { method: "POST" });
        setSeeded(true);
      }
      await Promise.all([fetchPieces(), fetchOutfits()]);
      setLoading(false);
    };
    init();
  }, [session, seeded, fetchPieces, fetchOutfits]);

  const handleDeletePiece = async (id: string) => {
    await fetch(`/api/pieces/${id}`, { method: "DELETE" });
    setPieces((prev) => prev.filter((p) => p.id !== id));
  };

  const handleDeleteOutfit = async (id: string) => {
    await fetch(`/api/outfits/${id}`, { method: "DELETE" });
    setOutfits((prev) => prev.filter((o) => o.id !== id));
  };

  const CATEGORIE_ORDER: Record<string, number> = {
    hauts: 0, bas: 1, chaussures: 2, accessoires: 3,
  };

  const handleStatutChange = (id: string, statut: string) => {
    setPieces((prev) => prev.map((p) => p.id === id ? { ...p, statut } as typeof p : p));
  };

  const otherSeason: Season = season === "ete" ? "hiver" : "ete";

  const toggleSelectMode = () => {
    setSelectMode((prev) => !prev);
    setSelectedIds(new Set());
  };

  const toggleSelectPiece = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const addSelectedToOtherSeason = async () => {
    setBulkSaving(true);
    const targets = pieces.filter((p) => selectedIds.has(p.id));
    await Promise.all(targets.map((p) =>
      fetch(`/api/pieces/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...p, saison: "toutes" }),
      })
    ));
    await fetchPieces();
    setBulkSaving(false);
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const bySeason = (p: Piece) => {
    const s = (p as Piece & { saison?: string }).saison;
    return !s || s === "toutes" || s === season;
  };

  const seasonPieces = pieces.filter(bySeason);
  const wishlistPieces = seasonPieces.filter((p) => p.statut === "wishlist");
  const wishlistTotal  = wishlistPieces.reduce((sum, p) => sum + (p.prix_cad ?? 0), 0);

  const visiblePieces = seasonPieces
    .filter((p) => {
      if (pieceFilter === "wishlist") return p.statut === "wishlist";
      return pieceFilter === "all" || p.categorie === pieceFilter;
    })
    .filter((p) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return p.nom.toLowerCase().includes(q) || p.marque.toLowerCase().includes(q) || p.couleur_nom.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      // 1. Catégorie (hauts → bas → chaussures → accessoires)
      const catDiff = (CATEGORIE_ORDER[a.categorie] ?? 9) - (CATEGORIE_ORDER[b.categorie] ?? 9);
      if (catDiff !== 0) return catDiff;
      // 2. Style dans l'ordre exact défini dans styleTypes.ts
      const aStyle = (a as typeof a & { style_type?: string }).style_type ?? "";
      const bStyle = (b as typeof b & { style_type?: string }).style_type ?? "";
      return getStyleSortIndex(a.categorie, aStyle) - getStyleSortIndex(b.categorie, bStyle);
    });

  const visibleOutfits = outfits.filter(
    (o) => outfitFilter === "all" || o.occasion === outfitFilter
  );

  return (
    <div className="min-h-screen pb-12" style={{ backgroundColor: "var(--cream)" }}>
      {/* En-tête */}
      <header className="border-b border-sand/30 px-6 py-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sand mb-2">Collection personnelle</p>
            <h1 className="text-5xl text-navy leading-none"
              style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300 }}>
              Garde-Robe
            </h1>
            <p className="text-xl text-ink/50 mt-1"
              style={{ fontFamily: "var(--font-instrument)", fontStyle: "italic" }}>
              {season === "hiver" ? "Automne — Hiver 2026" : "Printemps — Été 2026"}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex rounded-full border border-sand/40 overflow-hidden">
              <button onClick={() => handleSeasonChange("ete")}
                className={`px-3 py-1.5 text-xs transition-colors ${
                  season === "ete" ? "bg-navy text-cream" : "text-ink/50 hover:bg-sand/10"
                }`}>
                ☀️ Été
              </button>
              <button onClick={() => handleSeasonChange("hiver")}
                className={`px-3 py-1.5 text-xs transition-colors ${
                  season === "hiver" ? "bg-navy text-cream" : "text-ink/50 hover:bg-sand/10"
                }`}>
                ❄️ Hiver
              </button>
            </div>
            {session?.user?.image && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={session.user.image} alt="" className="w-8 h-8 rounded-full" />
            )}
            <button onClick={() => signOut()}
              className="text-[11px] uppercase tracking-widest text-ink/30 hover:text-ink/70 transition-colors">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Navigation onglets */}
      <nav className="border-b border-sand/30 px-6 flex gap-8">
        <button onClick={() => setTab("garderobe")}
          className={`py-4 text-sm uppercase tracking-widest border-b-2 -mb-px transition-colors ${
            tab === "garderobe" ? "text-navy border-navy" : "text-ink/40 border-transparent hover:text-ink/70"
          }`}>
          Ma Garde-Robe
          <span className="ml-2 text-xs text-ink/30">{pieces.length}</span>
        </button>
        <button onClick={() => { setTab("outfits"); setSelectMode(false); setSelectedIds(new Set()); }}
          className={`py-4 text-sm uppercase tracking-widest border-b-2 -mb-px transition-colors ${
            tab === "outfits" ? "text-navy border-navy" : "text-ink/40 border-transparent hover:text-ink/70"
          }`}>
          Outfits
          {outfits.length > 0 && <span className="ml-2 text-xs text-ink/30">{outfits.length}</span>}
        </button>
        <button className="py-4 text-sm uppercase tracking-widest text-ink/25 cursor-not-allowed" disabled>
          Avatar
        </button>
      </nav>

      {/* ── ONGLET MA GARDE-ROBE ── */}
      {tab === "garderobe" && (
        <>
          <div className="px-6 py-5 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex gap-2 flex-wrap">
                {PIECE_CATEGORIES.map(({ key, label }) => {
                  const count = key === "wishlist"
                    ? wishlistPieces.length
                    : key === "all"
                      ? seasonPieces.length
                      : seasonPieces.filter((p) => p.categorie === key).length;
                  return (
                    <button key={key} onClick={() => setPieceFilter(key)}
                      className={`px-4 py-1.5 text-xs uppercase tracking-widest rounded-full border transition-colors ${
                        pieceFilter === key
                          ? key === "wishlist" ? "bg-terracotta text-white border-terracotta" : "bg-navy text-cream border-navy"
                          : "border-sand/40 text-ink/60 hover:border-navy hover:text-navy"
                      }`}>
                      {label} <span className={`ml-1 ${pieceFilter === key ? "opacity-70" : "text-ink/30"}`}>{count}</span>
                    </button>
                  );
                })}
                {pieceFilter === "wishlist" && wishlistTotal > 0 && (
                  <span className="flex items-center text-xs text-terracotta font-medium px-2">
                    Total : {wishlistTotal.toFixed(0)} $ CAD
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={toggleSelectMode}
                  className={`px-4 py-2 text-xs uppercase tracking-widest rounded-sm border transition-colors ${
                    selectMode ? "bg-sand text-white border-sand" : "border-sand/40 text-ink/60 hover:border-navy hover:text-navy"
                  }`}>
                  {selectMode ? "✕ Annuler" : "Sélectionner"}
                </button>
                <button onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 px-5 py-2 bg-navy text-cream text-xs uppercase tracking-widest rounded-sm hover:bg-ink transition-colors">
                  <span className="text-lg leading-none">+</span> Ajouter une pièce
                </button>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30 text-sm">⌕</span>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom, marque, couleur…"
                className="w-full pl-8 pr-4 py-2 border border-sand/30 rounded-sm bg-white/60 text-sm placeholder:text-ink/30 focus:outline-none focus:border-navy" />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink">✕</button>
              )}
            </div>
          </div>

          <main className="px-6 pb-6">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <p className="text-ink/40 text-sm tracking-widest uppercase">Chargement…</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {visiblePieces.map((piece) => (
                  <PieceCard key={piece.id} piece={piece} onDelete={handleDeletePiece} onEdit={fetchPieces} onStatutChange={handleStatutChange}
                    selectMode={selectMode} selected={selectedIds.has(piece.id)} onToggleSelect={toggleSelectPiece} />
                ))}
              </div>
            )}
          </main>
        </>
      )}

      {/* Barre d'action flottante — sélection multiple */}
      {selectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 px-5 py-3 bg-navy text-cream rounded-full shadow-lg">
          <span className="text-xs">{selectedIds.size} pièce{selectedIds.size > 1 ? "s" : ""} sélectionnée{selectedIds.size > 1 ? "s" : ""}</span>
          <button onClick={addSelectedToOtherSeason} disabled={bulkSaving}
            className="px-4 py-1.5 text-xs uppercase tracking-widest bg-cream text-navy rounded-full hover:bg-white transition-colors disabled:opacity-50">
            {bulkSaving ? "…" : otherSeason === "hiver" ? "❄️ Ajouter à Hiver" : "☀️ Ajouter à Été"}
          </button>
        </div>
      )}

      {/* ── ONGLET OUTFITS ── */}
      {tab === "outfits" && (
        <div className="px-6 py-6 space-y-8">
          {/* Bouton générateur */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl text-navy" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300 }}>
                Mes Outfits
              </h2>
              <p className="text-sm text-ink/40 mt-0.5" style={{ fontFamily: "var(--font-instrument)", fontStyle: "italic" }}>
                Créés avec Claude IA
              </p>
            </div>
            <button onClick={() => setShowGenerator(!showGenerator)}
              className={`px-5 py-2 text-xs uppercase tracking-widest rounded-sm border transition-colors ${
                showGenerator ? "bg-navy text-cream border-navy" : "bg-navy text-cream border-navy hover:bg-ink"
              }`}>
              {showGenerator ? "✕ Fermer" : "✦ Générer un outfit"}
            </button>
          </div>

          {/* Générateur (dépliable) */}
          {showGenerator && (
            <OutfitGenerator
              allPieces={seasonPieces}
              season={season}
              onSaved={() => { fetchOutfits(); }}
            />
          )}

          {/* Filtres occasions */}
          {outfits.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {OUTFIT_OCCASIONS.map(({ key, label }) => {
                const count = key === "all" ? outfits.length : outfits.filter((o) => o.occasion === key).length;
                if (key !== "all" && count === 0) return null;
                return (
                  <button key={key} onClick={() => setOutfitFilter(key)}
                    className={`px-4 py-1.5 text-xs rounded-full border transition-colors ${
                      outfitFilter === key ? "bg-navy text-cream border-navy" : "border-sand/40 text-ink/60 hover:border-navy"
                    }`}>
                    {label} <span className="ml-1 opacity-50">{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Grille des outfits sauvegardés */}
          {visibleOutfits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <p className="text-4xl opacity-20">✦</p>
              <p className="text-ink/40 text-sm">Aucun outfit sauvegardé pour l&apos;instant.</p>
              <button onClick={() => setShowGenerator(true)}
                className="text-xs text-navy underline">
                Générer mon premier outfit →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {visibleOutfits.map((outfit) => (
                <OutfitCard key={outfit.id} outfit={outfit} allPieces={pieces} onDelete={handleDeleteOutfit} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal ajout pièce */}
      {showModal && (
        <AddPieceModal
          onAdd={() => { setShowModal(false); fetchPieces(); }}
          onClose={() => setShowModal(false)}
          defaultSeason={season}
        />
      )}

      {/* Barre stats */}
      <StatsWidget />
    </div>
  );
}
