import { NextResponse } from "next/server";
import { createAuthSession } from "@/lib/server/auth";
import { listActiveSessionsForUser } from "@/lib/server/session-repository";
import { authenticateUser } from "@/lib/server/user-repository";

export const runtime = "nodejs";

type LoginPayload = {
  login?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as LoginPayload;
    const login = payload.login?.trim() ?? "";
    const password = payload.password ?? "";

    if (!login || !password) {
      return NextResponse.json({ error: "Informe login e senha." }, { status: 400 });
    }

    const user = await authenticateUser(login, password);

    if (!user) {
      return NextResponse.json({ error: "Credenciais invalidas." }, { status: 401 });
    }

    await createAuthSession(user.id);
    const activeGameSessions = await listActiveSessionsForUser(user.id);
    const activeGameSession = activeGameSessions[0] ?? null;

    return NextResponse.json({
      user,
      activeGameSession,
      activeGameSessions
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao autenticar.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
