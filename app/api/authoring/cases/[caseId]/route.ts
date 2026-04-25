import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { getCaseAuthoringBundle } from "@/lib/server/authoring-repository";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    caseId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Autenticacao obrigatoria." }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });
    }

    const { caseId } = await context.params;
    const bundle = await getCaseAuthoringBundle(caseId);
    return NextResponse.json(bundle);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao carregar o studio de jogos.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
