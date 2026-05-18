import { NextResponse } from "next/server";
import { getLead, upsertLead } from "@/lib/store";
import { Lead } from "@/lib/types";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const body = await req.json();
  const { coverMessage, lead: bodyLead } = body as { coverMessage?: string; lead?: Lead };
  if (typeof coverMessage !== "string" || coverMessage.trim().length === 0) {
    return NextResponse.json({ error: "coverMessage required" }, { status: 400 });
  }
  let lead: Lead | undefined = bodyLead ?? await getLead(id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
  lead.coverMessage = coverMessage;
  await upsertLead(lead);
  return NextResponse.json({ lead });
}
