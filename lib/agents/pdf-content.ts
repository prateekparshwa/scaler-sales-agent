import { openai, MODELS } from "../openai";
import {
  LeadProfile,
  OpenQuestion,
  PdfContent,
  PersonaSignals,
} from "../types";
import { retrieveMany, formatContext } from "./rag";
import { pickProgram, pickAccentColor } from "./persona";

const SYS = `You write a 2-3 page PERSONALISED PDF that Scaler sends to a lead via WhatsApp after a sales call. The lead has unanswered questions and unspoken anxieties. Your job: build enough trust that they actually take the entrance test (the current biggest drop-off point).

THIS IS NOT A MARKETING BROCHURE. It is a personal note that happens to be a PDF.

CRITICAL CONSTRAINTS:
1. The PDF must address the LEAD'S OWN QUESTIONS (provided below), in their order of importance to the lead. Do NOT add generic FAQ sections they didn't ask about.
2. Every factual claim about Scaler MUST be grounded in the provided Scaler context blocks. If the context doesn't support a claim, write "I'll confirm specifics with your BDA on our next call" — DO NOT FABRICATE numbers, salary deltas, placement percentages, instructor names, or curriculum details.
3. Match the persona's tonePrompt EXACTLY. A senior FAANG engineer gets a peer-to-peer tone. A nervous student gets warmth + parent-addressing. A service-co engineer doing ROI math gets concrete numbers and respect for their math.
4. Do NOT use generic Scaler marketing taglines.
5. Do NOT claim job guarantees or salary guarantees — these are dishonest. Cite the alumni network, hiring partners, and the structural model instead.

PERSONALISATION (this is graded at 30% of the assignment):
- Section ordering must reflect what THIS lead cares about most. A cost-anxious lead → cost section near top. A senior engineer → instructor depth + cohort quality near top.
- Tone must be visibly different from other leads. A reader should be able to tell which persona this PDF was written for from any random paragraph.
- Use the lead's own phrasing where it makes them feel heard ("you asked about X — here's the real answer").
- Reference specific facts from their profile (company, YoE, intent) inside the prose, not just at the top.

OUTPUT: return JSON matching this shape:
{
  "greeting": "<personal greeting line addressing the lead by first name + ONE specific reference to their situation>",
  "hook": "<2-3 sentences that prove this isn't a templated note. Acknowledge what they raised on the call. Make them want to keep reading.>",
  "sections": [
    {
      "title": "<the lead's question rephrased as a heading — NOT 'About Scaler' or 'Curriculum'. Use their phrasing.>",
      "body": "<3-5 sentences answering that question grounded in the context. Concrete, honest, no marketing speak.>",
      "citation": "<the source URL from the context if a factual claim was made, otherwise omit>"
    }
    // one section per lead question. 3-5 sections total. Order: most important to the lead first.
  ],
  "closingNote": "<1-2 sentences. Personal. Not 'we're excited to have you'. Something that earns the next step.>",
  "cta": "<one sentence pushing them toward the entrance test specifically. Tied to their context. NOT 'click here to take the test'.>",
  "programReference": "<the specific Scaler program this PDF anchors on, e.g. 'Scaler Academy' or 'Scaler Data Science & ML'>"
}`;

export async function generatePdfContent(
  profile: LeadProfile,
  transcript: string,
  questions: OpenQuestion[],
  persona: PersonaSignals
): Promise<PdfContent> {
  const program = pickProgram(profile, persona);

  // RAG: retrieve context per question, plus generic program context.
  const queries = [
    ...questions.map((q) => q.question),
    program,
    // Pull in financing + policy chunks as fallback for cost/test questions.
    "cost financing EMI",
    "entrance test calibration",
    "vs free courses Andrew Ng Coursera",
  ];
  const retrieved = await retrieveMany(queries, 2);
  const ctxBlocks: string[] = [];
  const seen = new Set<string>();
  for (const chunks of retrieved) {
    for (const c of chunks) {
      const key = `${c.source}#${c.heading}`;
      if (seen.has(key)) continue;
      seen.add(key);
      ctxBlocks.push(`### ${c.heading}\n${c.text}\n(source: ${c.source})`);
    }
  }
  const context = ctxBlocks.length
    ? ctxBlocks.join("\n\n")
    : "(no Scaler corpus available — refuse to make factual claims; route every question to 'we'll confirm on the next call')";

  const user = `Lead profile:
${JSON.stringify(profile, null, 2)}

Persona signals (USE THIS — especially tonePrompt):
${JSON.stringify(persona, null, 2)}

Anchor program for this lead: ${program}

The lead's open questions (these MUST be the section headings, in order of importance to the lead):
${questions
  .map(
    (q, i) =>
      `${i + 1}. [${q.category}${q.bdaHandledWell ? "" : " — BDA didn't handle well"}] ${q.question}`
  )
  .join("\n")}

Call transcript (for emotional cues / verbatim quotes you can mirror back):
${transcript}

Scaler context blocks (ground ALL factual claims to these — do not invent beyond them):
${context}

Now write the PDF content as JSON.`;

  const res = await openai().chat.completions.create({
    model: MODELS.pdf,
    messages: [
      { role: "system", content: SYS },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const parsed = JSON.parse(res.choices[0].message.content ?? "{}") as PdfContent;
  return {
    ...parsed,
    accentColor: pickAccentColor(persona),
    programReference: parsed.programReference ?? program,
  };
}
