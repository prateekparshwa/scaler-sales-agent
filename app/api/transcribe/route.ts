import { NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/gemini";

export const maxDuration = 90;

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("audio");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "audio file required" }, { status: 400 });
  }

  try {
    const bytes = await file.arrayBuffer();
    const transcript = await transcribeAudio(
      bytes,
      file.type || "audio/mpeg"
    );
    return NextResponse.json({ transcript });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
