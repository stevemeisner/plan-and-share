import { getStoredToken, getConvexUrl, getStoredEmail } from "./auth.js";

export async function apiRequest(
  path: string,
  options: {
    method?: string;
    body?: Record<string, unknown>;
    params?: Record<string, string>;
  } = {}
) {
  const baseUrl = getConvexUrl();
  const url = new URL(path, baseUrl);
  const token = getStoredToken();

  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      url.searchParams.set(key, value);
    }
  }

  const email = getStoredEmail();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    // Token auth is authoritative — don't also send email header
    headers["Authorization"] = `Bearer ${token}`;
  } else if (email) {
    // Fallback for old configs without a token
    headers["X-User-Email"] = email;
  }

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url.toString(), {
        method: options.method ?? "GET",
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API error (${response.status}): ${errorBody}`);
      }

      return response.json();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Failed after ${maxRetries} attempts: ${lastError?.message}\nEndpoint: ${url}`
  );
}
