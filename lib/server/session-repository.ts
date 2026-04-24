import "server-only";
import { ensureGameStateDefaults, getFoundationDelta, getInitialGameState, getStep } from "@/lib/game-engine";
import type { FeedbackState, GameState } from "@/lib/game-types";
import { getSupabaseAdminClient } from "@/lib/server/supabase";

type SessionRow = {
  id: string;
  state: GameState;
};

export async function createSession() {
  const supabase = getSupabaseAdminClient();
  const initialState = getInitialGameState();

  const { data, error } = await supabase
    .from("player_sessions")
    .insert({
      case_id: initialState.case_id,
      current_step: initialState.current_step,
      legalidade: initialState.legalidade,
      estrategia: initialState.estrategia,
      etica: initialState.etica,
      state: initialState,
      status: "in_progress"
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create session: ${error?.message ?? "unknown error"}`);
  }

  return {
    sessionId: data.id,
    gameState: initialState
  };
}

export async function getSessionState(sessionId: string): Promise<GameState | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("player_sessions").select("id, state").eq("id", sessionId).maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch session: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const row = data as SessionRow;
  return ensureGameStateDefaults(row.state);
}

export async function saveChoice(params: {
  sessionId: string;
  nextState: GameState;
  feedback: FeedbackState;
  stepNumber: number;
  choiceKey: string;
  freeText?: string;
  selectedFoundationIds?: string[];
  aiMessage?: {
    role: string;
    content: string;
    metadata?: Record<string, unknown>;
  };
}) {
  const { sessionId, nextState, feedback, stepNumber, choiceKey, freeText, selectedFoundationIds = [], aiMessage } = params;
  const supabase = getSupabaseAdminClient();
  const step = getStep(stepNumber);
  const option = step?.options.find((item) => item.key === choiceKey);
  const foundationDelta = getFoundationDelta(selectedFoundationIds);
  const selectedFoundations = feedback.selectedFoundations ?? [];
  const isFinished = nextState.current_step >= 6;
  const finalAverage = isFinished
    ? Math.round((nextState.legalidade + nextState.estrategia + nextState.etica) / 3)
    : null;

  const { error: choiceError } = await supabase.from("player_choices").insert({
    session_id: sessionId,
    step_id: step?.id ?? null,
    step_number: stepNumber,
    choice_key: choiceKey,
    choice_label: option?.label ?? (choiceKey === "FREE_TEXT" ? "Minuta liminar" : choiceKey),
    free_text_argument: freeText ?? null,
    selected_foundations: selectedFoundations,
    score_legalidade: feedback.scoreDelta.legalidade,
    score_estrategia: feedback.scoreDelta.estrategia,
    score_etica: feedback.scoreDelta.etica,
    foundation_score_legalidade: foundationDelta.legalidade,
    foundation_score_estrategia: foundationDelta.estrategia,
    foundation_score_etica: foundationDelta.etica,
    feedback: feedback.juridicalFeedback,
    consequence: feedback.consequence ?? null,
    ai_evaluation:
      feedback.aiFeedback || feedback.aiRewriteSuggestion || feedback.aiScore !== undefined
        ? {
            aiFeedback: feedback.aiFeedback ?? null,
            aiRewriteSuggestion: feedback.aiRewriteSuggestion ?? null,
            aiScore: feedback.aiScore ?? null
          }
        : {},
    ai_feedback: feedback.aiFeedback ?? null,
    ai_score: feedback.aiScore ?? null,
    ai_rewrite_suggestion: feedback.aiRewriteSuggestion ?? null,
    ai_provider: feedback.aiStatus === "completed" ? "openai" : null,
    ai_model: feedback.aiStatus === "completed" ? "gpt-4.1-mini" : null,
    ai_status: feedback.aiStatus ?? "skipped"
  });

  if (choiceError) {
    throw new Error(`Failed to save choice: ${choiceError.message}`);
  }

  if (aiMessage) {
    const { error: aiMessageError } = await supabase.from("ai_messages").insert({
      session_id: sessionId,
      role: aiMessage.role,
      content: aiMessage.content,
      metadata: aiMessage.metadata ?? {}
    });

    if (aiMessageError) {
      throw new Error(`Failed to save ai message: ${aiMessageError.message}`);
    }
  }

  const { error: sessionError } = await supabase
    .from("player_sessions")
    .update({
      current_step: nextState.current_step,
      legalidade: nextState.legalidade,
      estrategia: nextState.estrategia,
      etica: nextState.etica,
      state: nextState,
      status: isFinished ? "completed" : "in_progress",
      final_average: finalAverage,
      finished_at: isFinished ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq("id", sessionId);

  if (sessionError) {
    throw new Error(`Failed to update session: ${sessionError.message}`);
  }
}

export async function updateSessionState(sessionId: string, nextState: GameState) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("player_sessions")
    .update({
      current_step: nextState.current_step,
      legalidade: nextState.legalidade,
      estrategia: nextState.estrategia,
      etica: nextState.etica,
      state: nextState,
      updated_at: new Date().toISOString()
    })
    .eq("id", sessionId);

  if (error) {
    throw new Error(`Failed to persist session state: ${error.message}`);
  }
}
