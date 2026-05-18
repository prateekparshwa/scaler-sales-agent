import { NextResponse } from "next/server";
import { settings } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ bdaPhoneE164: settings.bdaPhoneE164 ?? null });
}

export async function POST(req: Request) {
  const { bdaPhoneE164 } = (await req.json()) as { bdaPhoneE164?: string };
  if (!bdaPhoneE164 || !/^\+\d{8,15}$/.test(bdaPhoneE164)) {
    return NextResponse.json(
      { error: "bdaPhoneE164 must be E.164 format, e.g. +14155551234" },
      { status: 400 }
    );
  }
  settings.bdaPhoneE164 = bdaPhoneE164;
  return NextResponse.json({ ok: true, bdaPhoneE164 });
}
