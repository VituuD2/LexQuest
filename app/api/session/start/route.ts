import { NextResponse } from "next/server";
import { createSession } from "@/lib/server/session-repository";

export const runtime = "nodejs";

export async function POST() {
  const session = createSession();

  return NextResponse.json(session);
}
