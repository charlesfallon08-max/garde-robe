/**
 * Post-traitement du canal alpha après détourage IA.
 * Élimine les artefacts blancs résiduels sur les bords.
 *
 * tolerance 0  → aucune modification
 * tolerance 5  → débruitage + érosion modérée + lissage
 * tolerance 10 → débruitage + érosion agressive
 */
export async function postProcessAlpha(blob: Blob, tolerance: number): Promise<Blob> {
  if (tolerance === 0) return blob;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(blob);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas non disponible")); return; }

      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(objectUrl);

      const w = canvas.width;
      const h = canvas.height;
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data; // RGBA linéaire

      // ── Étape 0 : Débruitage médian du canal alpha ──
      // Élimine le bruit "sel et poivre" (pixels isolés en damier) que peut produire
      // le modèle IA sur les zones ambiguës (ex: motif à carreaux qui se fond dans le fond).
      // Fait AVANT l'érosion, car un filtre d'érosion (minimum) amplifie ce bruit au lieu
      // de le corriger : un seul pixel bruité suffit à faire chuter tout son voisinage.
      {
        const despeckleRadius = tolerance > 6 ? 2 : 1;
        const kernelSize = despeckleRadius * 2 + 1;
        const samples = new Uint8Array(kernelSize * kernelSize);
        const alphaSrc = new Uint8Array(w * h);
        for (let i = 0; i < w * h; i++) alphaSrc[i] = data[i * 4 + 3];

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            let n = 0;
            for (let dy = -despeckleRadius; dy <= despeckleRadius; dy++) {
              const ny = y + dy;
              if (ny < 0 || ny >= h) continue;
              for (let dx = -despeckleRadius; dx <= despeckleRadius; dx++) {
                const nx = x + dx;
                if (nx < 0 || nx >= w) continue;
                samples[n++] = alphaSrc[ny * w + nx];
              }
            }
            const used = samples.subarray(0, n);
            used.sort();
            data[(y * w + x) * 4 + 3] = used[n >> 1];
          }
        }
      }

      // ── Étape 1 : Érosion du canal alpha ──
      // Réduit le masque de (radius) pixels vers l'intérieur.
      // Élimine les franges blanches/grises sur les bords du vêtement.
      const erosionRadius = Math.round(tolerance * 0.6); // 0–6 px selon tolérance
      if (erosionRadius > 0) {
        const alphaCopy = new Uint8Array(w * h);
        for (let i = 0; i < w * h; i++) alphaCopy[i] = data[i * 4 + 3];

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            if (alphaCopy[y * w + x] === 0) continue; // déjà transparent

            // Cherche le minimum d'alpha dans le voisinage (filtre d'érosion)
            let minAlpha = alphaCopy[y * w + x];
            for (let dy = -erosionRadius; dy <= erosionRadius; dy++) {
              for (let dx = -erosionRadius; dx <= erosionRadius; dx++) {
                // Masque circulaire
                if (dx * dx + dy * dy > erosionRadius * erosionRadius) continue;
                const ny = y + dy;
                const nx = x + dx;
                if (ny < 0 || ny >= h || nx < 0 || nx >= w) continue;
                minAlpha = Math.min(minAlpha, alphaCopy[ny * w + nx]);
              }
            }
            data[idx + 3] = minAlpha;
          }
        }
      }

      // ── Étape 2 : Lissage gaussien du canal alpha ──
      // Adoucit les bords coupants en appliquant une convolution 3×3.
      // Donne un effet d'anti-aliasing naturel sur les contours.
      const blurRadius = Math.max(1, Math.round(tolerance * 0.3)); // 0–3 px
      if (blurRadius > 0) {
        const alphaBlur = new Uint8Array(w * h);
        for (let i = 0; i < w * h; i++) alphaBlur[i] = data[i * 4 + 3];

        // Kernel gaussien 3×3 normalisé
        const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
        const kSum = 16;

        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            // N'applique le blur QUE sur les pixels de bord (alpha entre 1 et 254)
            const a = alphaBlur[y * w + x];
            if (a === 0 || a === 255) continue;

            let sum = 0;
            let ki = 0;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                sum += alphaBlur[(y + dy) * w + (x + dx)] * kernel[ki++];
              }
            }
            data[(y * w + x) * 4 + 3] = Math.round(sum / kSum);
          }
        }
      }

      // ── Étape 3 : Seuillage des pixels semi-transparents résiduels ──
      // Supprime les pixels dont l'alpha est très faible (artefacts poussiéreux).
      const threshold = Math.round(tolerance * 12); // 0–120
      if (threshold > 0) {
        for (let i = 0; i < w * h; i++) {
          if (data[i * 4 + 3] < threshold) data[i * 4 + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      canvas.toBlob(
        (result) => { if (result) resolve(result); else reject(new Error("Conversion blob échouée")); },
        "image/png"
      );
    };

    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Chargement image échoué")); };
    img.src = objectUrl;
  });
}
