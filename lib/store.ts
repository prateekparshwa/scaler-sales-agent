import { put, list } from "@vercel/blob";
import fs from "node:fs";
import path from "node:path";
import { Lead } from "./types";

// State lives in a single JSON document at "state/app.json".
// On Vercel: persisted to Vercel Blob (read-modify-write per mutation).
// Locally (no BLOB_READ_WRITE_TOKEN): persisted to .data/app.json on disk.
// Reads are uncached so multiple serverless instances stay consistent.

interface AppState {
  settings: { bdaPhoneE164?: string };
  leads: Lead[];
}

const KEY = "state/app.json";
const LOCAL_FILE = path.join(process.cwd(), ".data", "app.json");

function emptyState(): AppState {
  return { settings: {}, leads: [] };
}

function blobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN;
}

async function readState(): Promise<AppState> {
  const token = blobToken();
  if (!token) {
    if (!fs.existsSync(LOCAL_FILE)) return emptyState();
    try {
      return JSON.parse(fs.readFileSync(LOCAL_FILE, "utf8")) as AppState;
    } catch {
      return emptyState();
    }
  }
  try {
    const res = await list({ prefix: KEY, token, limit: 1 });
    if (res.blobs.length === 0) return emptyState();
    // Cache-bust both at the CDN edge (query param) and at the client (no-store).
    const url = `${res.blobs[0].url}?_=${Date.now()}`;
    const r = await fetch(url, {
      cache: "no-store",
      headers: { "cache-control": "no-cache" },
    });
    if (!r.ok) return emptyState();
    return (await r.json()) as AppState;
  } catch (e) {
    console.warn("[store] readState failed, returning empty:", e);
    return emptyState();
  }
}

async function writeState(state: AppState): Promise<void> {
  const token = blobToken();
  if (!token) {
    const dir = path.dirname(LOCAL_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_FILE, JSON.stringify(state));
    return;
  }
  await put(KEY, JSON.stringify(state), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
    token,
  });
}

export async function getSettings(): Promise<{ bdaPhoneE164?: string }> {
  const s = await readState();
  return s.settings;
}

export async function setSettings(
  next: { bdaPhoneE164?: string }
): Promise<{ bdaPhoneE164?: string }> {
  const s = await readState();
  s.settings = { ...s.settings, ...next };
  await writeState(s);
  return s.settings;
}

export async function getLead(id: string): Promise<Lead | undefined> {
  const s = await readState();
  return s.leads.find((l) => l.id === id);
}

export async function upsertLead(lead: Lead): Promise<Lead> {
  const s = await readState();
  const idx = s.leads.findIndex((l) => l.id === lead.id);
  if (idx === -1) s.leads.push(lead);
  else s.leads[idx] = lead;
  await writeState(s);
  return lead;
}

export async function listLeads(): Promise<Lead[]> {
  const s = await readState();
  return s.leads.slice().sort((a, b) => b.createdAt - a.createdAt);
}
