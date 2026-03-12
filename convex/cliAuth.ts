import { internalMutation, internalQuery, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// --- Crypto helpers (use Web Crypto API available in Convex runtime) ---

export function hashToken(token: string): string {
  // Synchronous hash using a simple approach — we compute SHA-256
  // using the same algorithm as @oslojs/crypto but inline
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  // We need a sync hash for use in queries. Use a simple hash.
  // Since Convex doesn't support async in queries for crypto.subtle,
  // we'll use a manual implementation.
  return sha256Hex(data);
}

// Minimal SHA-256 implementation for synchronous use in Convex queries
function sha256Hex(data: Uint8Array): string {
  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);

  let h0 = 0x6a09e667 | 0;
  let h1 = 0xbb67ae85 | 0;
  let h2 = 0x3c6ef372 | 0;
  let h3 = 0xa54ff53a | 0;
  let h4 = 0x510e527f | 0;
  let h5 = 0x9b05688c | 0;
  let h6 = 0x1f83d9ab | 0;
  let h7 = 0x5be0cd19 | 0;

  const bitLen = data.length * 8;
  // Padding
  const padLen = (data.length % 64 < 56 ? 56 : 120) - (data.length % 64);
  const padded = new Uint8Array(data.length + padLen + 8);
  padded.set(data);
  padded[data.length] = 0x80;
  // Length in bits as big-endian 64-bit
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 4, bitLen, false);

  const w = new Uint32Array(64);

  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 =
        (ror(w[i - 15], 7) ^ ror(w[i - 15], 18) ^ (w[i - 15] >>> 3)) | 0;
      const s1 =
        (ror(w[i - 2], 17) ^ ror(w[i - 2], 19) ^ (w[i - 2] >>> 10)) | 0;
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }

    let a = h0,
      b = h1,
      c = h2,
      d = h3,
      e = h4,
      f = h5,
      g = h6,
      h = h7;

    for (let i = 0; i < 64; i++) {
      const S1 = (ror(e, 6) ^ ror(e, 11) ^ ror(e, 25)) | 0;
      const ch = ((e & f) ^ (~e & g)) | 0;
      const temp1 = (h + S1 + ch + K[i] + w[i]) | 0;
      const S0 = (ror(a, 2) ^ ror(a, 13) ^ ror(a, 22)) | 0;
      const maj = ((a & b) ^ (a & c) ^ (b & c)) | 0;
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
    h5 = (h5 + f) | 0;
    h6 = (h6 + g) | 0;
    h7 = (h7 + h) | 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((v) => (v >>> 0).toString(16).padStart(8, "0"))
    .join("");
}

function ror(value: number, bits: number): number {
  return ((value >>> bits) | (value << (32 - bits))) >>> 0;
}

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

// --- Convex functions ---

export const startSession = internalMutation({
  args: {
    code: v.string(),
    sessionSecret: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("cliAuthSessions", {
      code: args.code,
      sessionSecret: args.sessionSecret,
      status: "pending",
      createdAt: now,
      expiresAt: now + 10 * 60 * 1000, // 10 minutes
    });
  },
});

export const pollSession = internalQuery({
  args: {
    sessionSecret: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("cliAuthSessions")
      .withIndex("by_sessionSecret", (q) =>
        q.eq("sessionSecret", args.sessionSecret)
      )
      .first();

    if (!session) {
      return { status: "expired" as const };
    }

    if (Date.now() > session.expiresAt) {
      return { status: "expired" as const };
    }

    if (session.status === "completed") {
      return {
        status: "completed" as const,
        token: session.token,
        userEmail: session.userEmail,
      };
    }

    return { status: "pending" as const };
  },
});

export const approveSession = mutation({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db
      .query("cliAuthSessions")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (!session) throw new Error("Session not found");
    if (session.status !== "pending") throw new Error("Session already used");
    if (Date.now() > session.expiresAt) throw new Error("Session expired");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const rawToken = generateToken();
    const tokenH = hashToken(rawToken);

    await ctx.db.insert("apiTokens", {
      userId,
      tokenHash: tokenH,
      tokenPrefix: rawToken.slice(0, 8),
      createdAt: Date.now(),
    });

    await ctx.db.patch(session._id, {
      status: "completed",
      token: rawToken,
      userEmail: user.email,
    });
  },
});

export const validateToken = internalQuery({
  args: {
    tokenHash: v.string(),
  },
  handler: async (ctx, args) => {
    const apiToken = await ctx.db
      .query("apiTokens")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", args.tokenHash))
      .first();

    if (!apiToken || apiToken.revokedAt) return null;

    return { userId: apiToken.userId, tokenId: apiToken._id };
  },
});

