import fs from "node:fs";
import path from "node:path";
import { embedTexts } from "../gemini";
import { RagChunk, RetrievedChunk } from "../types";

let cache: RagChunk[] | null = null;

function loadCorpus(): RagChunk[] {
  if (cache) return cache;
  const p = path.join(process.cwd(), "data", "scaler-rag.json");
  if (!fs.existsSync(p)) {
    console.warn(
      "[rag] data/scaler-rag.json missing — run `npm run build-rag` after setting GEMINI_API_KEY. Returning empty corpus."
    );
    cache = [];
    return cache;
  }
  cache = JSON.parse(fs.readFileSync(p, "utf8")) as RagChunk[];
  return cache;
}

function cosine(a: number[], b: number[]): number {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
}

export async function retrieve(query: string, k = 3): Promise<RetrievedChunk[]> {
  const corpus = loadCorpus();
  if (corpus.length === 0) return [];
  const [qe] = await embedTexts([query]);
  return corpus
    .map((c) => ({
      source: c.source,
      heading: c.heading,
      text: c.text,
      score: cosine(qe, c.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

// Batch retrieval — single embeddings call for multiple queries.
export async function retrieveMany(
  queries: string[],
  kPerQuery = 3
): Promise<RetrievedChunk[][]> {
  const corpus = loadCorpus();
  if (corpus.length === 0 || queries.length === 0) {
    return queries.map(() => []);
  }
  const vectors = await embedTexts(queries);
  return vectors.map((qe) =>
    corpus
      .map((c) => ({
        source: c.source,
        heading: c.heading,
        text: c.text,
        score: cosine(qe, c.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, kPerQuery)
  );
}

export function formatContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return "(no Scaler corpus available — answer ONLY with 'I'll confirm specifics with your BDA on our next call' for any factual claim)";
  }
  return chunks
    .map(
      (c, i) =>
        `[${i + 1}] ${c.heading} (source: ${c.source})\n${c.text}`
    )
    .join("\n\n");
}
