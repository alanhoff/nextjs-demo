import type { NextConfig } from "next";

const config: NextConfig = {
  cacheComponents: true,
  typedRoutes: true,
  partialPrefetching: true,
  output: process.env.NEXT_STANDALONE === "1" ? "standalone" : undefined,
};

export default config;
