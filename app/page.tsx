"use client";

import { useEffect, useMemo, useState } from "react";
import { Lead } from "@/lib/types";
import { StandardPersona } from "@/lib/personas";

type Step = "onboarding" | "dashboard";

export default function Home() {
  const [bdaPhone, setBdaPhone] = useState("");
  const [step, setStep] = useState<Step>("onboarding");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [personas, setPersonas] = useState<StandardPersona[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [profileJson, setProfileJson] = useState("");
  const [transcript, setTranscript] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcribing, setTranscribing] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await fetch("/api/settings").then((r) => r.json());
      if (s.bdaPhoneE164) {
        setBdaPhone(s.bdaPhoneE164);
        setStep("dashboard");
      }
      const l = await fetch("/api/leads").then((r) => r.json());
      setLeads(l.leads ?? []);
      const p = await fetch("/api/personas").then((r) => r.json());
      setPersonas(p.personas ?? []);
    })();
  }, []);

  async function saveBdaPhone() {
    setError(null);
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ bdaPhoneE164: bdaPhone }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setStep("dashboard");
  }

  async function refreshLeads() {
    const l = await fetch("/api/leads").then((r) => r.json());
    setLeads(l.leads ?? []);
  }

  function loadStandardPersona(p: StandardPersona) {
    setProfileJson(JSON.stringify(p.profile, null, 2));
    setTranscript(p.transcript);
  }

  async function uploadAndTranscribe() {
    if (!audioFile) return;
    setTranscribing(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("audio", audioFile);
      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transcription failed");
      setTranscript(data.transcript);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setTranscribing(false);
    }
  }

  async function createLead() {
    setError(null);
    setLoading(true);
    try {
      let profile;
      try {
        profile = JSON.parse(profileJson);
      } catch {
        throw new Error("Profile is not valid JSON.");
      }
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          profile,
          transcript,
          leadPhoneE164: leadPhone || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActiveId(data.lead.id);
      setProfileJson("");
      setTranscript("");
      setLeadPhone("");
      setAudioFile(null);
      await refreshLeads();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const activeLead = useMemo(
    () => leads.find((l) => l.id === activeId) ?? null,
    [leads, activeId]
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = activeLead;

  if (step === "onboarding") {
    return (
      <main className="flex-1 grid place-items-center p-6">
        <div className="card max-w-lg w-full">
          <h1 className="text-2xl font-bold mb-1">Scaler BDA Cockpit</h1>
          <p className="text-sm text-[color:var(--muted)] mb-6">
            Set your BDA WhatsApp number once. This is where pre-call nudges land.
          </p>

          <label className="label">Your BDA WhatsApp number (E.164)</label>
          <input
            className="input mb-1"
            placeholder="+14155551234"
            value={bdaPhone}
            onChange={(e) => setBdaPhone(e.target.value)}
          />
          <p className="text-xs text-[color:var(--muted)] mb-5">
            Include the country code. Twilio Sandbox: send{" "}
            <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">
              join &lt;phrase&gt;
            </code>{" "}
            from this number to{" "}
            <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">
              +1 415 523 8886
            </code>{" "}
            first.
          </p>

          {error && (
            <div className="text-sm text-red-600 mb-3 p-2 border border-red-200 rounded bg-red-50">
              {error}
            </div>
          )}

          <button className="btn btn-primary w-full" onClick={saveBdaPhone}>
            Continue →
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-[1.1fr_1.4fr] gap-6">
      <header className="lg:col-span-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Scaler BDA Cockpit</h1>
          <p className="text-sm text-[color:var(--muted)]">
            BDA WhatsApp: <span className="font-mono">{bdaPhone}</span> ·{" "}
            <button className="underline" onClick={() => setStep("onboarding")}>
              change
            </button>
          </p>
        </div>
      </header>

      <section className="card flex flex-col gap-4 h-fit">
        <h2 className="text-lg font-semibold">New lead</h2>

        <div>
          <span className="label">Quick-load standard persona</span>
          <div className="flex flex-wrap gap-2">
            {personas.map((p) => (
              <button
                key={p.id}
                className="btn btn-ghost"
                onClick={() => loadStandardPersona(p)}
                title={p.label}
              >
                {p.profile.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Lead profile (JSON)</label>
          <textarea
            className="textarea"
            placeholder='{"name":"Jane Doe","role":"SDE","company":"...","yoe":3,"intent":"..."}'
            value={profileJson}
            onChange={(e) => setProfileJson(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Call transcript (text)</label>
          <textarea
            className="textarea"
            rows={10}
            placeholder="BDA: ...&#10;Lead: ..."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
          />
        </div>

        <div className="border-t border-[color:var(--border)] pt-4">
          <label className="label">…or upload a call recording (audio)</label>
          <div className="flex gap-2">
            <input
              type="file"
              accept="audio/*"
              className="input flex-1"
              onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
            />
            <button
              className="btn btn-ghost"
              disabled={!audioFile || transcribing}
              onClick={uploadAndTranscribe}
            >
              {transcribing ? "Transcribing…" : "Transcribe"}
            </button>
          </div>
          <p className="text-xs text-[color:var(--muted)] mt-2">
            Whisper transcribes → fills the transcript above → same downstream flow.
          </p>
        </div>

        <div>
          <label className="label">Lead WhatsApp (E.164, for PDF send)</label>
          <input
            className="input"
            placeholder="+14155551234"
            value={leadPhone}
            onChange={(e) => setLeadPhone(e.target.value)}
          />
          <p className="text-xs text-[color:var(--muted)] mt-1">
            Twilio Sandbox: this number must also have joined the sandbox.
          </p>
        </div>

        {error && (
          <div className="text-sm text-red-600 p-2 border border-red-200 rounded bg-red-50">
            {error}
          </div>
        )}

        <button
          className="btn btn-primary"
          disabled={loading || !profileJson.trim()}
          onClick={createLead}
        >
          {loading ? "Creating…" : "Create lead"}
        </button>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Leads</h2>
        {leads.length === 0 && (
          <div className="card text-sm text-[color:var(--muted)]">
            No leads yet — create one on the left.
          </div>
        )}
        <div className="space-y-3">
          {leads.map((l) => (
            <LeadCard
              key={l.id}
              lead={l}
              active={l.id === activeId}
              onSelect={() => setActiveId(l.id)}
              onChanged={refreshLeads}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function LeadCard({
  lead,
  active,
  onSelect,
  onChanged,
}: {
  lead: Lead;
  active: boolean;
  onSelect: () => void;
  onChanged: () => Promise<void>;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [cover, setCover] = useState(lead.coverMessage ?? "");

  useEffect(() => {
    setCover(lead.coverMessage ?? "");
  }, [lead.coverMessage]);

  async function act(
    label: string,
    path: string,
    init: RequestInit = { method: "POST" }
  ) {
    setBusy(label);
    setErr(null);
    try {
      const res = await fetch(path, init);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      await onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function saveCover() {
    await act("save-cover", `/api/leads/${lead.id}/cover`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ coverMessage: cover }),
    });
  }

  return (
    <div className={`card ${active ? "ring-2 ring-sky-400" : ""}`}>
      <header className="flex items-center justify-between mb-3">
        <button
          className="font-semibold text-left hover:underline"
          onClick={onSelect}
        >
          {lead.profile.name}{" "}
          <span className="text-xs text-[color:var(--muted)] font-normal">
            {lead.profile.role}
            {lead.profile.company ? ` · ${lead.profile.company}` : ""}
          </span>
        </button>
        <span className={`badge badge-${lead.status}`}>
          {lead.status.replace("_", " ")}
        </span>
      </header>

      <div className="flex flex-wrap gap-2 mb-3">
        <button
          className="btn btn-accent"
          disabled={!!busy}
          onClick={() => act("nudge", `/api/leads/${lead.id}/nudge`)}
        >
          {busy === "nudge" ? "Generating…" : "Generate pre-call nudge"}
        </button>
        <button
          className="btn btn-primary"
          disabled={!!busy}
          onClick={() => act("pdf", `/api/leads/${lead.id}/generate-pdf`)}
        >
          {busy === "pdf" ? "Generating PDF…" : "Generate post-call PDF"}
        </button>
      </div>

      {err && (
        <div className="text-sm text-red-600 p-2 border border-red-200 rounded bg-red-50 mb-2">
          {err}
        </div>
      )}

      {lead.nudge && (
        <details className="mb-3 text-sm" open={active}>
          <summary className="cursor-pointer font-medium">
            ✉️ Pre-call nudge (sent to BDA)
          </summary>
          <pre className="mt-2 p-3 bg-slate-50 rounded border border-[color:var(--border)] text-xs whitespace-pre-wrap font-mono">
{`${lead.nudge.oneLiner}

Who they are: ${lead.nudge.whoTheyAre}

Persona: ${lead.nudge.persona}

Angles:
${lead.nudge.angles.map((a, i) => `  ${i + 1}. ${a.angle} — ${a.why}`).join("\n")}

Objections:
${lead.nudge.objections.map((o) => `  • ${o.objection}\n     → ${o.handle}`).join("\n")}

Open with: "${lead.nudge.openingHook}"

${lead.nudge.inferredVsFact}`}
          </pre>
        </details>
      )}

      {lead.persona && (
        <details className="mb-3 text-sm" open={active}>
          <summary className="cursor-pointer font-medium">🎯 Persona signals</summary>
          <div className="mt-2 p-3 bg-slate-50 rounded border border-[color:var(--border)] text-xs space-y-1">
            <div>
              <strong>Archetype:</strong> {lead.persona.archetype}
            </div>
            <div>
              <strong>Tone:</strong> {lead.persona.tonePrompt}
            </div>
            <div>
              <strong>Primary concerns:</strong>{" "}
              {(lead.persona.primaryConcerns ?? []).join(" · ")}
            </div>
          </div>
        </details>
      )}

      {lead.pdfContent && lead.pdfUrl && (
        <div className="mt-3 border-t border-[color:var(--border)] pt-3">
          <div className="text-sm font-semibold mb-2">
            📄 PDF draft ready — approval gate
          </div>
          <a
            className="text-sm text-sky-600 underline mb-2 inline-block"
            href={lead.pdfUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open generated PDF ↗
          </a>

          <label className="label mt-2">WhatsApp cover message (editable)</label>
          <textarea
            className="textarea"
            rows={4}
            style={{ minHeight: "5rem" }}
            value={cover}
            onChange={(e) => setCover(e.target.value)}
          />
          <div className="flex flex-wrap gap-2 mt-2">
            <button
              className="btn btn-ghost"
              disabled={!!busy || cover === (lead.coverMessage ?? "")}
              onClick={saveCover}
            >
              Save edit
            </button>
            <button
              className="btn btn-success"
              disabled={!!busy || lead.status === "approved_sent"}
              onClick={() => act("approve", `/api/leads/${lead.id}/approve`)}
            >
              {busy === "approve" ? "Sending…" : "✅ Approve & send to lead"}
            </button>
            <button
              className="btn btn-danger"
              disabled={!!busy || lead.status === "skipped"}
              onClick={() => act("skip", `/api/leads/${lead.id}/skip`)}
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
