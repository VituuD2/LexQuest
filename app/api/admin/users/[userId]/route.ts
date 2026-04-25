import { NextResponse } from "next/server";
import type { UserRole } from "@/lib/auth-types";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { updateUserRole } from "@/lib/server/user-repository";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

type UpdateUserPayload = {
  role?: UserRole;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Autenticacao obrigatoria." }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });
    }

    const { userId } = await context.params;
    const payload = (await request.json()) as UpdateUserPayload;

    if (payload.role !== "admin" && payload.role !== "user") {
      return NextResponse.json({ error: "Permissao invalida." }, { status: 400 });
    }

    const updatedUser = await updateUserRole({
      userId,
      role: payload.role
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao atualizar permissao do usuario.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
