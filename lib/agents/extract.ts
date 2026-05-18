import { openai, MODELS, withRetry } from "../openai";
import { LeadProfile, OpenQuestion } from "../types";

export async function extractOpenQuestions(
  profile: LeadProfile,
  transcript: string
): Promise<OpenQuestion[]> {
  const sys = `You extract the lead's UNANSWERED or UNDER-ANSWERED questions from a sales call transcript.

Rules:
- Return ONLY questions the LEAD asked (not the BDA). The lead's questions are the ones to address in the post-call PDF.
- A question counts as "under-answered" if the BDA gave a vague non-answer like "we'll cover everything you need" or "let me get back to you" or "we have data, I'll share".
- Preserve the lead's own phrasing where possible — the PDF will mirror it back to them.
- Categorise each: curriculum | outcomes | cost | fit | logistics | trust | other.
- Set bdaHandledWell=false when the BDA's response was a deflection or empty assurance.
- Return as JSON: {"questions": [{"question": "...", "category": "...", "bdaHandledWell": true|false}]}`;

  const user = `Lead profile: ${JSON.stringify(profile)}\n\nTranscript:\n${transcript}`;

  const res = await withRetry(
    () =>
      openai().chat.completions.create({
        model: MODELS.fast,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    "extract"
  );

  const raw = res.choices[0].message.content ?? "{}";
  const parsed = JSON.parse(raw) as { questions?: OpenQuestion[] };
  return parsed.questions ?? [];
}
