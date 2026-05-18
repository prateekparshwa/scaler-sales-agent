import { put } from "@vercel/blob";
import fs from "node:fs";
import path from "node:path";

export async function uploadPdf(filename: string, body: Buffer): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  // Local-dev fallback: when Blob isn't configured, write to ./public/pdfs/.
  // On Vercel the filesystem is read-only, so this branch never runs in prod.
  if (!token) {
    const dir = path.join(process.cwd(), "public", "pdfs");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const safe = filename.replace(/[^\w.-]+/g, "-");
    fs.writeFileSync(path.join(dir, safe), body);
    const base = process.env.PUBLIC_BASE_URL ?? "http://localhost:3000";
    return `${base}/pdfs/${safe}`;
  }

  const result = await put(filename, body, {
    access: "public",
    contentType: "application/pdf",
    token,
    addRandomSuffix: true,
    allowOverwrite: false,
  });
  return result.url;
}
