import { storeToken } from "../lib/auth.js";

export async function loginCommand() {
  console.log("Opening browser for Google sign-in...\n");

  // Phase 1: manual token paste. Full OAuth flow in a follow-up.
  const inquirer = await import("inquirer");
  const { token } = await inquirer.default.prompt([
    {
      type: "input",
      name: "token",
      message: "Paste your auth token (from PlanShare settings):",
    },
  ]);

  storeToken(token);
  console.log("\n✓ Logged in successfully. Token stored at ~/.plan-push/credentials.json");
}
