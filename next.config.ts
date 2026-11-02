import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Pages serves static files only.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
