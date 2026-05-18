import { NextResponse } from "next/server";
import { getLead, upsertLead } from "@/lib/store";
import { extractOpenQuestions } from "@/lib/agents/extract";
import { inferPersona } from "@/lib/agents/persona";
import { generateNudge, formatNudgeForWhatsApp } from "@/lib/agents/nudge";
import { sendText } from "@/lib/whatsapp";

export const maxDuration = 60;

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const lead = await getLead(id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  try {
    const questions = await extractOpenQuestions(lead.profile, lead.transcript || "");
    const persona = await inferPersona(lead.profile, questions, lead.transcript || "");
    const nudge = await generateNudge(lead.profile, lead.transcript || "", questions, persona);

    lead.questions = questions;
    lead.persona = persona;
    lead.nudge = nudge;

    const body = formatNudgeForWhatsApp(nudge, lead.profile.name);
    const sid = await sendText(lead.bdaPhoneE164, body);
    lead.sentMessages = [...(lead.sentMessages ?? []), { kind: "nudge", sid, at: Date.now() }];
    lead.status = "nudge_sent";
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
