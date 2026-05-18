import { NextResponse } from "next/server";
import { getLead, upsertLead } from "@/lib/store";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const lead = await getLead(id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
  lead.status = "skipped";
  await upsertLead(lead);
  return NextResponse.json({ lead });
}
