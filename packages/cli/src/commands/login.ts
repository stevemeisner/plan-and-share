import { storeConfig, getConvexUrl } from "../lib/auth.js";

const DEFAULT_PROD_URL = "https://steady-warbler-171.convex.site";

export async function loginCommand() {
  const inquirer = await import("inquirer");

  let currentUrl: string | null = null;
  try {
    currentUrl = getConvexUrl();
  } catch {}

  const { url } = await inquirer.default.prompt([
    {
      type: "input",
      name: "url",
      message: "PlanShare server URL:",
      default: currentUrl ?? DEFAULT_PROD_URL,
    },
  ]);

  // Verify connectivity
  process.stdout.write("Verifying connection... ");
  try {
    const response = await fetch(new URL("/api/folders", url).toString());
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    await response.json();
  } catch (e: any) {
    console.log("FAILED");
    console.error(`\nCould not reach ${url}/api/folders`);
    console.error(`Error: ${e.message}\n`);
    process.exit(1);
  }

  storeConfig({ convexUrl: url });
  console.log("OK");
  console.log(`\n✓ Connected to ${url}`);
  console.log(`  Config saved to ~/.plan-push/config.json\n`);
}
