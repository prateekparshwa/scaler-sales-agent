import { NextResponse } from "next/server";
import { getLead, upsertLead } from "@/lib/store";
import { Lead } from "@/lib/types";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  let lead: Lead | undefined;
  try {
    const body = await req.json();
    if (body?.lead) lead = body.lead as Lead;
  } catch { /* no body */ }
  if (!lead) lead = await getLead(id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
  lead.status = "skipped";
  await upsertLead(lead);
  return NextResponse.json({ lead });
}
