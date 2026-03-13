import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  outDir: "dist",
  platform: "node",
  target: "node18",
  banner: { js: "#!/usr/bin/env node" },
  noExternal: [
    "@planshare/renderer",
    "unified",
    "remark-parse",
    "remark-gfm",
    "remark-rehype",
    "rehype-stringify",
    "github-slugger",
  ],
  external: ["inquirer", "commander", "open"],
  splitting: false,
  clean: true,
});
