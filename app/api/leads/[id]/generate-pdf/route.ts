import { NextResponse } from "next/server";
import { getLead, upsertLead } from "@/lib/store";
import { extractOpenQuestions } from "@/lib/agents/extract";
import { inferPersona } from "@/lib/agents/persona";
import { generatePdfContent } from "@/lib/agents/pdf-content";
import { generateCoverMessage } from "@/lib/agents/cover";
import { renderLeadPdf } from "@/lib/pdf/render";
import { uploadPdf } from "@/lib/blob";
import { Lead } from "@/lib/types";

export const maxDuration = 90;

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) { try {
  const { id } = await ctx.params;
  // Client sends the lead in the body to avoid Blob read-after-write lag.
  // Fall back to getLead only if not provided.
  // Receive only the small fields needed — avoids body size issues from
  // sending large pdfContent / transcript in a full lead object.
  let bodyProfile: Lead["profile"] | undefined;
  let bodyTranscript: string | undefined;
  let bodyBdaPhone: string | undefined;
  try {
    const body = await req.json();
    bodyProfile = body.profile;
    bodyTranscript = body.transcript;
    bodyBdaPhone = body.bdaPhoneE164;
  } catch { /* empty body */ }

  let lead: Lead | undefined = await getLead(id);
  if (!lead) {
    // Blob hasn't propagated yet — reconstruct from body if we have enough.
    if (bodyProfile && bodyBdaPhone) {
      lead = {
        id,
        createdAt: Date.now(),
        profile: bodyProfile,
        transcript: bodyTranscript ?? "",
        bdaPhoneE164: bodyBdaPhone,
        status: "created",
      };
    } else {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
  }
  // Patch stale Blob lead with client's current values.
  if (bodyProfile) lead.profile = bodyProfile;
  if (bodyTranscript !== undefined) lead.transcript = bodyTranscript;
  if (bodyBdaPhone) lead.bdaPhoneE164 = bodyBdaPhone;

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
    await upsertLead(lead);

    return NextResponse.json({ lead });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    try { lead.error = msg; await upsertLead(lead); } catch { /* ignore secondary write failure */ }
    return NextResponse.json({ error: msg, lead }, { status: 500 });
  }
  } catch (fatal) {
    return NextResponse.json({ error: String(fatal) }, { status: 500 });
  }
}
