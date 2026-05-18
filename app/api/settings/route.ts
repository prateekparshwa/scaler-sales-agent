import { NextResponse } from "next/server";
import { getSettings, setSettings } from "@/lib/store";

export async function GET() {
  const s = await getSettings();
  return NextResponse.json({ bdaPhoneE164: s.bdaPhoneE164 ?? null });
}

export async function POST(req: Request) {
  const { bdaPhoneE164 } = (await req.json()) as { bdaPhoneE164?: string };
  if (!bdaPhoneE164 || !/^\+\d{8,15}$/.test(bdaPhoneE164)) {
    return NextResponse.json(
      { error: "bdaPhoneE164 must be E.164 format, e.g. +14155551234" },
      { status: 400 }
    );
  }
  const next = await setSettings({ bdaPhoneE164 });
  return NextResponse.json({ ok: true, bdaPhoneE164: next.bdaPhoneE164 });
}
