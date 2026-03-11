import fs from "fs";
import path from "path";
import os from "os";

const CONFIG_DIR = path.join(os.homedir(), ".plan-push");
const CREDENTIALS_FILE = path.join(CONFIG_DIR, "credentials.json");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function getStoredToken(): string | null {
  try {
    const data = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, "utf-8"));
    return data.token ?? null;
  } catch {
    return null;
  }
}

export function storeToken(token: string) {
  ensureConfigDir();
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify({ token }, null, 2));
}

export function getConvexUrl(): string {
  if (process.env.PLANSHARE_URL) return process.env.PLANSHARE_URL;

  try {
    const envLocal = fs.readFileSync(
      path.join(process.cwd(), ".env.local"),
      "utf-8"
    );
    const match = envLocal.match(/VITE_CONVEX_URL=(.+)/);
    if (match) return match[1].trim();
  } catch {}

  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    if (config.convexUrl) return config.convexUrl;
  } catch {}

  throw new Error(
    "Could not find Convex URL. Set PLANSHARE_URL env var, or run from a directory with .env.local"
  );
}

export function storeConfig(config: Record<string, string>) {
  ensureConfigDir();
  let existing: Record<string, string> = {};
  try {
    existing = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
  } catch {}
  fs.writeFileSync(
    CONFIG_FILE,
    JSON.stringify({ ...existing, ...config }, null, 2)
  );
}
