"use client";

import { useState } from "react";
import type { Piece } from "@/db/schema";
import ImageUploader from "./ImageUploader";
import { removeBackground } from "@imgly/background-removal";
import { postProcessAlpha } from "@/lib/imageProcessing";
import { STYLE_TYPES, getStyles } from "@/lib/styleTypes";

type Props = {
  piece: Piece;
  onSave: () => void;
  onClose: () => void;
};

const CATEGORIES = ["hauts", "bas", "chaussures", "accessoires"];
const SOUS_TYPES: Record<string, string[]> = Object.fromEntries(
  Object.entries(STYLE_TYPES).map(([cat, sousTypes]) => [cat, Object.keys(sousTypes)])
);
const SAISONS = ["toutes", "ete", "hiver"] as const;
const SAISON_LABELS: Record<string, string> = { toutes: "Toutes", ete: "☀️ Été", hiver: "❄️ Hiver" };

export default function EditPieceModal({ piece, onSave, onClose }: Props) {
  const [form, setForm] = useState({
    marque:      piece.marque,
    nom:         piece.nom,
    categorie:   piece.categorie,
    sous_type:   piece.sous_type,
    style_type:  (piece as Piece & { style_type?: string }).style_type ?? "",
    saison:      (piece as Piece & { saison?: string }).saison ?? "toutes",
    statut:      piece.statut ?? "possédé",
    couleur_hex: piece.couleur_hex,
    couleur_nom: piece.couleur_nom,
    prix_cad:    piece.prix_cad?.toString() ?? "",
    url_achat:   piece.url_achat ?? "",
    notes:       piece.notes ?? "",
    image_url:   piece.image_url ?? "",
  });
  const [loading, setLoading]         = useState(false);
  const [photoTab, setPhotoTab]       = useState<"url" | "upload">("url");
  const [urlInput, setUrlInput]       = useState(piece.image_url ?? "");
  const [urlPreview, setUrlPreview]   = useState(piece.image_url ?? "");
  const [detouring, setDetouring]     = useState(false);
  const [detourError, setDetourError] = useState<string | null>(null);
  const [tolerance, setTolerance]     = useState(3);

  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSousTypeChange = (st: string) => {
    const styles = getStyles(form.categorie, st);
    setForm((f) => ({ ...f, sous_type: st, style_type: styles[0] ?? "" }));
  };

  const handleCategorieChange = (cat: string) => {
    const premierSousType = SOUS_TYPES[cat][0];
    const styles = getStyles(cat, premierSousType);
    setForm((f) => ({ ...f, categorie: cat, sous_type: premierSousType, style_type: styles[0] ?? "" }));
  };

  const handleDetourer = async () => {
    if (!urlInput) return;
    setDetouring(true);
    setDetourError(null);
    try {
      // Détourage IA avec le meilleur modèle disponible (isnet = pleine qualité)
      let blob = await removeBackground(urlInput, {
        model: "isnet",
        output: { format: "image/png", quality: 1 },
      });
      // Post-traitement : érosion + lissage + seuillage selon tolérance
      blob = await postProcessAlpha(blob, tolerance);
      // Upload du résultat
      const formData = new FormData();
      formData.append("file", blob, `${piece.id}.png`);
      formData.append("pieceId", piece.id);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const { url } = await res.json();
      setUrlInput(url);
      setUrlPreview(url);
    } catch {
      setDetourError("Impossible de détourer (restrictions du site). Enregistre l'image sur ton ordi et utilise « Uploader un fichier ».");
    } finally {
      setDetouring(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // urlInput est la source de vérité pour l'URL photo (évite le bug de timing onBlur)
    const finalImageUrl = photoTab === "url" ? urlInput : form.image_url;
    await fetch(`/api/pieces/${piece.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        prix_cad:  form.prix_cad ? parseFloat(form.prix_cad) : null,
        image_url: finalImageUrl || null,
      }),
    });
    setLoading(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-cream rounded-sm shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-sand/30">
          <div>
            <p className="text-xs uppercase tracking-widest text-sand mb-0.5">{piece.marque}</p>
            <h2 className="font-display text-2xl text-navy" style={{ fontFamily: "var(--font-cormorant)" }}>
              Modifier la pièce
            </h2>
          </div>
          <button onClick={onClose} className="text-ink/40 hover:text-ink text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Photo — deux onglets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-widest text-sand">Photo</label>
              {/* Bouton supprimer la photo — visible seulement si une photo existe */}
              {(urlInput || form.image_url) && (
                <button
                  type="button"
                  onClick={() => { setUrlInput(""); setUrlPreview(""); set("image_url", ""); setDetourError(null); }}
                  className="text-xs text-terracotta hover:underline"
                >
                  Supprimer la photo
                </button>
              )}
            </div>

            {/* Sélecteur d'onglet */}
            <div className="flex rounded-sm border border-sand/40 overflow-hidden mb-3 text-xs">
              <button type="button" onClick={() => setPhotoTab("url")}
                className={`flex-1 py-1.5 transition-colors ${photoTab === "url" ? "bg-navy text-cream" : "text-ink/50 hover:bg-sand/10"}`}>
                Coller une URL
              </button>
              <button type="button" onClick={() => setPhotoTab("upload")}
                className={`flex-1 py-1.5 transition-colors ${photoTab === "upload" ? "bg-navy text-cream" : "text-ink/50 hover:bg-sand/10"}`}>
                Uploader un fichier
              </button>
            </div>

            {/* Onglet URL */}
            {photoTab === "url" && (
              <div className="space-y-2">
                {/* Champ URL + bouton Détourer */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => { setUrlInput(e.target.value); setUrlPreview(e.target.value); setDetourError(null); }}
                    placeholder="https://... (clic droit → Copier l'adresse de l'image)"
                    className="flex-1 border border-sand/40 rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy"
                  />
                  <button
                    type="button"
                    onClick={handleDetourer}
                    disabled={!urlInput || detouring}
                    className="px-3 py-2 text-xs uppercase tracking-widest border border-sand/40 rounded-sm text-ink/60 hover:border-navy hover:text-navy transition-colors disabled:opacity-30 whitespace-nowrap"
                  >
                    {detouring ? <span className="animate-pulse">…</span> : "Détourer"}
                  </button>
                </div>

                {/* Aperçu */}
                {urlPreview && (
                  <div className="w-full h-44 rounded-sm border border-sand/20 overflow-hidden bg-cream flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={urlPreview}
                      alt="Aperçu"
                      className="w-full h-full object-contain"
                      onError={() => setUrlPreview("")}
                    />
                  </div>
                )}

                {/* Slider tolérance bords */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px] uppercase tracking-widest text-sand">Tolérance bords</p>
                    <span className="text-[10px] text-ink/40">{tolerance}/10</span>
                  </div>
                  <input type="range" min={0} max={10} value={tolerance}
                    onChange={(e) => setTolerance(Number(e.target.value))}
                    className="w-full h-1 accent-navy cursor-pointer" />
                  <div className="flex justify-between text-[9px] text-ink/30 mt-0.5">
                    <span>Doux</span><span>Agressif</span>
                  </div>
                </div>

                {/* Message d'erreur détourage */}
                {detourError && (
                  <p className="text-xs text-terracotta leading-relaxed">{detourError}</p>
                )}

                <p className="text-xs text-ink/40">
                  Colle l&apos;URL → ajuste la tolérance → clique <strong>Détourer</strong>
                </p>
              </div>
            )}

            {/* Onglet Upload */}
            {photoTab === "upload" && (
              <ImageUploader
                pieceId={piece.id}
                currentImageUrl={form.image_url || null}
                onUploaded={(url) => { set("image_url", url); setUrlPreview(url); }}
              />
            )}
          </div>

          <div className="border-t border-sand/20 pt-4 space-y-4">
            {/* Marque */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-sand mb-1">Marque</label>
              <input
                required
                value={form.marque}
                onChange={(e) => set("marque", e.target.value)}
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
                className="w-full border border-sand/40 rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy"
              />
            </div>

            {/* Catégorie */}
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

            {/* Sous-type */}
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

            {/* Style (niveau 3) */}
            {getStyles(form.categorie, form.sous_type).length > 0 && (
              <div>
                <label className="block text-xs uppercase tracking-widest text-sand mb-1">Style</label>
                <div className="flex gap-1.5 flex-wrap">
                  {getStyles(form.categorie, form.sous_type).map((s) => (
                    <button key={s} type="button" onClick={() => set("style_type", s)}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                        form.style_type === s ? "bg-terracotta text-white border-terracotta" : "border-sand/40 text-ink/60 hover:border-terracotta"
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

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

            {/* Couleur */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-widest text-sand mb-1">Couleur</label>
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
                className="w-full border border-sand/40 rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy resize-none"
              />
            </div>
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
              {loading ? "Sauvegarde…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
