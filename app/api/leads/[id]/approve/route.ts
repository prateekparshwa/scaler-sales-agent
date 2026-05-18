import { NextResponse } from "next/server";
import { getLead, upsertLead } from "@/lib/store";
import { sendMedia } from "@/lib/whatsapp";

export const maxDuration = 30;

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const lead = await getLead(id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
  if (!lead.pdfUrl || !lead.coverMessage) {
    return NextResponse.json(
      { error: "Generate the PDF first before approving." },
      { status: 400 }
    );
  }
  if (!lead.leadPhoneE164) {
    return NextResponse.json(
      { error: "leadPhoneE164 missing on this lead. Add it before sending." },
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
