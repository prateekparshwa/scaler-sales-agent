import { NextResponse } from "next/server";
import { STANDARD_PERSONAS } from "@/lib/personas";

export async function GET() {
  return NextResponse.json({ personas: STANDARD_PERSONAS });
}
