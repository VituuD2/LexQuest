import { NextResponse } from "next/server";
import { applyChoice, getStep } from "@/lib/game-engine";
import { reviewStepChoice, isAiEnabled } from "@/lib/server/openai";
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

    let aiMessage:
      | {
          role: string;
          content: string;
          metadata?: Record<string, unknown>;
        }
      | undefined;

    if (isAiEnabled()) {
      try {
        const aiReview = await reviewStepChoice({
          prompt: step.ai_prompt_override ?? "Avalie a decisao do doutor nesta etapa.",
          context: {
            step: {
              step_number: step.step_number,
              title: step.title,
              question: step.question,
              objective: step.objective
            },
            choice: payload.choiceKey,
            selected_foundations: payload.selectedFoundationIds ?? [],
            free_text: payload.freeText ?? null,
            current_feedback: result.feedback,
            current_scores: result.nextState
          }
        });

        result.feedback = {
          ...result.feedback,
          narrative: aiReview.narrative || result.feedback.narrative,
          aiFeedback: aiReview.feedback,
          aiRewriteSuggestion: aiReview.rewriteSuggestion ?? undefined,
          aiScore: aiReview.score ?? undefined,
          aiStatus: "completed",
          aiStatusDetail: "Feedback do gpt-4.1-mini recebido com sucesso."
        };

        aiMessage = {
          role: "assistant",
          content: JSON.stringify(aiReview),
          metadata: {
            source: "step-review",
            model: "gpt-4.1-mini",
            stepNumber: step.step_number
          }
        };
      } catch (error) {
        const detail =
          error instanceof Error
            ? error.message.slice(0, 220)
            : "Falha desconhecida ao chamar o modelo.";

        result.feedback = {
          ...result.feedback,
          aiStatus: "failed",
          aiStatusDetail: `Falha ao chamar o modelo: ${detail}`
        };
      }
    } else {
      result.feedback = {
        ...result.feedback,
        aiStatus: "skipped",
        aiStatusDetail: "IA desabilitada no servidor. Configure OPENAI_API_KEY na Vercel ou no .env local."
      };
    }

    await saveChoice({
      sessionId,
      nextState: result.nextState,
      feedback: result.feedback,
      stepNumber: step.step_number,
      choiceKey: payload.choiceKey,
      freeText: payload.freeText,
      selectedFoundationIds: payload.selectedFoundationIds,
      aiMessage
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
