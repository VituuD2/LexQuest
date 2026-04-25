import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { getActiveSessionForUser } from "@/lib/server/session-repository";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({
        user: null,
        activeGameSession: null
      });
    }

    const activeGameSession = await getActiveSessionForUser(user.id);

    return NextResponse.json({
      user,
      activeGameSession
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao carregar sessao autenticada.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
