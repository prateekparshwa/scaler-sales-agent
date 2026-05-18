import { NextResponse } from "next/server";
import { getLead, upsertLead } from "@/lib/store";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const lead = await getLead(id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
  const { coverMessage } = (await req.json()) as { coverMessage?: string };
  if (typeof coverMessage !== "string" || coverMessage.trim().length === 0) {
    return NextResponse.json({ error: "coverMessage required" }, { status: 400 });
  }
  lead.coverMessage = coverMessage;
  await upsertLead(lead);
  return NextResponse.json({ lead });
}
