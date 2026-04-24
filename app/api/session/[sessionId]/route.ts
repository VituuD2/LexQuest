import { NextResponse } from "next/server";
import { getSessionState } from "@/lib/server/session-repository";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { sessionId } = await context.params;
  const session = getSessionState(sessionId);

  if (!session) {
    return NextResponse.json({ error: "Sessao nao encontrada." }, { status: 404 });
  }

  return NextResponse.json({
    sessionId,
    gameState: session
  });
}
