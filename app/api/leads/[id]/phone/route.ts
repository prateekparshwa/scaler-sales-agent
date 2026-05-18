import { NextResponse } from "next/server";
import { getLead, upsertLead } from "@/lib/store";
import { Lead } from "@/lib/types";
import { z } from "zod";

const schema = z.object({
  leadPhoneE164: z.string().regex(/^\+\d{8,15}$/, "Must be E.164 e.g. +14155551234"),
  lead: z.any().optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  // Use lead from body so we don't overwrite pdfContent/pdfUrl with a stale Blob read.
  const lead: Lead = parsed.data.lead ?? await getLead(id);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  lead.leadPhoneE164 = parsed.data.leadPhoneE164;
  await upsertLead(lead);
  return NextResponse.json({ lead });
}
