import type { NextConfig } from "next";

// Cabeçalhos HTTP ficam no vercel.json: o modo export não tem servidor.
const config: NextConfig = {
  output: "export",
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  images: { unoptimized: true },
};

export default config;
