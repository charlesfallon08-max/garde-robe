"use client";

import { useEffect, useState } from "react";

type Stats = {
  mois: string;
  input_tokens: number;
  output_tokens: number;
  cached_tokens: number;
  outfits_generes: number;
  outfits_sauves: number;
  cout_estime_usd: number;
};

export default function StatsWidget() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats);
  }, []);

  if (!stats) return null;

  const cacheRatio = stats.input_tokens > 0
    ? Math.round((stats.cached_tokens / (stats.input_tokens + stats.cached_tokens)) * 100)
    : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-ink/95 backdrop-blur-sm text-cream px-6 py-2 z-40">
      <div className="flex items-center justify-between gap-4 text-xs flex-wrap">
        <div className="flex items-center gap-5">
          <span className="text-sand/60 uppercase tracking-widest">{stats.mois}</span>
          <span>
            <span className="text-sand/60">Outfits générés </span>
            <span className="font-medium">{stats.outfits_generes}</span>
          </span>
          <span>
            <span className="text-sand/60">Sauvegardés </span>
            <span className="font-medium">{stats.outfits_sauves}</span>
          </span>
          <span>
            <span className="text-sand/60">Cache </span>
            <span className="font-medium text-green-400">{cacheRatio}%</span>
          </span>
          <span>
            <span className="text-sand/60">Coût estimé </span>
            <span className="font-medium">${stats.cout_estime_usd.toFixed(4)}</span>
          </span>
        </div>
        <a
          href="https://console.anthropic.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sand/60 hover:text-sand underline"
        >
          Voir le vrai crédit →
        </a>
      </div>
    </div>
  );
}
