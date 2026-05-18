import { openai, MODELS } from "../openai";
import { LeadProfile, Nudge, OpenQuestion, PersonaSignals } from "../types";

const SYS = `You are writing a PRE-CALL WHATSAPP NUDGE for a Scaler BDA (Business Development Associate). They are about to dial this lead in 2 minutes and are reading this on their phone.

GOAL: make the first 30 seconds of the call NOT sound generic. The BDA should walk in knowing who this person is, what to lead with, what objections to expect, and how to open.

VOICE:
- Like a teammate's message to another teammate. Not a corporate memo.
- Direct, scannable, no fluff. Headings + bullets, not paragraphs.
- Use the lead's first name. Use plain English.
- Mark "inferred" vs "fact" honestly — never present a guess as fact.

OUTPUT: return JSON matching this exact shape:
{
  "oneLiner": "<one tight line that captures who the lead is and the core thing to know>",
  "whoTheyAre": "<2-3 sentences in plain English. Who, where, what they care about. Reference their actual profile facts.>",
  "persona": "<the archetype label, e.g. 'TCS engineer doing ROI math on a switch' — short>",
  "angles": [
    {"angle": "<short title of the angle>", "why": "<one line: WHY this angle resonates for THIS lead, tied to something real about them>"}
    // 2-3 angles, persona-specific. Not generic.
  ],
  "objections": [
    {"objection": "<the objection in lead's likely phrasing>", "handle": "<one-line handle the BDA can use>"}
    // 2-3 objections. The handles must be honest — no fabricated guarantees.
  ],
  "openingHook": "<one suggested opening line for the call, ≤25 words, persona-tuned. NOT 'Hi this is X from Scaler' — something that earns the next 30 seconds>",
  "inferredVsFact": "<one line listing what's inferred from sparse data vs what's verified from the profile. Example: 'FACT: 4yrs TCS, AWS cert. INFERRED: cost-skeptic given his Coursera comparison framing.'>"
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

  return `*PRE-CALL: ${leadName}* 🧠

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
}
