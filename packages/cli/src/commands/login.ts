import { storeConfig, storeToken, getConvexUrl } from "../lib/auth.js";
import open from "open";

const DEFAULT_PROD_URL = "https://steady-warbler-171.convex.site";

function generateSessionSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

async function resolveApiUrl(inputUrl: string): Promise<string> {
  // If it's already a .convex.site URL, use it directly
  if (inputUrl.includes(".convex.site")) {
    return inputUrl;
  }

  // Otherwise, try to discover the API URL from the frontend
  process.stdout.write("Discovering API endpoint... ");
  try {
    const discoveryUrl = new URL("/planshare.json", inputUrl).toString();
    const resp = await fetch(discoveryUrl);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const config = await resp.json();
    if (config.apiUrl) {
      console.log("OK");
      return config.apiUrl;
    }
  } catch {
    // Discovery failed
  }

  console.log("FAILED");
  console.error(
    `\nCould not discover API URL from ${inputUrl}/planshare.json`
  );
  console.error(
    "Please provide the Convex .site URL directly, or ensure the frontend is deployed with VITE_CONVEX_URL set.\n"
  );
  process.exit(1);
}

export async function loginCommand(url?: string) {
  // Resolve server URL
  if (!url) {
    let currentUrl: string | null = null;
    try {
      currentUrl = getConvexUrl();
    } catch {}

    const inquirer = await import("inquirer");
    const answer = await inquirer.default.prompt([
      {
        type: "input",
        name: "url",
        message: "PlanShare URL (frontend or .convex.site):",
        default: currentUrl ?? DEFAULT_PROD_URL,
      },
    ]);
    url = answer.url;
  }

  // Resolve to API URL if a frontend URL was given
  const apiUrl = await resolveApiUrl(url!);

  // Verify connectivity
  process.stdout.write("Verifying connection... ");
  try {
    const response = await fetch(new URL("/api/folders", apiUrl).toString());
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    await response.json();
    console.log("OK");
  } catch (e: any) {
    console.log("FAILED");
    console.error(`\nCould not reach ${apiUrl}/api/folders`);
    console.error(`Error: ${e.message}\n`);
    process.exit(1);
  }

  // Fetch web app URL for browser auth
  let webAppUrl: string;
  try {
    const configResp = await fetch(new URL("/api/config", apiUrl).toString());
    const config = await configResp.json();
    webAppUrl = config.webAppUrl;
    if (!webAppUrl) {
      console.error(
        "\nServer does not have WEB_APP_URL configured. Ask your admin to set it."
      );
      process.exit(1);
    }
  } catch (e: any) {
    console.error(`\nCould not fetch server config: ${e.message}`);
    process.exit(1);
  }

  // Generate device code and session secret
  const code = generateCode();
  const sessionSecret = generateSessionSecret();

  // Start auth session on server
  try {
    const startResp = await fetch(
      new URL("/api/cli-auth/start", apiUrl).toString(),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, sessionSecret }),
      }
    );
    if (!startResp.ok) {
      const err = await startResp.text();
      throw new Error(err);
    }
  } catch (e: any) {
    console.error(`\nFailed to start auth session: ${e.message}`);
    process.exit(1);
  }

  // Open browser
  const authUrl = `${webAppUrl}/cli-auth?session=${code}`;
  console.log(`\nOpening browser for authentication...`);
  console.log(`If the browser doesn't open, visit: ${authUrl}\n`);
  console.log(`Verify this code in your browser: ${code}\n`);
  console.log(`Waiting for authorization...`);

  try {
    await open(authUrl);
  } catch {
    // Browser failed to open — user can copy URL manually
  }

  // Poll for completion
  const pollUrl = new URL("/api/cli-auth/poll", apiUrl);
  pollUrl.searchParams.set("sessionSecret", sessionSecret);
  const pollInterval = 2000;
  const maxWait = 5 * 60 * 1000; // 5 minutes
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    await new Promise((resolve) => setTimeout(resolve, pollInterval));

    try {
      const resp = await fetch(pollUrl.toString());
      const result = await resp.json();

      if (result.status === "completed") {
        storeToken(result.token);
        storeConfig({ convexUrl: apiUrl, email: result.userEmail });
        console.log(`\n✓ Authenticated as ${result.userEmail}`);
        console.log(`  Config saved to ~/.plan-push/\n`);
        return;
      }

      if (result.status === "expired") {
        console.error("\nSession expired. Please run `plan-push login` again.");
        process.exit(1);
      }
    } catch {
      // Network error — keep polling
    }
  }

  console.error(
    "\nTimed out waiting for authorization. Please run `plan-push login` again."
  );
  process.exit(1);
}
