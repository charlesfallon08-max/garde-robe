"use client";

import { useState } from "react";

type Props = {
  onAdd: () => void;
  onClose: () => void;
};

const CATEGORIES = ["hauts", "bas", "chaussures", "accessoires"];
const SOUS_TYPES: Record<string, string[]> = {
  hauts:       ["tee", "graphic", "shirt", "hoodie", "sweat", "veste", "autre"],
  bas:         ["short", "jeans", "pantalon", "autre"],
  chaussures:  ["sneaker", "sandal", "boot", "autre"],
  accessoires: ["cap", "sunglasses", "bag", "belt", "autre"],
};

export default function AddPieceModal({ onAdd, onClose }: Props) {
  const [form, setForm] = useState({
    marque:      "",
    nom:         "",
    categorie:   "hauts",
    sous_type:   "tee",
    couleur_hex: "#FFFFFF",
    couleur_nom: "",
    prix_cad:    "",
    url_achat:   "",
    notes:       "",
  });
  const [loading, setLoading] = useState(false);

  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

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

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-cream rounded-sm shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-sand/30">
          <h2 className="font-display text-2xl text-navy" style={{ fontFamily: "var(--font-cormorant)" }}>
            Nouvelle pièce
          </h2>
          <button onClick={onClose} className="text-ink/40 hover:text-ink text-xl">✕</button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Marque */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-sand mb-1">Marque</label>
            <input
              required
              value={form.marque}
              onChange={(e) => set("marque", e.target.value)}
              placeholder="Zara, Uniqlo, Adidas…"
              className="w-full border border-sand/40 rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy"
            />
          </div>

          {/* Nom */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-sand mb-1">Nom du produit</label>
            <input
              required
              value={form.nom}
              onChange={(e) => set("nom", e.target.value)}
              placeholder="T-shirt basique coton"
              className="w-full border border-sand/40 rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy"
            />
          </div>

          {/* Catégorie + Sous-type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-widest text-sand mb-1">Catégorie</label>
              <select
                value={form.categorie}
                onChange={(e) => { set("categorie", e.target.value); set("sous_type", SOUS_TYPES[e.target.value][0]); }}
                className="w-full border border-sand/40 rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-sand mb-1">Sous-type</label>
              <select
                value={form.sous_type}
                onChange={(e) => set("sous_type", e.target.value)}
                className="w-full border border-sand/40 rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy"
              >
                {(SOUS_TYPES[form.categorie] || []).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Couleur */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-widest text-sand mb-1">Couleur (hex)</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.couleur_hex}
                  onChange={(e) => set("couleur_hex", e.target.value)}
                  className="w-10 h-9 border border-sand/40 rounded-sm cursor-pointer"
                />
                <input
                  value={form.couleur_hex}
                  onChange={(e) => set("couleur_hex", e.target.value)}
                  className="flex-1 border border-sand/40 rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-sand mb-1">Nom couleur</label>
              <input
                value={form.couleur_nom}
                onChange={(e) => set("couleur_nom", e.target.value)}
                placeholder="Blanc, Navy…"
                className="w-full border border-sand/40 rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy"
              />
            </div>
          </div>

          {/* Prix */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-sand mb-1">Prix (CAD)</label>
            <input
              type="number"
              step="0.01"
              value={form.prix_cad}
              onChange={(e) => set("prix_cad", e.target.value)}
              placeholder="29.99"
              className="w-full border border-sand/40 rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy"
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-sand mb-1">Lien d'achat</label>
            <input
              type="url"
              value={form.url_achat}
              onChange={(e) => set("url_achat", e.target.value)}
              placeholder="https://..."
              className="w-full border border-sand/40 rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-sand mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              placeholder="Fit oversized, disponible en plusieurs couleurs…"
              className="w-full border border-sand/40 rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy resize-none"
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-sand/40 text-sm text-ink/60 rounded-sm hover:bg-sand/10 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-navy text-cream text-sm rounded-sm hover:bg-ink transition-colors disabled:opacity-50"
            >
              {loading ? "Ajout…" : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
