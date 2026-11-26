import path from "node:path";
import type { NextConfig } from "next";

// The repo root also has a package-lock.json (for Playwright), so tell Next
// that this folder is the app root instead of letting it guess.
const appRoot = path.join(__dirname);

const nextConfig: NextConfig = {
  // E2E tests build into their own folder so they never clash with `npm run dev`.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  outputFileTracingRoot: appRoot,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    root: appRoot,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
