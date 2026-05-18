import { NextResponse } from "next/server";
import { getLead, upsertLead } from "@/lib/store";
import { z } from "zod";

const schema = z.object({ transcript: z.string() });

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const lead = await getLead(id);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "transcript string required" }, { status: 400 });

  lead.transcript = parsed.data.transcript;
  await upsertLead(lead);
  return NextResponse.json({ lead });
}
