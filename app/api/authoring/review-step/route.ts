import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { isAiEnabled, reviewStepDraft } from "@/lib/server/openai";

export const runtime = "nodejs";

type ReviewPayload = {
  step: unknown;
};

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Autenticacao obrigatoria." }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });
    }

    if (!isAiEnabled()) {
      return NextResponse.json({ error: "OPENAI_API_KEY nao configurada no servidor." }, { status: 503 });
    }

    const payload = (await request.json()) as ReviewPayload;
    const review = await reviewStepDraft({
      prompt:
        "Revise esta etapa do LexQuest como simulacao juridica profissional. Aponte forcas, riscos e melhorias de forma pratica para o criador.",
      step: payload.step
    });

    return NextResponse.json(review);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao revisar etapa com IA.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
