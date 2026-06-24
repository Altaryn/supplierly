import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root to this project (a stray lockfile in the home dir
  // would otherwise be inferred as the root and break file tracing on Vercel).
  outputFileTracingRoot: __dirname,
  // ExcelJS es una librería de servidor (genera la ficha .xlsx con logo, colores
  // y bordes). Se mantiene externa para que Next no la empaquete y se resuelva
  // como require de node_modules en runtime (incluida en el trace de Vercel).
  serverExternalPackages: ["exceljs"],
  // Type errors fail the build; lint runs separately so a style nit never
  // blocks a production build.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
