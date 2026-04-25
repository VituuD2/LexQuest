import { NextResponse } from "next/server";
import { createAuthSession } from "@/lib/server/auth";
import { getActiveSessionForUser } from "@/lib/server/session-repository";
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
    const activeGameSession = await getActiveSessionForUser(user.id);

    return NextResponse.json({
      user,
      activeGameSession
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao autenticar.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
