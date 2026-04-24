import { NextResponse } from "next/server";
import type { GameState } from "@/lib/game-types";
import { getSessionState, updateSessionState } from "@/lib/server/session-repository";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { sessionId } = await context.params;
    const session = await getSessionState(sessionId);

    if (!session) {
      return NextResponse.json({ error: "Sessao nao encontrada." }, { status: 404 });
    }

    return NextResponse.json({
      sessionId,
      gameState: session
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao carregar sessao.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { sessionId } = await context.params;
    const payload = (await request.json()) as {
      gameState: GameState;
    };

    await updateSessionState(sessionId, payload.gameState);

    return NextResponse.json({
      sessionId,
      gameState: payload.gameState
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao atualizar sessao.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
