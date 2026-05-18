import { openai, MODELS, withRetry } from "../openai";
import { LeadProfile, Nudge, OpenQuestion, PersonaSignals } from "../types";

const SYS = `You are writing a PRE-CALL WHATSAPP NUDGE for a Scaler BDA (Business Development Associate). They are about to dial this lead in 2 minutes and are reading this on their phone.

GOAL: make the first 30 seconds of the call NOT sound generic. The BDA should walk in knowing who this person is, what to lead with, what objections to expect, and how to open.

VOICE:
- Like a teammate's message to another teammate. Not a corporate memo.
- Direct, scannable, no fluff. Headings + bullets, not paragraphs.
- Use the lead's first name. Use plain English.
- Mark "inferred" vs "fact" honestly — never present a guess as fact.

HARD LENGTH BUDGET: the entire formatted message must fit under 1500 characters on WhatsApp. Keep every field TIGHT.

OUTPUT: return JSON matching this exact shape (respect the char caps STRICTLY):
{
  "oneLiner": "<≤120 chars. The core thing to know.>",
  "whoTheyAre": "<≤200 chars. Plain English. Reference their actual profile facts.>",
  "persona": "<≤60 chars. Archetype label.>",
  "angles": [
    {"angle": "<≤40 chars>", "why": "<≤90 chars: why this resonates for THIS lead>"}
    // exactly 3 angles
  ],
  "objections": [
    {"objection": "<≤60 chars: the lead's likely phrasing>", "handle": "<≤90 chars: one-line honest handle>"}
    // exactly 2 objections
  ],
  "openingHook": "<≤140 chars. Persona-tuned. NOT 'Hi this is X from Scaler'. If NO prior call: open as first contact, never imply a previous conversation. If prior call exists: may reference specifics from that call.>",
  "inferredVsFact": "<≤130 chars. Example: 'FACT: 4yrs TCS, AWS cert. INFERRED: cost-skeptic.'>"
}

ANTI-PATTERNS to avoid:
- Generic "this lead seems interested in AI" — be specific to THIS lead's situation.
- Bullet lists of program features — the BDA already knows the program.
- Hyping the lead ("great profile!") — useless for the BDA.
- Confident claims about anything not in the profile/transcript.
- "based on our last chat / our conversation / when we spoke" — if there is no prior call transcript, this is a FRESH INBOUND LEAD. Do NOT fabricate a prior conversation. The openingHook must frame this as the FIRST contact (e.g. "Hi Priya, I've been looking at your profile and wanted to open with..."), never as a follow-up.`;

export async function generateNudge(
  profile: LeadProfile,
  transcript: string,
  questions: OpenQuestion[],
  persona: PersonaSignals
): Promise<Nudge> {
  const hasTranscript = transcript.trim().length > 0;

  const user = `Lead profile: ${JSON.stringify(profile, null, 2)}

Persona signals derived:
${JSON.stringify(persona, null, 2)}

CALL HISTORY: ${hasTranscript
    ? "There IS a prior call transcript below. The BDA has already spoken to this lead."
    : "NO PRIOR CALL HAS HAPPENED. This is a COLD FIRST CALL from the marketing team. The BDA has NEVER spoken to this lead before. The openingHook MUST NOT imply any prior conversation, chat, or contact — doing so would be a factual lie. Frame it as a first introduction only."}

${hasTranscript
    ? `Questions the lead raised on the call:\n${questions.map((q, i) => `${i + 1}. ${q.question}`).join("\n")}`
    : `Inferred questions based on their profile (no call yet):\n${questions.map((q, i) => `${i + 1}. ${q.question}`).join("\n") || "(none inferred)"}`}

Transcript:
${transcript || "(no call has taken place)"}

Now write the BDA nudge.`;

  const res = await withRetry(
    () =>
      openai().chat.completions.create({
        model: MODELS.fast,
        messages: [
          { role: "system", content: SYS },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
      }),
    "nudge"
  );

  const parsed = JSON.parse(res.choices[0].message.content ?? "{}") as Nudge;

  // Hard guard: if the model still generated a follow-up hook on a fresh lead,
  // override it deterministically. Instruction-following alone is unreliable here.
  if (!hasTranscript && parsed.openingHook) {
    const followUpPattern = /\b(last|previous|our chat|our call|our conversation|we spoke|you mentioned|picking up|following up|follow-up|as discussed|from our|from the call)\b/i;
    if (followUpPattern.test(parsed.openingHook)) {
      const firstName = profile.name.split(" ")[0];
      const yoeStr = profile.yoe != null ? `${profile.yoe} yr` : "";
      const roleStr = profile.role ?? "your background";
      const companyStr = profile.company ? ` at ${profile.company}` : "";
      parsed.openingHook = `Hi ${firstName}, ${yoeStr} ${roleStr}${companyStr} — I want to open on what matters specifically for your situation, not a generic pitch.`.slice(0, 140);
    }
  }

  return parsed;
}

export function formatNudgeForWhatsApp(n: Nudge, leadName: string): string {
  const angles = n.angles
    .map((a, i) => `${i + 1}. *${a.angle}* — ${a.why}`)
    .join("\n");
  const objections = n.objections
    .map((o) => `• "${o.objection}"\n   → ${o.handle}`)
    .join("\n");

  const body = `*PRE-CALL: ${leadName}* 🧠

${n.oneLiner}

*Who they are*
${n.whoTheyAre}

*Persona*: ${n.persona}

*Angles to lead with*
${angles}

*Objections likely*
${objections}

*Open with*
"${n.openingHook}"

_${n.inferredVsFact}_`;

  // Twilio WhatsApp caps a single message at 1600 chars.
  // Safety net in case the LLM ignored the prompt's length budget.
  return body.length <= 1500 ? body : body.slice(0, 1497) + "...";
}
