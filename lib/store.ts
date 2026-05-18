import { put, list } from "@vercel/blob";
import fs from "node:fs";
import path from "node:path";
import { Lead } from "./types";

// State lives in a single JSON document at "state/app.json".
// On Vercel: persisted to Vercel Blob (read-modify-write per mutation).
// Locally (no BLOB_READ_WRITE_TOKEN): persisted to .data/app.json on disk.

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

// Cache the blob URL after the first put() so subsequent readState() calls
// skip list() entirely. list() has CDN-level caching that causes stale reads
// immediately after a write; the direct URL fetch with cache-bust does not.
// URL is stable because addRandomSuffix: false keeps the same path every write.
let _blobUrl: string | undefined;

// Hot in-memory cache for leads. Populated on every upsertLead/deleteLead/clearLeads
// so getLead() always finds a freshly written lead on the same serverless instance
// without waiting for Blob CDN propagation.
const _leadCache = new Map<string, Lead>();

// Discover the blob URL on a cold instance that hasn't written yet.
// Retries the list() call to handle CDN lag after a recent write by another instance.
async function discoverBlobUrl(token: string): Promise<string | undefined> {
  for (let i = 0; i < 6; i++) {
    const res = await list({ prefix: KEY, token, limit: 1 });
    if (res.blobs.length > 0) return res.blobs[0].url;
    if (i < 5) await new Promise((r) => setTimeout(r, 500));
  }
  return undefined;
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
    if (!_blobUrl) {
      _blobUrl = await discoverBlobUrl(token);
      if (!_blobUrl) return emptyState();
    }
    // Cache-bust the CDN edge so we always get the latest content.
    const r = await fetch(`${_blobUrl}?_=${Date.now()}`, {
      cache: "no-store",
      headers: { "cache-control": "no-cache, no-store" },
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
  const result = await put(KEY, JSON.stringify(state), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
    token,
  });
  // Cache the stable URL so future readState() calls on this instance skip list().
  _blobUrl = result.url;
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
  // Hot cache hit — same instance that just wrote the lead.
  if (_leadCache.has(id)) return _leadCache.get(id);
  // Retry with back-off for cross-instance reads where Blob CDN may lag.
  for (let attempt = 0; attempt < 5; attempt++) {
    const s = await readState();
    const lead = s.leads.find((l) => l.id === id);
    if (lead) { _leadCache.set(id, lead); return lead; }
    if (attempt < 4) {
      _blobUrl = undefined; // Force re-discovery on next readState()
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
  }
  return undefined;
}

export async function upsertLead(lead: Lead): Promise<Lead> {
  _leadCache.set(lead.id, lead);
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

export async function deleteLead(id: string): Promise<void> {
  _leadCache.delete(id);
  const s = await readState();
  s.leads = s.leads.filter((l) => l.id !== id);
  await writeState(s);
}

export async function clearLeads(): Promise<void> {
  _leadCache.clear();
  const s = await readState();
  s.leads = [];
  await writeState(s);
}
