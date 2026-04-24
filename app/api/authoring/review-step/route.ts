import { NextResponse } from "next/server";
import { isAiEnabled, reviewStepDraft } from "@/lib/server/openai";

export const runtime = "nodejs";

type ReviewPayload = {
  step: unknown;
};

export async function POST(request: Request) {
  try {
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
