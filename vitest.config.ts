import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "convex",
          environment: "edge-runtime",
          include: ["convex/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "renderer",
          environment: "node",
          include: ["packages/renderer/src/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "app",
          environment: "jsdom",
          include: ["packages/app/src/**/*.test.{ts,tsx}"],
          setupFiles: ["packages/app/src/__tests__/setup.ts"],
        },
      },
      {
        test: {
          name: "cli",
          environment: "node",
          include: ["packages/cli/src/**/*.test.ts"],
        },
      },
    ],
  },
});
