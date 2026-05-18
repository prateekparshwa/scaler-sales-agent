import OpenAI from "openai";

// We use the OpenAI SDK against Gemini's OpenAI-compatible endpoint.
// Docs: https://ai.google.dev/gemini-api/docs/openai
// This lets the rest of the codebase stay vendor-neutral.

let client: OpenAI | null = null;

export function openai(): OpenAI {
  if (!client) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error(
        "GEMINI_API_KEY is not set. Add it to .env.local (dev) or Vercel project env (prod)."
      );
    }
    client = new OpenAI({
      apiKey: key,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });
  }
  return client;
}

// Retry transient errors from Gemini (503 overloaded, 429 rate-limit, network blips).
// Exponential backoff with jitter, max 3 attempts.
export async function withRetry<T>(
  fn: () => Promise<T>,
  label = "call",
  maxAttempts = 3
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const transient =
        msg.includes("503") ||
        msg.includes("429") ||
        msg.includes("overloaded") ||
        msg.includes("timeout") ||
        msg.includes("ECONNRESET") ||
        msg.includes("UND_ERR");
      if (!transient || attempt === maxAttempts) throw err;
      const delay = 800 * Math.pow(2, attempt - 1) + Math.random() * 400;
      console.warn(
        `[retry] ${label} attempt ${attempt} failed (${msg.slice(0, 80)}); retrying in ${Math.round(delay)}ms`
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

export const MODELS = {
  // Highest-quality generation for the lead-facing PDF.
  // Default: gemini-2.5-flash (free 15 RPM / 1500 RPD). Set USE_GEMINI_PRO=1 if you have paid quota.
  pdf: process.env.USE_GEMINI_PRO ? "gemini-2.5-pro" : "gemini-2.5-flash",
  // Fast/cheap for BDA-only nudge, question extraction, persona inference, cover.
  // Flash-Lite: 30 RPM, 1000 RPD on free tier — keeps the multi-step pipeline within quota.
  fast: "gemini-2.5-flash-lite",
  // Audio transcription is handled separately via @google/genai native SDK.
  audio: "gemini-2.5-flash",
  // Embeddings (must match the model used to build data/scaler-rag.json).
  embedding: "gemini-embedding-001",
} as const;
