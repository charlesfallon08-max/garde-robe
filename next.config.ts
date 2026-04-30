import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Autorise les WASM nécessaires pour le détourage d'images
  experimental: {
    serverComponentsHmrCache: false,
  },
};

export default nextConfig;
