import { openai, MODELS } from "../openai";
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
  "openingHook": "<≤140 chars. Persona-tuned. NOT 'Hi this is X from Scaler'.>",
  "inferredVsFact": "<≤130 chars. Example: 'FACT: 4yrs TCS, AWS cert. INFERRED: cost-skeptic.'>"
}

ANTI-PATTERNS to avoid:
- Generic "this lead seems interested in AI" — be specific to THIS lead's situation.
- Bullet lists of program features — the BDA already knows the program.
- Hyping the lead ("great profile!") — useless for the BDA.
- Confident claims about anything not in the profile/transcript.`;

export async function generateNudge(
  profile: LeadProfile,
  transcript: string,
  questions: OpenQuestion[],
  persona: PersonaSignals
): Promise<Nudge> {
  const user = `Lead profile: ${JSON.stringify(profile, null, 2)}

Persona signals derived:
${JSON.stringify(persona, null, 2)}

Their open questions from the prior call (or pre-call intent if no call yet):
${questions.map((q, i) => `${i + 1}. ${q.question}`).join("\n") || "(none yet — this is a pre-call nudge before the first call)"}

Transcript (if any):
${transcript || "(no call yet)"}

Now write the BDA nudge.`;

  const res = await openai().chat.completions.create({
    model: MODELS.fast,
    messages: [
      { role: "system", content: SYS },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    temperature: 0.6,
  });

  return JSON.parse(res.choices[0].message.content ?? "{}") as Nudge;
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
