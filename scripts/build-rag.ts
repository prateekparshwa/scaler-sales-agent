/* eslint-disable @typescript-eslint/no-require-imports */
import fs from "node:fs";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import { SCALER_CORPUS } from "../data/scaler-corpus";

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set. Aborting.");
    process.exit(1);
  }

  const client = new GoogleGenAI({ apiKey });

  console.log(`Embedding ${SCALER_CORPUS.length} chunks via Gemini gemini-embedding-001…`);
  const inputs = SCALER_CORPUS.map((c) => `${c.heading}\n${c.text}`);
  const res = await client.models.embedContent({
    model: "gemini-embedding-001",
    contents: inputs,
  });
  const embeddings = res.embeddings ?? [];
  if (embeddings.length !== SCALER_CORPUS.length) {
    console.error(
      `Embedding count mismatch: expected ${SCALER_CORPUS.length}, got ${embeddings.length}`
    );
    process.exit(1);
  }

  const out = SCALER_CORPUS.map((c, i) => ({
    id: c.id,
    source: c.source,
    heading: c.heading,
    text: c.text,
    embedding: embeddings[i].values ?? [],
  }));

  const outPath = path.join(process.cwd(), "data", "scaler-rag.json");
  fs.writeFileSync(outPath, JSON.stringify(out));
  console.log(`Wrote ${out.length} embedded chunks → ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
