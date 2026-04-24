import { NextResponse } from "next/server";
import { applyChoice, getStep } from "@/lib/game-engine";
import { getSessionState, saveChoice } from "@/lib/server/session-repository";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

type ChoicePayload = {
  stepNumber: number;
  choiceKey: string;
  freeText?: string;
  selectedFoundationIds?: string[];
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { sessionId } = await context.params;
    const session = await getSessionState(sessionId);

    if (!session) {
      return NextResponse.json({ error: "Sessao nao encontrada." }, { status: 404 });
    }

    const payload = (await request.json()) as ChoicePayload;
    const step = getStep(payload.stepNumber);

    if (!step) {
      return NextResponse.json({ error: "Etapa nao encontrada." }, { status: 400 });
    }

    const result = applyChoice({
      gameState: session,
      step,
      choiceKey: payload.choiceKey,
      freeText: payload.freeText,
      selectedFoundationIds: payload.selectedFoundationIds
    });

    await saveChoice({
      sessionId,
      nextState: result.nextState,
      feedback: result.feedback,
      stepNumber: step.step_number,
      choiceKey: payload.choiceKey,
      freeText: payload.freeText,
      selectedFoundationIds: payload.selectedFoundationIds
    });

    return NextResponse.json({
      sessionId,
      gameState: result.nextState,
      feedback: result.feedback
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao registrar escolha.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
