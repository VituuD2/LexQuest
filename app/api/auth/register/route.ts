import { NextResponse } from "next/server";
import { createAuthSession } from "@/lib/server/auth";
import { buildAuthSessionPayload } from "@/lib/server/auth-session";
import { registerUser } from "@/lib/server/user-repository";

export const runtime = "nodejs";

type RegisterPayload = {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

function validateRegisterPayload(payload: RegisterPayload) {
  const username = payload.username?.trim() ?? "";
  const email = payload.email?.trim() ?? "";
  const password = payload.password ?? "";
  const confirmPassword = payload.confirmPassword ?? "";

  if (username.length < 3) {
    throw new Error("O username precisa ter pelo menos 3 caracteres.");
  }

  if (!/^[A-Za-z0-9_.-]+$/.test(username)) {
    throw new Error("Use apenas letras, numeros, ponto, hifen ou underscore no username.");
  }

  if (!email.includes("@")) {
    throw new Error("Informe um email valido.");
  }

  if (password.length < 8) {
    throw new Error("A senha precisa ter pelo menos 8 caracteres.");
  }

  if (password !== confirmPassword) {
    throw new Error("A confirmacao de senha nao confere.");
  }

  return {
    username,
    email,
    password
  };
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as RegisterPayload;
    const parsed = validateRegisterPayload(payload);
    const user = await registerUser(parsed);
    await createAuthSession(user.id);
    return NextResponse.json(await buildAuthSessionPayload(user));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao criar conta.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
