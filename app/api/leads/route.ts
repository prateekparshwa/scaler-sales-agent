import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getSettings, listLeads, upsertLead, clearLeads } from "@/lib/store";
import { Lead, LeadProfile } from "@/lib/types";

const profileSchema = z.object({
  name: z.string().min(1),
  role: z.string().optional(),
  company: z.string().optional(),
  yoe: z.number().int().min(0).max(60).optional(),
  intent: z.string().optional(),
  linkedinSummary: z.string().optional(),
});

const createSchema = z.object({
  profile: profileSchema,
  transcript: z.string().default(""),
  leadPhoneE164: z
    .string()
    .regex(/^\+\d{8,15}$/, "Lead phone must be E.164 (e.g. +14155551234)")
    .optional(),
});

export async function GET() {
  const leads = await listLeads();
  return NextResponse.json({ leads });
}

export async function DELETE() {
  await clearLeads();
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 }
    );
  }
  const settings = await getSettings();
  if (!settings.bdaPhoneE164) {
    return NextResponse.json(
      { error: "Set the BDA WhatsApp number on the onboarding screen first." },
      { status: 400 }
    );
  }

  const lead: Lead = {
    id: nanoid(10),
    createdAt: Date.now(),
    profile: parsed.data.profile as LeadProfile,
    transcript: parsed.data.transcript,
    leadPhoneE164: parsed.data.leadPhoneE164,
    bdaPhoneE164: settings.bdaPhoneE164,
    status: "created",
  };
  await upsertLead(lead);
  return NextResponse.json({ lead });
}
