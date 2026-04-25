import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { listActiveSessionsForUser } from "@/lib/server/session-repository";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({
        user: null,
        activeGameSession: null,
        activeGameSessions: []
      });
    }

    const activeGameSessions = await listActiveSessionsForUser(user.id);
    const activeGameSession = activeGameSessions[0] ?? null;

    return NextResponse.json({
      user,
      activeGameSession,
      activeGameSessions
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao carregar sessao autenticada.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
