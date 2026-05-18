import { openai, MODELS } from "../openai";
import { LeadProfile, PdfContent, PersonaSignals } from "../types";

const SYS = `You write the SHORT WHATSAPP COVER MESSAGE that accompanies a personalised PDF being sent to a Scaler lead after a sales call.

CONSTRAINTS:
- 3-5 short lines, WhatsApp-native. Plain text, no markdown headers, no emojis unless the tone calls for one.
- Address the lead by first name.
- Reference ONE specific thing from the call (their actual question or situation) so it doesn't feel templated.
- The tone must match the persona's tonePrompt.
- End with a clear, persona-tuned line nudging them to open the PDF.
- Do NOT mention the entrance test in the cover (that's inside the PDF's CTA).
- Do NOT use Scaler marketing language.

OUTPUT: return JSON: { "message": "<the cover message>" }`;

export async function generateCoverMessage(
  profile: LeadProfile,
  persona: PersonaSignals,
  pdfContent: PdfContent
): Promise<string> {
  const user = `Lead: ${profile.name} (${profile.role ?? ""} at ${profile.company ?? ""})
Persona tone: ${persona.tonePrompt}
Emotional cues from the call: ${(persona.emotionalCues ?? []).join("; ")}
PDF hook (for reference, do not repeat verbatim): ${pdfContent.hook}

Write the cover message.`;

  const res = await openai().chat.completions.create({
    model: MODELS.fast,
    messages: [
      { role: "system", content: SYS },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    temperature: 0.6,
  });

  const parsed = JSON.parse(res.choices[0].message.content ?? "{}") as { message?: string };
  return parsed.message ?? `Hi ${profile.name.split(" ")[0]}, sending across the note we discussed — would mean a lot if you give it a read.`;
}
