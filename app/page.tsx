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
  const [confirmClear, setConfirmClear] = useState(false);
  const [createStatus, setCreateStatus] = useState<"success" | "error" | null>(null);

  // Profile fields
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [yoe, setYoe] = useState("");
  const [intent, setIntent] = useState("");
  const [linkedinSummary, setLinkedinSummary] = useState("");
  // Other form state
  const [transcript, setTranscript] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcribing, setTranscribing] = useState(false);

  useEffect(() => {
    (async () => {
      await fetch("/api/settings");
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

  async function clearAllLeads() {
    // Optimistically wipe UI immediately so the list empties without waiting for CDN read-after-write lag.
    setLeads([]);
    setActiveId(null);
    setConfirmClear(false);
    const res = await fetch("/api/leads", { method: "DELETE" });
    if (!res.ok) {
      // Server rejected — restore by re-fetching.
      setError("Clear failed — please try again.");
      await refreshLeads();
    }
  }

  function loadStandardPersona(p: StandardPersona) {
    setName(p.profile.name ?? "");
    setRole(p.profile.role ?? "");
    setCompany(p.profile.company ?? "");
    setYoe(p.profile.yoe != null ? String(p.profile.yoe) : "");
    setIntent(p.profile.intent ?? "");
    setLinkedinSummary(p.profile.linkedinSummary ?? "");
    // Transcript is NOT auto-filled — the user must upload it manually via text or audio.
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
    setCreateStatus(null);
    setLoading(true);
    try {
      const profile = {
        name: name.trim(),
        ...(role.trim() && { role: role.trim() }),
        ...(company.trim() && { company: company.trim() }),
        ...(yoe.trim() && { yoe: Number(yoe) }),
        ...(intent.trim() && { intent: intent.trim() }),
        ...(linkedinSummary.trim() && { linkedinSummary: linkedinSummary.trim() }),
      };
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
      // Optimistically prepend the new lead so it appears immediately,
      // before Vercel Blob CDN propagates the write to the next read.
      setLeads((prev) => [data.lead, ...prev]);
      setActiveId(data.lead.id);
      setName(""); setRole(""); setCompany(""); setYoe(""); setIntent(""); setLinkedinSummary("");
      setTranscript("");
      setLeadPhone("");
      setAudioFile(null);
      setCreateStatus("success");
      setTimeout(() => setCreateStatus(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setCreateStatus("error");
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

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Name <span className="text-red-500">*</span></label>
            <input className="input" placeholder="Rohan Mehta" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Role</label>
            <input className="input" placeholder="SDE-2" value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
          <div>
            <label className="label">Company</label>
            <input className="input" placeholder="Infosys" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div>
            <label className="label">Years of experience</label>
            <input className="input" type="number" min={0} max={60} placeholder="4" value={yoe} onChange={(e) => setYoe(e.target.value)} />
          </div>
          <div>
            <label className="label">Intent</label>
            <input className="input" placeholder="switch to product co" value={intent} onChange={(e) => setIntent(e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">LinkedIn bio / About (optional)</label>
            <textarea className="textarea" rows={2} placeholder="Brief background from LinkedIn…" value={linkedinSummary} onChange={(e) => setLinkedinSummary(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Call transcript — optional before the call, needed for the PDF</label>
          <textarea
            className="textarea"
            rows={10}
            placeholder="BDA: ...&#10;Lead: ..."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
          />
          <p className="text-xs text-[color:var(--muted)] mt-1">
            Leave blank to create the lead pre-call. You can add the transcript after the call directly on the lead card.
          </p>
        </div>

        <div className="border-t border-[color:var(--border)] pt-4">
          <label className="label">…or upload a call recording (audio)</label>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="btn btn-ghost cursor-pointer">
              🎙 Choose audio file
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {audioFile && (
              <span className="text-xs text-[color:var(--muted)] truncate max-w-[180px]" title={audioFile.name}>
                {audioFile.name}
              </span>
            )}
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

        {createStatus === "error" && error && (
          <div className="text-sm text-red-600 p-2 border border-red-200 rounded bg-red-50">
            ✕ {error}
          </div>
        )}

        <button
          className={`btn w-full ${
            createStatus === "success"
              ? "bg-green-600 text-white border-green-600"
              : createStatus === "error"
              ? "bg-red-600 text-white border-red-600"
              : "btn-primary"
          }`}
          disabled={loading || !name.trim() || !!createStatus}
          onClick={createLead}
        >
          {loading
            ? "Creating…"
            : createStatus === "success"
            ? "✓ Lead created!"
            : createStatus === "error"
            ? "✕ Failed — try again"
            : "Create lead"}
        </button>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Leads</h2>
          {leads.length > 0 && !confirmClear && (
            <button
              className="btn btn-ghost text-xs text-red-500"
              onClick={() => setConfirmClear(true)}
            >
              Clear all
            </button>
          )}
          {confirmClear && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-red-600 font-medium">
                Remove all {leads.length} lead{leads.length !== 1 ? "s" : ""}? This can&apos;t be undone.
              </span>
              <button className="btn btn-danger text-xs py-0.5 px-2" onClick={clearAllLeads}>
                Yes, clear all
              </button>
              <button className="btn btn-ghost text-xs py-0.5 px-2" onClick={() => setConfirmClear(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>
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
              onChanged={(updated) =>
                setLeads((prev) =>
                  prev.map((x) => (x.id === updated.id ? updated : x))
                )
              }
              onDeleted={() => {
                if (activeId === l.id) setActiveId(null);
                setLeads((prev) => prev.filter((x) => x.id !== l.id));
              }}
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
  onDeleted,
}: {
  lead: Lead;
  active: boolean;
  onSelect: () => void;
  onChanged: (updated: Lead) => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [cover, setCover] = useState(lead.coverMessage ?? "");
  const [transcriptEdit, setTranscriptEdit] = useState(lead.transcript ?? "");
  const [transcriptBusy, setTranscriptBusy] = useState(false);
  const [transcriptStatus, setTranscriptStatus] = useState<"saved" | "error" | null>(null);
  const [cardAudioFile, setCardAudioFile] = useState<File | null>(null);
  const [cardTranscribing, setCardTranscribing] = useState(false);
  const [phoneEdit, setPhoneEdit] = useState(lead.leadPhoneE164 ?? "");
  const [phoneStatus, setPhoneStatus] = useState<"saved" | "error" | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [pdfStep, setPdfStep] = useState(0);

  const PDF_STEPS = [
    "Extracting questions from transcript…",
    "Building persona profile…",
    "Retrieving Scaler programme details…",
    "Generating personalised sections…",
    "Rendering PDF…",
    "Uploading…",
  ];

  useEffect(() => {
    if (busy !== "pdf") { setPdfStep(0); return; }
    const t = setInterval(() => setPdfStep((s) => Math.min(s + 1, PDF_STEPS.length - 1)), 4000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy]);

  useEffect(() => {
    setCover(lead.coverMessage ?? "");
  }, [lead.coverMessage]);

  useEffect(() => {
    setTranscriptEdit(lead.transcript ?? "");
  }, [lead.transcript]);

  useEffect(() => {
    setPhoneEdit(lead.leadPhoneE164 ?? "");
  }, [lead.leadPhoneE164]);

  async function act(
    label: string,
    path: string,
    init: RequestInit = { method: "POST" }
  ): Promise<boolean> {
    setBusy(label);
    setErr(null);
    try {
      const res = await fetch(path, init);
      // Server may return plain-text on unhandled crash — parse gracefully.
      let data: Record<string, unknown> = {};
      try {
        data = await res.json();
      } catch {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Server error (${res.status})`);
      }
      if (!res.ok) throw new Error((data.error as string) || "Failed");
      if (data.lead) onChanged(data.lead as import("@/lib/types").Lead);
      return true;
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      return false;
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
        <div className="flex items-center gap-2">
          <span className={`badge badge-${lead.status}`}>
            {lead.status.replace("_", " ")}
          </span>
          <button
            className="text-[color:var(--muted)] hover:text-red-500 text-lg leading-none"
            title="Close lead"
            onClick={() => setConfirmClose(true)}
          >
            ✕
          </button>
        </div>
      </header>

      {confirmClose && (
        <div className="mb-3 p-2 border border-red-200 bg-red-50 rounded text-xs flex items-center gap-2">
          <span className="text-red-700 font-medium flex-1">
            Remove this lead? This can&apos;t be undone.
          </span>
          <button
            className="btn btn-danger text-xs py-0.5 px-2"
            disabled={!!busy}
            onClick={async () => {
              setBusy("delete");
              // Optimistically remove from UI before CDN round-trip.
              onDeleted();
              const res = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
              setBusy(null);
              if (!res.ok) setErr("Remove failed — please reload.");
            }}
          >
            {busy === "delete" ? "Removing…" : "Remove"}
          </button>
          <button
            className="btn btn-ghost text-xs py-0.5 px-2"
            onClick={() => setConfirmClose(false)}
          >
            Cancel
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        <button
          className="btn btn-accent"
          disabled={!!busy || !!lead.nudge}
          title={lead.nudge ? "Nudge already sent" : undefined}
          onClick={() => act("nudge", `/api/leads/${lead.id}/nudge`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ profile: lead.profile, transcript: lead.transcript, bdaPhoneE164: lead.bdaPhoneE164 }),
          })}
        >
          {lead.nudge ? "Nudge sent ✓" : busy === "nudge" ? "Generating…" : "Generate pre-call nudge"}
        </button>
        <button
          className="btn btn-primary"
          disabled={!!busy || !lead.transcript?.trim()}
          title={!lead.transcript?.trim() ? "Save a call transcript first — use the transcript section below" : undefined}
          onClick={() => act("pdf", `/api/leads/${lead.id}/generate-pdf`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ profile: lead.profile, transcript: lead.transcript, bdaPhoneE164: lead.bdaPhoneE164 }),
          })}
        >
          {busy === "pdf" ? "Generating PDF…" : "Generate post-call PDF"}
        </button>
      </div>

      {!lead.transcript?.trim() && (
        <p className="text-xs text-[color:var(--muted)] mt-1">
          📝 Add and save a transcript below (text or audio) to unlock the post-call PDF.
        </p>
      )}

      {busy === "pdf" && (
        <div className="text-xs text-[color:var(--muted)] border border-[color:var(--border)] rounded p-3 space-y-2">
          {PDF_STEPS.map((step, i) => (
            <div key={step} className={`flex items-center gap-2 transition-opacity duration-500 ${i > pdfStep ? "opacity-30" : "opacity-100"}`}>
              <span className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] ${i < pdfStep ? "bg-green-500 text-white" : i === pdfStep ? "bg-sky-500 text-white animate-pulse" : "bg-slate-200"}`}>
                {i < pdfStep ? "✓" : i + 1}
              </span>
              <span className={i === pdfStep ? "text-sky-600 font-medium" : ""}>{step}</span>
            </div>
          ))}
        </div>
      )}

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

      {lead.status !== "approved_sent" && (
        <details className="mb-3 text-sm">
          <summary className="cursor-pointer font-medium">
            📝 Call transcript {lead.transcript ? "(edit)" : "(add after call)"}
          </summary>
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <label className="btn btn-ghost cursor-pointer text-xs">
                🎙 Choose audio file
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => setCardAudioFile(e.target.files?.[0] ?? null)}
                />
              </label>
              {cardAudioFile && (
                <span className="text-xs text-[color:var(--muted)] truncate max-w-[160px]" title={cardAudioFile.name}>
                  {cardAudioFile.name}
                </span>
              )}
              <button
                className="btn btn-ghost text-xs"
                disabled={!cardAudioFile || cardTranscribing}
                onClick={async () => {
                  if (!cardAudioFile) return;
                  setCardTranscribing(true);
                  setErr(null);
                  try {
                    const fd = new FormData();
                    fd.append("audio", cardAudioFile);
                    const res = await fetch("/api/transcribe", { method: "POST", body: fd });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Transcription failed");
                    setTranscriptEdit(data.transcript);
                    setCardAudioFile(null);
                  } catch (e) {
                    setErr(e instanceof Error ? e.message : String(e));
                  } finally {
                    setCardTranscribing(false);
                  }
                }}
              >
                {cardTranscribing ? "Transcribing…" : "Transcribe"}
              </button>
            </div>
            <textarea
              className="textarea text-xs"
              rows={6}
              value={transcriptEdit}
              onChange={(e) => setTranscriptEdit(e.target.value)}
              placeholder={"BDA: ...\nLead: ..."}
            />
            <button
              className="btn btn-ghost"
              disabled={transcriptBusy || transcriptEdit === (lead.transcript ?? "")}
              onClick={async () => {
                setTranscriptBusy(true);
                setTranscriptStatus(null);
                const ok = await act("transcript", `/api/leads/${lead.id}/transcript`, {
                  method: "PATCH",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ transcript: transcriptEdit }),
                });
                setTranscriptBusy(false);
                setTranscriptStatus(ok ? "saved" : "error");
                if (ok) {
                  setTimeout(() => setTranscriptStatus(null), 3000);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
            >
              {transcriptBusy ? "Saving…" : "Save transcript"}
            </button>
            {transcriptStatus === "saved" && (
              <span className="text-xs text-green-600 font-medium">✓ Transcript saved</span>
            )}
            {transcriptStatus === "error" && (
              <span className="text-xs text-red-600 font-medium">✕ Save failed — try again</span>
            )}
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

          {!lead.leadPhoneE164 && (
            <div className="mb-3 p-2 border border-amber-200 bg-amber-50 rounded text-xs">
              <label className="label">
                Lead&apos;s WhatsApp number — needed to send the PDF
              </label>
              <p className="text-[color:var(--muted)] mb-2">
                Enter with country code (e.g. +91 98765 43210). The number must have joined the Twilio Sandbox.
              </p>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="+919876543210"
                  value={phoneEdit}
                  onChange={(e) => { setPhoneEdit(e.target.value); setPhoneStatus(null); }}
                />
                <button
                  className="btn btn-ghost"
                  disabled={!!busy || !phoneEdit.match(/^\+\d{8,15}$/)}
                  onClick={async () => {
                    setPhoneStatus(null);
                    const ok = await act("save-phone", `/api/leads/${lead.id}/phone`, {
                      method: "PATCH",
                      headers: { "content-type": "application/json" },
                      // Pass current lead so the route doesn't overwrite pdfContent with a stale Blob read.
                      body: JSON.stringify({ leadPhoneE164: phoneEdit, lead }),
                    });
                    setPhoneStatus(ok ? "saved" : "error");
                    if (ok) setTimeout(() => setPhoneStatus(null), 3000);
                  }}
                >
                  Save
                </button>
              </div>
              {phoneStatus === "saved" && (
                <p className="text-green-600 font-medium mt-1">✓ Number saved — you can now approve and send.</p>
              )}
              {phoneStatus === "error" && (
                <p className="text-red-600 font-medium mt-1">✕ Save failed — check the format and try again.</p>
              )}
            </div>
          )}

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
              disabled={!!busy || lead.status === "approved_sent" || !lead.leadPhoneE164}
              onClick={() => act("approve", `/api/leads/${lead.id}/approve`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ pdfUrl: lead.pdfUrl, coverMessage: cover, leadPhoneE164: lead.leadPhoneE164 }),
              })}
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
