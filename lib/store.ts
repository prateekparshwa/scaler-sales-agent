import { Lead } from "./types";

// In-memory store. Survives within a single Node process; in serverless this
// resets per cold-start. Fine for the demo since each lead's full pipeline runs
// inside a single request chain (BDA performs all actions within minutes).

declare global {
  // eslint-disable-next-line no-var
  var __leadStore: Map<string, Lead> | undefined;
  // eslint-disable-next-line no-var
  var __settingsStore: { bdaPhoneE164?: string } | undefined;
}

export const leadStore: Map<string, Lead> =
  globalThis.__leadStore ?? (globalThis.__leadStore = new Map());

export const settings: { bdaPhoneE164?: string } =
  globalThis.__settingsStore ?? (globalThis.__settingsStore = {});

export function getLead(id: string): Lead | undefined {
  return leadStore.get(id);
}

export function upsertLead(lead: Lead): Lead {
  leadStore.set(lead.id, lead);
  return lead;
}

export function listLeads(): Lead[] {
  return Array.from(leadStore.values()).sort((a, b) => b.createdAt - a.createdAt);
}
