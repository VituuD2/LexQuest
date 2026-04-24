import { NextResponse } from "next/server";
import { createSession } from "@/lib/server/session-repository";

export const runtime = "nodejs";

export async function POST() {
  try {
    const session = await createSession();

    return NextResponse.json(session);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao iniciar sessao.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
