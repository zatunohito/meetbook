import type { NextConfig } from "next";

// 全画面が読者ごとにパーソナライズされるため、Cache Components は使わず通常の動的レンダリングにする
const nextConfig: NextConfig = {
  // 写真はブラウザ側で縮小してから1枚ずつ送るが、余裕をもたせる
  experimental: {
    serverActions: { bodySizeLimit: "9mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cover.openbd.jp" },
      { protocol: "https", hostname: "ndlsearch.ndl.go.jp" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
