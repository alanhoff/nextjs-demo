import type { NextConfig } from "next";

const config: NextConfig = {
  async redirects() {
    return [
      {
        source: "/catalog-summary.md",
        destination: "/guides/catalog-summary.md",
        permanent: true,
      },
    ];
  },
  cacheComponents: true,
  typedRoutes: true,
  partialPrefetching: true,
  output: process.env.NEXT_STANDALONE === "1" ? "standalone" : undefined,
};

export default config;
