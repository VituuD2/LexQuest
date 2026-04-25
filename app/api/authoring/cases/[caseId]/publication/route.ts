import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { getCaseAuthoringBundle, publishCaseDraft, unpublishCase } from "@/lib/server/authoring-repository";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    caseId: string;
  }>;
};

async function requireAdmin() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Autenticacao obrigatoria." }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });
  }

  return null;
}

export async function PUT(_request: Request, context: RouteContext) {
  try {
    const authError = await requireAdmin();

    if (authError) {
      return authError;
    }

    const { caseId } = await context.params;
    await publishCaseDraft(caseId);
    return NextResponse.json(await getCaseAuthoringBundle(caseId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao publicar o jogo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const authError = await requireAdmin();

    if (authError) {
      return authError;
    }

    const { caseId } = await context.params;
    await unpublishCase(caseId);
    return NextResponse.json(await getCaseAuthoringBundle(caseId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao retirar o jogo da home.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
