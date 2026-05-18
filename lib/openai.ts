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
  // Strongest model for the lead-facing PDF — this is the 30% rubric.
  // Override with GEMINI_PDF_MODEL if you need to dial back for quota reasons.
  pdf: process.env.GEMINI_PDF_MODEL ?? "gemini-2.5-pro",
  // Fast/cheap for BDA-only nudge, question extraction, persona inference, cover.
  fast: process.env.GEMINI_FAST_MODEL ?? "gemini-2.5-flash",
  // Audio transcription via @google/genai native SDK (OpenAI-compat has no audio).
  audio: "gemini-2.5-flash",
  // Embeddings (must match the model used to build data/scaler-rag.json).
  embedding: "gemini-embedding-001",
} as const;
