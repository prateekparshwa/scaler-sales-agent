# Scaler Sales Agent — BDA Cockpit

Live: https://scaler-sales-agent-fawn.vercel.app · Repo: https://github.com/prateekparshwa/scaler-sales-agent · Loom: `<LOOM_URL>`

> **Before you test the live app:** WhatsApp delivery uses the Twilio Sandbox. From the WhatsApp number you want messages on, send `join <phrase>` to `+1 415 523 8886` to opt-in (the phrase is in the submission email). The dashboard's onboarding screen asks for your number after that.

## 1. What you built

A Next.js app that helps a Scaler BDA prepare for and follow up on sales calls. The BDA can add a lead profile and either type in the call transcript or upload a call recording. Before the call, the app sends the BDA a WhatsApp message with a quick summary of the lead, the best talking points, likely objections, and a suggested opening line. After the call, it creates a personalised 2–3 page PDF for the lead, answering the questions they actually asked. The answers come only from approved Scaler website content, and the app does not make things up when information is missing. Before anything is sent to the lead, the BDA can approve it, edit the cover note, or skip it. Once approved, the PDF and message are sent to the lead on WhatsApp through Twilio. Both typed transcripts and audio uploads work on the live app

## 2. One failure I found (49 words)

The strongest honest failure from this project is the opening hook hallucination:
Input: Fresh lead, no prior call.
Output: "Hi Priya, thanks for connecting again — wanted to share what we discussed..."

The agent fabricated prior contact ( thanks for connecting..) that never existed — a factual lie the BDA would not say to a prospect. 
Root cause: the model defaulted to follow-up phrasing patterns from training data, ignoring the explicit cold-call context given in the prompt.

## 3. Scale plan — 1 lead/day → 100k leads/month (97 words)

Two things break first. **(1) Per-lead LLM cost.** Gemini 2.5 Pro for the PDF (~6k input + 2k output tokens) is ~$0.02/lead. At 100k/month that's ~$2k just on PDFs — fine, but I'd route the bottom ~70% (warm/cold leads) to 2.5 Flash and reserve Pro for hot/late-funnel leads. **(2) Twilio's WhatsApp throughput + 24-hour session window.** Sandbox is single-number; production needs a verified WABA + pre-approved message templates, and outbound PDFs to leads who haven't messaged in 24h must use template-message flows. Both are scoping problems, not engineering ones.

---

## Decisions documented

| Area | Choice | Why |
|---|---|---|
| Stack | Next.js 16 (App Router) on Vercel | Single deploy, API routes co-located, fastest path to a working live link |
| LLM | Google Gemini — gemini-2.5-pro for PDF, gemini-2.5-flash for nudge/extract/persona/cover | Best personalisation-per-rupee. Frontier model where it matters (lead-facing), fast model where it doesn't (BDA-internal) |
| STT | Gemini 2.5 Flash (native multimodal audio) | One key handles everything; no separate STT provider |
| Grounding | Pre-scraped scaler.com → in-repo embedded JSON, cosine search at runtime | No vector DB needed for ~25 chunks; zero cold-start lookup, fully reproducible |
| PDF | `@react-pdf/renderer`, server-rendered to Buffer, uploaded to Vercel Blob | Returns a public URL Twilio can fetch as media |
| WhatsApp | Twilio Sandbox | Brief's recommended fastest path |
| Storage | In-memory `Map` keyed by lead ID + Vercel Blob for PDFs | Demo doesn't need persistence; cold starts wipe state but each lead's pipeline runs end-to-end inside a few minutes |
| Approval gate | Web dashboard, cover message editable, PDF Approve/Skip only | Highest signal-to-effort for the rubric; "Edit cover" is the realistic BDA action |

## Personalisation strategy (the 30% rubric)

Three layers conditioned per lead, applied to every generation:

1. **Profile bucket** (deterministic) — seniority × company-tier × intent-verb. Drives accent colour and which Scaler program the PDF anchors on.
2. **Transcript signals** (LLM-extracted) — open questions + emotional cues mined from the verbatim transcript. The PDF's section headings ARE these questions, in the lead's own phrasing.
3. **Tone calibration** (LLM-derived `tonePrompt`) — a one-paragraph persona-specific tone directive passed into the PDF prompt. Karthik gets "peer-to-peer, concede what they can learn elsewhere"; Meera gets "warm, address parents, foreground financing and test-anxiety reassurance"; Rohan gets "ROI math forward, respect their salary calculus".

The PDF prompt has explicit anti-pattern guardrails: no marketing taglines, no "you'll love this", no FAQ sections the lead didn't ask about, no fabricated stats.

## Anti-hallucination (the 25% rubric)

- `data/scaler-corpus.ts` contains 25 hand-curated chunks scraped from scaler.com/academy, /data-science-course, /devops-course, /about — each with its source URL.
- `npm run build-rag` embeds them with Gemini's `text-embedding-004` and writes `data/scaler-rag.json` (committed).
- At runtime, the PDF generator retrieves top-3 chunks per question and passes them as context with the instruction: *"Every factual claim about Scaler MUST be grounded in the provided context blocks. If the context doesn't support a claim, write 'I'll confirm specifics with your BDA on our next call' — DO NOT FABRICATE."*
- Three "internal-policy" chunks explicitly block the model from claiming job guarantees, undisclosed placement percentages, or invented financing terms.
- PDF sections carry an optional `citation` field — when a claim is grounded, the source URL is rendered as a footnote under that section.

## Local setup

```bash
# 1. Install
npm install

# 2. Fill .env.local from .env.local.example
cp .env.local.example .env.local
# Add: GEMINI_API_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, BLOB_READ_WRITE_TOKEN

# 3. Build the RAG corpus (one-time, requires GEMINI_API_KEY)
npm run build-rag

# 4. Dev server
npm run dev
```

Then open `http://localhost:3000`, enter your Twilio-Sandbox-joined WhatsApp number, and create a lead.

## Deploy

```bash
vercel deploy --prod
# Set the same env vars in the Vercel dashboard.
# Enable Vercel Blob on the project — BLOB_READ_WRITE_TOKEN is auto-injected.
```

## Project structure

```
app/
  api/
    settings/route.ts           POST: save BDA WhatsApp number
    personas/route.ts           GET: 3 standard personas
    leads/route.ts              POST: create lead · GET: list
    leads/[id]/route.ts         GET: one lead
    leads/[id]/nudge/route.ts   POST: gen+send pre-call nudge to BDA
    leads/[id]/generate-pdf/route.ts  POST: extract→persona→RAG→PDF→Blob
    leads/[id]/cover/route.ts   PATCH: edit cover message
    leads/[id]/approve/route.ts POST: send PDF+cover to lead WhatsApp
    leads/[id]/skip/route.ts    POST: mark skipped
    transcribe/route.ts         POST: Whisper STT
  page.tsx                      onboarding + dashboard + approval cards

lib/
  agents/
    extract.ts      lead's open questions from transcript
    persona.ts      persona signals + program + accent
    rag.ts          in-memory cosine retriever
    nudge.ts        BDA pre-call brief
    pdf-content.ts  RAG-grounded PDF section content
    cover.ts        WhatsApp cover message
  pdf/render.tsx    @react-pdf/renderer template
  openai.ts         single OpenAI client + model registry
  whatsapp.ts       Twilio text + media send
  blob.ts           Vercel Blob upload
  store.ts          in-memory Map keyed by lead id
  personas.ts       Rohan / Karthik / Meera standard inputs
  types.ts

data/
  scaler-corpus.ts  hand-curated chunks (source: scaler.com)
  scaler-rag.json   embedded chunks (built by `npm run build-rag`)

scripts/
  build-rag.ts      one-time embedding job
```
