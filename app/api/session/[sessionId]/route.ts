import { NextResponse } from "next/server";
import { getSessionState } from "@/lib/server/session-repository";

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
