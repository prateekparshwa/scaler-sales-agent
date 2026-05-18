import { NextResponse } from "next/server";
import { getLead, upsertLead } from "@/lib/store";
import { extractOpenQuestions } from "@/lib/agents/extract";
import { inferPersona } from "@/lib/agents/persona";
import { generateNudge, formatNudgeForWhatsApp } from "@/lib/agents/nudge";
import { sendText } from "@/lib/whatsapp";
import { Lead } from "@/lib/types";

export const maxDuration = 60;

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
    try { lead.error = msg; await upsertLead(lead); } catch { /* ignore secondary write failure */ }
    return NextResponse.json({ error: msg, lead }, { status: 500 });
  }
  } catch (fatal) {
    // Top-level guard: ensures a JSON response even on completely unhandled crashes.
    return NextResponse.json({ error: String(fatal) }, { status: 500 });
  }
}
