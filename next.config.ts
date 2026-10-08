import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: process.env.GITHUB_ACTIONS ? "/VOLIO-Opeations" : "",
  assetPrefix: process.env.GITHUB_ACTIONS ? "/VOLIO-Opeations/" : "",
};

export default nextConfig;
