import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsHmrCache: false,
  },
  webpack: (config) => {
    // Nécessaire pour @imgly/background-removal (WASM + Web Workers)
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };
    return config;
  },
};

export default nextConfig;
