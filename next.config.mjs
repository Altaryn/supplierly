import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root to this project (a stray lockfile in the home dir
  // would otherwise be inferred as the root and break file tracing on Vercel).
  outputFileTracingRoot: __dirname,
  // Type errors fail the build; lint runs separately so a style nit never
  // blocks a production build.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
