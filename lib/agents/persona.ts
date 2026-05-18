import { openai, MODELS } from "../openai";
import { LeadProfile, OpenQuestion, PersonaSignals } from "../types";

const SYS = `You read a lead profile + their unanswered questions from a Scaler sales call and derive persona signals.

Return JSON with this exact shape:
{
  "seniority": "student" | "junior" | "mid" | "senior" | "principal",
  "companyTier": "tier1_product" | "tier2_product" | "service" | "none",
  "intentVerb": "switch" | "explore" | "need_job" | "return_to_work",
  "archetype": "<one-line description, e.g. 'Service-co engineer doing ROI math on a career switch'>",
  "tonePrompt": "<one paragraph (≤80 words) describing the tone the PDF MUST adopt for THIS specific lead — not a generic style. Examples: 'Peer-to-peer, technical. Skip pleasantries. Concede what they could learn elsewhere before claiming what they couldn't.' or 'Warm and direct. Address her parents in one section. Foreground financing and test-anxiety reassurance before anything else.'>",
  "emotionalCues": ["short phrases captured from the transcript, e.g. 'I can read the papers', 'parents will ask me to take the safe option'"],
  "primaryConcerns": ["the 2-3 things this lead REALLY wants to know — not the surface questions, the underlying anxiety or evaluation criterion"]
}

Calibration tips:
- "tier1_product": FAANG, top AI labs, top fintech (Stripe, Razorpay), Google, Meta, Amazon, Microsoft, Apple, Netflix, OpenAI, Anthropic.
- "tier2_product": product startups, mid-tier product companies.
- "service": TCS, Infosys, Wipro, Accenture, Cognizant, Capgemini, HCL, similar.
- "none": student, unemployed, freelancer.
- "intentVerb": "switch" (currently employed, wants different employer/role), "explore" (curious/comparing, low urgency), "need_job" (urgent, no current role), "return_to_work" (career break).
- The tonePrompt MUST be persona-specific. Two leads with different archetypes should get measurably different tonePrompts.
- emotionalCues should be near-verbatim quotes from the transcript when possible.`;

export async function inferPersona(
  profile: LeadProfile,
  questions: OpenQuestion[],
  transcript: string
): Promise<PersonaSignals> {
  const user = `Lead profile: ${JSON.stringify(profile)}

Their open questions:
${questions.map((q, i) => `${i + 1}. (${q.category}) ${q.question}`).join("\n")}

Transcript (verbatim, for emotional cues):
${transcript}`;

  const res = await openai().chat.completions.create({
    model: MODELS.fast,
    messages: [
      { role: "system", content: SYS },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  return JSON.parse(res.choices[0].message.content ?? "{}") as PersonaSignals;
}

// Map persona to the Scaler program the PDF should anchor on.
export function pickProgram(profile: LeadProfile, persona: PersonaSignals): string {
  const intent = (profile.intent ?? "").toLowerCase();
  if (
    intent.includes("ai engineer") ||
    intent.includes("llm") ||
    intent.includes("ml ") ||
    intent.includes("data science") ||
    intent.includes("ai/ml")
  ) {
    return "Scaler Data Science & ML (with AI specialisation)";
  }
  if (intent.includes("devops") || intent.includes("cloud") || intent.includes("sre")) {
    return "Scaler DevOps, Cloud & AI Platform Engineering";
  }
  // Default to Academy for SWE switches and students.
  return "Scaler Academy (Modern Software & AI Engineering)";
}

// Persona-conditioned accent colours used by the PDF renderer.
export function pickAccentColor(persona: PersonaSignals): string {
  switch (persona.intentVerb) {
    case "explore":
      return "#0F172A"; // deep slate — restrained, peer tone
    case "switch":
      return "#0EA5E9"; // sky — momentum / forward motion
    case "need_job":
      return "#16A34A"; // green — reassurance / hope
    case "return_to_work":
      return "#A855F7"; // purple — distinct
    default:
      return "#0EA5E9";
  }
}
