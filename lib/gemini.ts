import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

export function gemini(): GoogleGenAI {
  if (!client) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is not set.");
    client = new GoogleGenAI({ apiKey: key });
  }
  return client;
}

export async function transcribeAudio(
  bytes: ArrayBuffer,
  mimeType: string
): Promise<string> {
  const base64 = Buffer.from(bytes).toString("base64");
  const res = await gemini().models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: "Transcribe this call recording verbatim. Format it as 'BDA: ...' and '<Lead's first name or LEAD>: ...' on alternating lines based on who is speaking. No commentary, no summary — only the transcript.",
          },
          { inlineData: { mimeType, data: base64 } },
        ],
      },
    ],
  });
  return res.text ?? "";
}

export const EMBED_MODEL = "gemini-embedding-001";

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const res = await gemini().models.embedContent({
    model: EMBED_MODEL,
    contents: texts,
  });
  const embeddings = res.embeddings ?? [];
  return embeddings.map((e) => e.values ?? []);
}

export async function embedText(text: string): Promise<number[]> {
  const [v] = await embedTexts([text]);
  return v ?? [];
}
