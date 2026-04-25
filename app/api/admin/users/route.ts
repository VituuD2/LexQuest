import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { listUsersForAdmin } from "@/lib/server/user-repository";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Autenticacao obrigatoria." }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });
    }

    const users = await listUsersForAdmin();
    return NextResponse.json({ users });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao listar usuarios.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
