import { NextResponse } from "next/server";
import { getLead, upsertLead } from "@/lib/store";
import { extractOpenQuestions } from "@/lib/agents/extract";
import { inferPersona } from "@/lib/agents/persona";
import { generatePdfContent } from "@/lib/agents/pdf-content";
import { generateCoverMessage } from "@/lib/agents/cover";
import { renderLeadPdf } from "@/lib/pdf/render";
import { uploadPdf } from "@/lib/blob";

export const maxDuration = 90;

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const lead = getLead(id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  try {
    const questions =
      lead.questions ?? (await extractOpenQuestions(lead.profile, lead.transcript || ""));
    const persona =
      lead.persona ?? (await inferPersona(lead.profile, questions, lead.transcript || ""));

    const content = await generatePdfContent(lead.profile, lead.transcript || "", questions, persona);
    const cover = await generateCoverMessage(lead.profile, persona, content);

    const buf = await renderLeadPdf(lead.profile, content);
    const safeName = lead.profile.name.replace(/[^\w]+/g, "-").toLowerCase();
    const filename = `scaler-note-${safeName}-${lead.id}.pdf`;
    const url = await uploadPdf(filename, buf);

    lead.questions = questions;
    lead.persona = persona;
    lead.pdfContent = content;
    lead.coverMessage = cover;
    lead.pdfUrl = url;
    lead.pdfFilename = filename;
    lead.status = "pdf_drafted";
    lead.error = undefined;
    upsertLead(lead);

    return NextResponse.json({ lead });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    lead.error = msg;
    upsertLead(lead);
    return NextResponse.json({ error: msg, lead }, { status: 500 });
  }
}
