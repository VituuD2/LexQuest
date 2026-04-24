"use client";

import { useMemo, useState } from "react";
import { DocumentPanel } from "@/components/DocumentPanel";
import { FeedbackPanel } from "@/components/FeedbackPanel";
import { FinalReport } from "@/components/FinalReport";
import { ScoreBars } from "@/components/ScoreBars";
import { StepCard } from "@/components/StepCard";
import {
  applyChoice,
  calculateFinalReport,
  getAllSteps,
  getCaseData,
  getInitialGameState,
  getStep,
  getUnlockedDocuments
} from "@/lib/game-engine";
import type { FeedbackState, GameState } from "@/lib/game-types";

type AppPhase = "home" | "case" | "feedback" | "result";

const caseData = getCaseData();
const steps = getAllSteps();

export default function HomePage() {
  const [phase, setPhase] = useState<AppPhase>("home");
  const [gameState, setGameState] = useState<GameState>(getInitialGameState());
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [freeText, setFreeText] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    getInitialGameState().documents_unlocked[0] ?? null
  );
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const currentStep = getStep(gameState.current_step);
  const unlockedDocuments = useMemo(
    () => getUnlockedDocuments(gameState.documents_unlocked),
    [gameState.documents_unlocked]
  );
  const finalReport = useMemo(() => calculateFinalReport(gameState), [gameState]);
  const remainingSteps = steps.filter((step) => step.step_number <= 5).length - gameState.choices_history.length;

  function startCase() {
    const initialState = getInitialGameState();

    setGameState(initialState);
    setSelectedChoice(null);
    setFreeText("");
    setFeedback(null);
    setSelectedDocumentId(initialState.documents_unlocked[0] ?? null);
    setPhase("case");
  }

  function handleSubmitStep() {
    if (!currentStep) {
      return;
    }

    if (!currentStep.free_text?.enabled && !selectedChoice) {
      return;
    }

    if (currentStep.free_text?.enabled && !freeText.trim()) {
      return;
    }

    const result = applyChoice({
      gameState,
      step: currentStep,
      choiceKey: selectedChoice ?? "FREE_TEXT",
      freeText
    });

    setGameState(result.nextState);
    setFeedback(result.feedback);
    setSelectedChoice(null);
    setFreeText("");
    setSelectedDocumentId(result.feedback.unlockedDocuments.at(-1) ?? selectedDocumentId);
    setPhase("feedback");
  }

  function handleContinue() {
    if (!feedback) {
      return;
    }

    if (feedback.nextStep >= 6) {
      setPhase("result");
      return;
    }

    setPhase("case");
  }

  if (phase === "home") {
    return (
      <main className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[40px] border border-ink/10 bg-white/70 p-8 shadow-dossier backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-ink/45">LexQuest MVP</p>
            <h1 className="mt-4 max-w-3xl font-serifDisplay text-5xl leading-tight text-ink">
              Habeas Corpus em 48h
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-ink/80">{caseData.case.description}</p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] bg-parchment/65 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-ink/45">Area</p>
                <p className="mt-2 text-lg font-semibold text-ink">{caseData.case.area}</p>
              </div>
              <div className="rounded-[24px] bg-parchment/65 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-ink/45">Dificuldade</p>
                <p className="mt-2 text-lg font-semibold text-ink">{caseData.case.difficulty}</p>
              </div>
              <div className="rounded-[24px] bg-parchment/65 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-ink/45">Duracao</p>
                <p className="mt-2 text-lg font-semibold text-ink">
                  {caseData.case.estimated_duration_minutes.min}-{caseData.case.estimated_duration_minutes.max} min
                </p>
              </div>
            </div>

            <button
              className="mt-8 rounded-full bg-ink px-7 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-parchment transition hover:bg-ink/90"
              onClick={startCase}
              type="button"
            >
              Iniciar caso
            </button>
          </div>

          <aside className="rounded-[40px] border border-ink/10 bg-[#1f232b] p-8 text-parchment shadow-dossier">
            <p className="text-xs uppercase tracking-[0.28em] text-parchment/55">Premissa</p>
            <p className="mt-4 text-sm leading-7 text-parchment/85">
              Sexta-feira a noite. A familia de Rafael Martins de Oliveira procura ajuda urgente apos a conversao do
              flagrante em preventiva. O relogio corre contra a defesa.
            </p>

            <div className="mt-8 space-y-4">
              <div className="rounded-[24px] bg-white/8 p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-parchment/55">Foco pedagogico</p>
                <p className="mt-2 text-sm leading-7 text-parchment/85">
                  Prisao em flagrante, preventiva, habeas corpus, fundamentacao e estrategia defensiva.
                </p>
              </div>
              <div className="rounded-[24px] bg-white/8 p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-parchment/55">Publico</p>
                <p className="mt-2 text-sm leading-7 text-parchment/85">
                  {caseData.case.target_audience.join(", ")}.
                </p>
              </div>
            </div>
          </aside>
        </section>
      </main>
    );
  }

  if (phase === "result") {
    return (
      <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <FinalReport gameState={gameState} onRestart={startCase} report={finalReport} />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <div className="space-y-6">
          <div className="rounded-[32px] border border-ink/10 bg-white/70 p-6 shadow-dossier">
            <p className="text-xs uppercase tracking-[0.24em] text-ink/45">Dashboard do caso</p>
            <h1 className="mt-2 font-serifDisplay text-4xl text-ink">{caseData.case.title}</h1>
            <p className="mt-3 text-sm leading-7 text-ink/75">
              Cliente: Rafael Martins de Oliveira. Status atual:{" "}
              <span className="font-semibold capitalize">{gameState.client_status.replaceAll("_", " ")}</span>.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-xs uppercase tracking-[0.16em] text-ink/55">
              <span className="rounded-full border border-ink/10 px-3 py-2">
                Prazo restante: {Math.max(0, gameState.deadline_hours - gameState.choices_history.length * 8)}h
              </span>
              <span className="rounded-full border border-ink/10 px-3 py-2">
                Etapas restantes: {Math.max(0, remainingSteps)}
              </span>
            </div>
          </div>

          <ScoreBars
            estrategia={gameState.estrategia}
            etica={gameState.etica}
            legalidade={gameState.legalidade}
          />
        </div>

        <DocumentPanel
          documents={unlockedDocuments}
          onSelectDocument={setSelectedDocumentId}
          selectedDocumentId={selectedDocumentId}
        />
      </div>

      {phase === "case" && currentStep ? (
        <StepCard
          disabled={false}
          freeText={freeText}
          onFreeTextChange={setFreeText}
          onSelectChoice={setSelectedChoice}
          onSubmit={handleSubmitStep}
          selectedChoice={selectedChoice}
          step={currentStep}
        />
      ) : null}

      {phase === "feedback" && feedback ? (
        <FeedbackPanel feedback={feedback} isFinalStep={feedback.nextStep >= 6} onContinue={handleContinue} />
      ) : null}
    </main>
  );
}
