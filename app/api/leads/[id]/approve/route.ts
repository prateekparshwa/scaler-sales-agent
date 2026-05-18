import { NextResponse } from "next/server";
import { getLead, upsertLead } from "@/lib/store";
import { sendMedia } from "@/lib/whatsapp";

export const maxDuration = 30;

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  // Client sends only the small fields it knows are current — avoids sending
  // the full lead (which includes large pdfContent / transcript) and lets us
  // patch a stale Blob lead with the correct values.
  let bodyPdfUrl: string | undefined;
  let bodyCoverMessage: string | undefined;
  let bodyPhone: string | undefined;
  try {
    const body = await req.json();
    bodyPdfUrl = body.pdfUrl;
    bodyCoverMessage = body.coverMessage;
    bodyPhone = body.leadPhoneE164;
  } catch { /* empty body fallback */ }

  const lead = await getLead(id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  // Patch with client values — the Blob copy may be stale.
  if (bodyPdfUrl) lead.pdfUrl = bodyPdfUrl;
  if (bodyCoverMessage) lead.coverMessage = bodyCoverMessage;
  if (bodyPhone) lead.leadPhoneE164 = bodyPhone;

  if (!lead.pdfUrl || !lead.coverMessage) {
    return NextResponse.json(
      { error: "Generate the PDF first before approving." },
      { status: 400 }
    );
  }
  if (!lead.leadPhoneE164) {
    return NextResponse.json(
      { error: "Please add the lead's WhatsApp number before sending." },
      { status: 400 }
    );
  }

  try {
    const sid = await sendMedia(lead.leadPhoneE164, lead.coverMessage, lead.pdfUrl);
    lead.sentMessages = [...(lead.sentMessages ?? []), { kind: "pdf", sid, at: Date.now() }];
    lead.status = "approved_sent";
    lead.error = undefined;
    await upsertLead(lead);
    return NextResponse.json({ lead, sid });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    lead.error = msg;
    await upsertLead(lead);
    return NextResponse.json({ error: msg, lead }, { status: 500 });
  }
}
