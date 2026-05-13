"use client";

import { useState, useRef } from "react";
import { removeBackground } from "@imgly/background-removal";
import { postProcessAlpha } from "@/lib/imageProcessing";

type Props = {
  pieceId: string;
  currentImageUrl: string | null;
  onUploaded: (url: string) => void;
};

type Model = "isnet" | "isnet_fp16" | "isnet_quint8";

const MODEL_LABELS: Record<Model, string> = {
  isnet:        "Haute qualité",
  isnet_fp16:   "Équilibré",
  isnet_quint8: "Rapide",
};

export default function ImageUploader({ pieceId, currentImageUrl, onUploaded }: Props) {
  const [status, setStatus]   = useState<"idle" | "removing" | "uploading" | "done" | "error">("idle");
  const [preview, setPreview] = useState<string | null>(currentImageUrl);
  const [model, setModel]     = useState<Model>("isnet");
  const [tolerance, setTolerance] = useState(3);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setStatus("removing");
    try {
      // Détourage IA avec le modèle sélectionné
      let blob = await removeBackground(file, {
        model,
        output: { format: "image/png", quality: 1 },
      });

      // Post-traitement canvas : érosion + lissage + seuillage
      blob = await postProcessAlpha(blob, tolerance);

      setStatus("uploading");
      const formData = new FormData();
      formData.append("file", blob, `${pieceId}.png`);
      formData.append("pieceId", pieceId);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const { url } = await res.json();

      setPreview(url);
      setStatus("done");
      onUploaded(url);
    } catch {
      setStatus("error");
    }
  };

  const statusLabels: Record<string, string> = {
    idle:      "Choisir une photo",
    removing:  "Détourage en cours…",
    uploading: "Envoi…",
    done:      "Photo mise à jour ✓",
    error:     "Erreur — réessayer",
  };

  return (
    <div className="space-y-3">
      {/* Aperçu */}
      {preview && (
        <div className="w-full aspect-square rounded-sm overflow-hidden bg-cream border border-sand/20 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Aperçu" className="w-full h-full object-contain" />
        </div>
      )}

      {/* Qualité du modèle */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-sand mb-1.5">Qualité du modèle</p>
        <div className="flex gap-1.5">
          {(Object.keys(MODEL_LABELS) as Model[]).map((m) => (
            <button key={m} type="button" onClick={() => setModel(m)}
              className={`flex-1 py-1 text-[10px] rounded-sm border transition-colors ${
                model === m ? "bg-navy text-cream border-navy" : "border-sand/30 text-ink/50 hover:border-navy"
              }`}>
              {MODEL_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

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
          <span>Doux</span>
          <span>Agressif</span>
        </div>
      </div>

      {/* Bouton upload */}
      <button type="button" onClick={() => inputRef.current?.click()}
        disabled={status === "removing" || status === "uploading"}
        className={`w-full py-2 text-xs uppercase tracking-widest border rounded-sm transition-colors ${
          status === "done"    ? "border-navy text-navy" :
          status === "error"   ? "border-terracotta text-terracotta" :
          "border-sand/40 text-ink/60 hover:border-navy hover:text-navy"
        } disabled:opacity-50`}>
        {status === "removing" || status === "uploading"
          ? <span className="animate-pulse">{statusLabels[status]}</span>
          : statusLabels[status]}
      </button>

      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}
