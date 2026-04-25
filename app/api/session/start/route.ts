import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server/auth";
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
      startStep?: number;
    };
    const session = await createSession(user.id, {
      restart: payload.restart === true,
      startStep: typeof payload.startStep === "number" ? payload.startStep : 1
    });

    return NextResponse.json(session);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao iniciar sessao.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
