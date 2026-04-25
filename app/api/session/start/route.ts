import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { getVisibleGameCatalogEntry } from "@/lib/server/game-catalog";
import { createSession } from "@/lib/server/session-repository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Autenticacao obrigatoria." }, { status: 401 });
    }

    const payload = (await request.json().catch(() => ({}))) as {
      restart?: boolean;
      caseId?: string;
    };
    const game = await getVisibleGameCatalogEntry(typeof payload.caseId === "string" ? payload.caseId : "hc_48h_001", {
      role: user.role
    });

    if (!game) {
      return NextResponse.json({ error: "Jogo nao encontrado." }, { status: 404 });
    }

    const session = await createSession(user.id, {
      restart: payload.restart === true,
      caseId: game.caseId
    });

    return NextResponse.json(session);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao iniciar sessao.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
