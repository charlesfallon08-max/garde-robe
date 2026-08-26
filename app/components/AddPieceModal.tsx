"use client";

import { useState } from "react";
import { STYLE_TYPES, getStyles } from "@/lib/styleTypes";

type Props = {
  onAdd: () => void;
  onClose: () => void;
  defaultSeason?: "ete" | "hiver";
};

const CATEGORIES = ["hauts", "bas", "chaussures", "accessoires"];
const SOUS_TYPES: Record<string, string[]> = Object.fromEntries(
  Object.entries(STYLE_TYPES).map(([cat, sousTypes]) => [cat, Object.keys(sousTypes)])
);
const SAISONS = ["toutes", "ete", "hiver"] as const;
const SAISON_LABELS: Record<string, string> = { toutes: "Toutes", ete: "☀️ Été", hiver: "❄️ Hiver" };

export default function AddPieceModal({ onAdd, onClose, defaultSeason = "ete" }: Props) {
  const initialCat       = "hauts";
  const initialSousType  = "tee";
  const initialStyles    = getStyles(initialCat, initialSousType);
  const initialStyleType = initialStyles[0] ?? "";

  const [form, setForm] = useState({
    marque:      "",
    nom:         initialStyleType,
    categorie:   initialCat,
    sous_type:   initialSousType,
    style_type:  initialStyleType,
    saison:      defaultSeason,
    statut:      "possédé",
    couleur_hex: "#FFFFFF",
    couleur_nom: "",
    prix_cad:    "",
    url_achat:   "",
    notes:       "",
  });
  const [nomModifié, setNomModifié] = useState(false); // true si l'utilisateur a tapé son propre nom
  const [loading, setLoading] = useState(false);

  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  // Quand la catégorie change → reset sous_type + style_type + nom
  const handleCategorieChange = (cat: string) => {
    const premierSousType = SOUS_TYPES[cat][0];
    const styles = getStyles(cat, premierSousType);
    const premierStyle = styles[0] ?? "";
    setForm((f) => ({
      ...f,
      categorie:  cat,
      sous_type:  premierSousType,
      style_type: premierStyle,
      nom:        nomModifié ? f.nom : premierStyle,
    }));
  };

  // Quand le sous_type change → reset style_type + nom (si non modifié)
  const handleSousTypeChange = (st: string) => {
    const styles = getStyles(form.categorie, st);
    const premierStyle = styles[0] ?? "";
    setForm((f) => ({
      ...f,
      sous_type:  st,
      style_type: premierStyle,
      nom:        nomModifié ? f.nom : premierStyle,
    }));
  };

  // Quand le style_type change → met à jour le nom automatiquement (si non modifié)
  const handleStyleTypeChange = (st: string) => {
    setForm((f) => ({
      ...f,
      style_type: st,
      nom:        nomModifié ? f.nom : st,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/pieces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        prix_cad: form.prix_cad ? parseFloat(form.prix_cad) : null,
      }),
    });
    setLoading(false);
    onAdd();
  };

  const stylesDisponibles = getStyles(form.categorie, form.sous_type);

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-cream rounded-sm shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-sand/30">
          <h2 className="font-display text-2xl text-navy" style={{ fontFamily: "var(--font-cormorant)" }}>
            Nouvelle pièce
          </h2>
          <button onClick={onClose} className="text-ink/40 hover:text-ink text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* ── Catégorie / Sous-type / Style — 3 niveaux ── */}
          <div className="space-y-3">
            {/* Niveau 1 : Catégorie */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-sand mb-1">Catégorie</label>
              <div className="flex gap-1.5 flex-wrap">
                {CATEGORIES.map((c) => (
                  <button key={c} type="button" onClick={() => handleCategorieChange(c)}
                    className={`px-3 py-1.5 text-xs rounded-full border capitalize transition-colors ${
                      form.categorie === c ? "bg-navy text-cream border-navy" : "border-sand/40 text-ink/60 hover:border-navy"
                    }`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Niveau 2 : Sous-type */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-sand mb-1">Sous-type</label>
              <div className="flex gap-1.5 flex-wrap">
                {(SOUS_TYPES[form.categorie] || []).map((s) => (
                  <button key={s} type="button" onClick={() => handleSousTypeChange(s)}
                    className={`px-3 py-1.5 text-xs rounded-full border capitalize transition-colors ${
                      form.sous_type === s ? "bg-sand text-white border-sand" : "border-sand/40 text-ink/60 hover:border-sand"
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Niveau 3 : Style (dépend du sous-type) */}
            {stylesDisponibles.length > 0 && (
              <div>
                <label className="block text-xs uppercase tracking-widest text-sand mb-1">Style</label>
                <div className="flex gap-1.5 flex-wrap">
                  {stylesDisponibles.map((s) => (
                    <button key={s} type="button" onClick={() => handleStyleTypeChange(s)}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                        form.style_type === s ? "bg-terracotta text-white border-terracotta" : "border-sand/40 text-ink/60 hover:border-terracotta"
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Marque */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-sand mb-1">Marque</label>
            <input required value={form.marque} onChange={(e) => set("marque", e.target.value)}
              placeholder="Zara, Uniqlo, Adidas…"
              className="w-full border border-sand/40 rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy" />
          </div>

          {/* Nom — pré-rempli, modifiable */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs uppercase tracking-widest text-sand">Nom du produit</label>
              {nomModifié && (
                <button type="button" onClick={() => { set("nom", form.style_type); setNomModifié(false); }}
                  className="text-[10px] text-sand hover:text-navy underline">
                  Réinitialiser
                </button>
              )}
            </div>
            <input required value={form.nom}
              onChange={(e) => { set("nom", e.target.value); setNomModifié(true); }}
              className="w-full border border-sand/40 rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy" />
          </div>

          {/* Couleur */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-widest text-sand mb-1">Couleur</label>
              <div className="flex gap-2">
                <input type="color" value={form.couleur_hex} onChange={(e) => set("couleur_hex", e.target.value)}
                  className="w-10 h-9 border border-sand/40 rounded-sm cursor-pointer" />
                <input value={form.couleur_hex} onChange={(e) => set("couleur_hex", e.target.value)}
                  className="flex-1 border border-sand/40 rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy" />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-sand mb-1">Nom couleur</label>
              <input value={form.couleur_nom} onChange={(e) => set("couleur_nom", e.target.value)}
                placeholder="Blanc, Navy…"
                className="w-full border border-sand/40 rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy" />
            </div>
          </div>

          {/* Prix */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-sand mb-1">Prix (CAD)</label>
            <input type="number" step="0.01" value={form.prix_cad} onChange={(e) => set("prix_cad", e.target.value)}
              placeholder="29.99"
              className="w-full border border-sand/40 rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy" />
          </div>

          {/* URL */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-sand mb-1">Lien d'achat</label>
            <input type="url" value={form.url_achat} onChange={(e) => set("url_achat", e.target.value)}
              placeholder="https://..."
              className="w-full border border-sand/40 rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy" />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-sand mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2}
              placeholder="Fit oversized, disponible en plusieurs couleurs…"
              className="w-full border border-sand/40 rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy resize-none" />
          </div>

          {/* Saison */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-sand mb-1">Saison</label>
            <div className="flex gap-2">
              {SAISONS.map((s) => (
                <button key={s} type="button" onClick={() => set("saison", s)}
                  className={`px-4 py-1.5 text-xs rounded-full border transition-colors ${
                    form.saison === s ? "bg-navy text-cream border-navy" : "border-sand/40 text-ink/60 hover:border-navy"
                  }`}>
                  {SAISON_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Statut */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-sand mb-1">Statut</label>
            <div className="flex gap-2">
              {(["possédé", "wishlist"] as const).map((s) => (
                <button key={s} type="button" onClick={() => set("statut", s)}
                  className={`px-4 py-1.5 text-xs rounded-full border capitalize transition-colors ${
                    form.statut === s
                      ? s === "wishlist" ? "bg-terracotta text-white border-terracotta" : "bg-navy text-cream border-navy"
                      : "border-sand/40 text-ink/60 hover:border-navy"
                  }`}>
                  {s === "wishlist" ? "★ Wishlist" : "✓ Possédé"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 border border-sand/40 text-sm text-ink/60 rounded-sm hover:bg-sand/10 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2 bg-navy text-cream text-sm rounded-sm hover:bg-ink transition-colors disabled:opacity-50">
              {loading ? "Ajout…" : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
