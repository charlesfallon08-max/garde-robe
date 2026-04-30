"use client";

import { useState, useRef } from "react";
import { removeBackground } from "@imgly/background-removal";

type Props = {
  pieceId: string;
  currentImageUrl: string | null;
  onUploaded: (url: string) => void;
};

export default function ImageUploader({ pieceId, currentImageUrl, onUploaded }: Props) {
  const [status, setStatus] = useState<"idle" | "removing" | "uploading" | "done" | "error">("idle");
  const [preview, setPreview] = useState<string | null>(currentImageUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setStatus("removing");

    try {
      // 1. Détourage côté navigateur (aucune API externe nécessaire)
      const blob = await removeBackground(file);

      setStatus("uploading");

      // 2. Upload du PNG détouré vers le serveur
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

  const labels: Record<string, string> = {
    idle:      "Ajouter photo",
    removing:  "Détourage…",
    uploading: "Upload…",
    done:      "Photo mise à jour ✓",
    error:     "Erreur — réessayer",
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Prévisualisation */}
      {preview && (
        <div className="w-full aspect-square rounded-sm overflow-hidden bg-cream border border-sand/20 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Aperçu" className="w-full h-full object-contain" />
        </div>
      )}

      {/* Bouton upload */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={status === "removing" || status === "uploading"}
        className={`w-full py-2 text-xs uppercase tracking-widest border rounded-sm transition-colors ${
          status === "done"
            ? "border-navy text-navy"
            : status === "error"
            ? "border-terracotta text-terracotta"
            : "border-sand/40 text-ink/60 hover:border-navy hover:text-navy"
        } disabled:opacity-50`}
      >
        {status === "removing" || status === "uploading" ? (
          <span className="animate-pulse">{labels[status]}</span>
        ) : (
          labels[status]
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
