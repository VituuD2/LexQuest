import { NextResponse } from "next/server";
import { destroyCurrentAuthSession } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function POST() {
  try {
    await destroyCurrentAuthSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao encerrar sessao.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
