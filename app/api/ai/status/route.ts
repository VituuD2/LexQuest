import { NextResponse } from "next/server";
import { getAiRuntimeStatus } from "@/lib/server/openai";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getAiRuntimeStatus());
}
