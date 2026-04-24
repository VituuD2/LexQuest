import "server-only";
import { randomUUID } from "node:crypto";
import { getInitialGameState, getStep } from "@/lib/game-engine";
import type { FeedbackState, GameState } from "@/lib/game-types";
import { getDb } from "@/lib/server/sqlite";

type SessionRow = {
  id: string;
  state: string;
};

export function createSession() {
  const db = getDb();
  const initialState = getInitialGameState();
  const sessionId = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `
      insert into player_sessions (
        id,
        case_id,
        current_step,
        legalidade,
        estrategia,
        etica,
        state,
        created_at,
        updated_at
      )
      values (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    sessionId,
    initialState.case_id,
    initialState.current_step,
    initialState.legalidade,
    initialState.estrategia,
    initialState.etica,
    JSON.stringify(initialState),
    now,
    now
  );

  return {
    sessionId,
    gameState: initialState
  };
}

export function getSessionState(sessionId: string): GameState | null {
  const db = getDb();
  const row = db.prepare("select id, state from player_sessions where id = ?").get(sessionId) as SessionRow | undefined;

  if (!row) {
    return null;
  }

  return JSON.parse(row.state) as GameState;
}

export function saveChoice(params: {
  sessionId: string;
  nextState: GameState;
  feedback: FeedbackState;
  stepNumber: number;
  choiceKey: string;
  freeText?: string;
}) {
  const { sessionId, nextState, feedback, stepNumber, choiceKey, freeText } = params;
  const db = getDb();
  const step = getStep(stepNumber);

  db.prepare(
    `
      insert into player_choices (
        id,
        session_id,
        step_id,
        choice_key,
        free_text_argument,
        score_legalidade,
        score_estrategia,
        score_etica,
        feedback,
        created_at
      )
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    randomUUID(),
    sessionId,
    step?.id ?? null,
    choiceKey,
    freeText ?? null,
    feedback.scoreDelta.legalidade,
    feedback.scoreDelta.estrategia,
    feedback.scoreDelta.etica,
    feedback.juridicalFeedback,
    new Date().toISOString()
  );

  db.prepare(
    `
      update player_sessions
      set
        current_step = ?,
        legalidade = ?,
        estrategia = ?,
        etica = ?,
        state = ?,
        updated_at = ?
      where id = ?
    `
  ).run(
    nextState.current_step,
    nextState.legalidade,
    nextState.estrategia,
    nextState.etica,
    JSON.stringify(nextState),
    new Date().toISOString(),
    sessionId
  );
}
