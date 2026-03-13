import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";

function planshareDiscovery(): Plugin {
  return {
    name: "planshare-discovery",
    writeBundle(options) {
      const convexUrl = process.env.VITE_CONVEX_URL;
      if (!convexUrl) return;

      // Derive .convex.site URL from .convex.cloud URL
      const apiUrl = convexUrl.replace(".convex.cloud", ".convex.site");

      const outDir = options.dir || resolve(__dirname, "dist");
      writeFileSync(
        resolve(outDir, "planshare.json"),
        JSON.stringify({ apiUrl }) + "\n"
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), planshareDiscovery()],
});
