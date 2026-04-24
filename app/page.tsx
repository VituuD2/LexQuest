"use client";

import { useEffect, useMemo, useState } from "react";
import { DocumentModal } from "@/components/DocumentModal";
import { DocumentPanel } from "@/components/DocumentPanel";
import { FeedbackPanel } from "@/components/FeedbackPanel";
import { FinalReport } from "@/components/FinalReport";
import { ScoreBars } from "@/components/ScoreBars";
import { StepCard } from "@/components/StepCard";
import {
  calculateFinalReport,
  getAllSteps,
  getCaseData,
  getFoundationsForStep,
  getInitialGameState,
  markDocumentOpened,
  getStep,
  getUnlockedDocuments
} from "@/lib/game-engine";
import type { FeedbackState, GameState } from "@/lib/game-types";
import { useLexQuestAudio } from "@/lib/use-lexquest-audio";

type AppPhase = "home" | "case" | "feedback" | "result";

const caseData = getCaseData();
const steps = getAllSteps();

export default function HomePage() {
  const [phase, setPhase] = useState<AppPhase>("home");
  const [gameState, setGameState] = useState<GameState>(getInitialGameState());
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [selectedFoundations, setSelectedFoundations] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [openDocumentId, setOpenDocumentId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { unlockAudio, playDecisionCommit, playDocumentClose, playDocumentOpen, playTensionPulse } = useLexQuestAudio();

  const currentStep = getStep(gameState.current_step);
  const unlockedDocuments = useMemo(
    () => getUnlockedDocuments(gameState.documents_unlocked),
    [gameState.documents_unlocked]
  );
  const activeDocument = unlockedDocuments.find((document) => document.id === openDocumentId) ?? null;
  const availableFoundations = useMemo(
    () => (currentStep ? getFoundationsForStep(currentStep.step_number) : []),
    [currentStep]
  );
  const finalReport = useMemo(() => calculateFinalReport(gameState), [gameState]);
  const remainingSteps = steps.filter((step) => step.step_number <= 5).length - gameState.choices_history.length;

  useEffect(() => {
    if (phase === "case" || phase === "feedback") {
      playTensionPulse();
    }
  }, [phase, currentStep?.step_number, playTensionPulse]);

  async function persistSessionState(nextState: GameState) {
    if (!sessionId) {
      return;
    }

    const response = await fetch(`/api/session/${sessionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        gameState: nextState
      })
    });

    if (!response.ok) {
      throw new Error("Falha ao persistir estado da sessao.");
    }
  }

  async function startCase() {
    unlockAudio();
    setIsPending(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/session/start", {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel iniciar a sessao do caso.");
      }

      const payload = (await response.json()) as { sessionId: string; gameState: GameState };

      setSessionId(payload.sessionId);
      setGameState(payload.gameState);
      setSelectedChoice(null);
      setSelectedFoundations([]);
      setFreeText("");
      setFeedback(null);
      setOpenDocumentId(null);
      setPhase("case");
      playTensionPulse();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Falha inesperada ao iniciar o caso.");
    } finally {
      setIsPending(false);
    }
  }

  function toggleFoundation(foundationId: string) {
    if (!currentStep?.foundation_selection?.enabled) {
      return;
    }

    setSelectedFoundations((current) => {
      if (current.includes(foundationId)) {
        return current.filter((item) => item !== foundationId);
      }

      if (current.length >= currentStep.foundation_selection!.max) {
        return current;
      }

      return [...current, foundationId];
    });
  }

  async function handleSubmitStep() {
    if (!currentStep || !sessionId) {
      return;
    }

    if (!currentStep.free_text?.enabled && !selectedChoice) {
      return;
    }

    if (currentStep.free_text?.enabled && !freeText.trim()) {
      return;
    }

    const minFoundations = currentStep.foundation_selection?.min ?? 0;
    const maxFoundations = currentStep.foundation_selection?.max ?? Number.MAX_SAFE_INTEGER;

    if (
      currentStep.foundation_selection?.enabled &&
      (selectedFoundations.length < minFoundations || selectedFoundations.length > maxFoundations)
    ) {
      setErrorMessage(`Selecione entre ${minFoundations} e ${maxFoundations} fundamentos antes de confirmar.`);
      return;
    }

    setIsPending(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/session/${sessionId}/choice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          stepNumber: currentStep.step_number,
          choiceKey: selectedChoice ?? "FREE_TEXT",
          freeText,
          selectedFoundationIds: selectedFoundations
        })
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel registrar essa escolha.");
      }

      const payload = (await response.json()) as {
        sessionId: string;
        gameState: GameState;
        feedback: FeedbackState;
      };

      setGameState(payload.gameState);
      setFeedback(payload.feedback);
      setSelectedChoice(null);
      setSelectedFoundations([]);
      setFreeText("");
      setPhase("feedback");
      playDecisionCommit();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Falha inesperada ao salvar a escolha.");
    } finally {
      setIsPending(false);
    }
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

  async function handleOpenDocument(documentId: string) {
    playDocumentOpen();
    setOpenDocumentId(documentId);

    if (!gameState.document_state[documentId]?.isOpened) {
      const nextState = markDocumentOpened(gameState, documentId);
      setGameState(nextState);

      try {
        await persistSessionState(nextState);
      } catch {
        setErrorMessage("Nao foi possivel registrar a leitura do documento no momento.");
      }
    }
  }

  function handleCloseDocument() {
    playDocumentClose();
    setOpenDocumentId(null);
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
              className="mt-8 rounded-full bg-ink px-7 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-parchment transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:bg-ink/40"
              disabled={isPending}
              onClick={startCase}
              type="button"
            >
              {isPending ? "Abrindo sessao..." : "Iniciar caso"}
            </button>
            {errorMessage ? <p className="mt-4 text-sm text-garnet">{errorMessage}</p> : null}
          </div>

          <aside className="rounded-[40px] border border-ink/10 bg-[#1f232b] p-8 text-parchment shadow-dossier">
            <p className="text-xs uppercase tracking-[0.28em] text-parchment/55">Premissa</p>
            <p className="mt-4 text-sm leading-7 text-parchment/85">
              Sexta-feira a noite. A familia de Rafael Martins de Oliveira procura auxilio urgente apos a conversao do
              flagrante em preventiva. O relogio corre, o acervo e ambiguo e a defesa precisa pensar como doutor de plantao.
            </p>

            <div className="mt-8 space-y-4">
              <div className="rounded-[24px] bg-white/8 p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-parchment/55">Foco pedagogico</p>
                <p className="mt-2 text-sm leading-7 text-parchment/85">
                  Custodia, preventiva, habeas corpus, leitura probatoria, hierarquia argumentativa e estrategia defensiva.
                </p>
              </div>
              <div className="rounded-[24px] bg-white/8 p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-parchment/55">Formato</p>
                <p className="mt-2 text-sm leading-7 text-parchment/85">
                  Simulacao decisoria com estrategia, fundamentos selecionados e leitura integral de documentos em formatos proprios.
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
    <>
      <main
        className={`mx-auto min-h-screen max-w-7xl px-4 py-8 transition duration-200 sm:px-6 lg:px-8 ${
          activeDocument ? "pointer-events-none blur-[2px] brightness-75" : ""
        }`}
      >
        <div className="mb-6 grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
          <div className="space-y-6">
            <div className="rounded-[36px] border border-ink/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.82),rgba(239,228,206,0.72))] p-6 shadow-dossier">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-ink/45">Sandbox juridico</p>
                  <h1 className="mt-2 font-serifDisplay text-4xl text-ink">{caseData.case.title}</h1>
                </div>
                <div className="rounded-2xl border border-garnet/20 bg-garnet/10 px-4 py-3 text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-garnet/70">Nivel de tensao</p>
                  <p className="font-serifDisplay text-3xl text-garnet">{Math.max(0, 100 - remainingSteps * 14)}</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-7 text-ink/75">
                Custodiado: Rafael Martins de Oliveira. Situacao atual:{" "}
                <span className="font-semibold capitalize">{gameState.client_status.replaceAll("_", " ")}</span>.
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-xs uppercase tracking-[0.16em] text-ink/55">
                {sessionId ? (
                  <span className="rounded-full border border-ink/10 px-3 py-2">Sessao: {sessionId.slice(0, 8)}</span>
                ) : null}
                <span className="rounded-full border border-ink/10 px-3 py-2">
                  Prazo restante: {Math.max(0, gameState.deadline_hours - gameState.choices_history.length * 8)}h
                </span>
                <span className="rounded-full border border-ink/10 px-3 py-2">
                  Etapas restantes: {Math.max(0, remainingSteps)}
                </span>
                <span className="rounded-full border border-ink/10 px-3 py-2">
                  nao lidos: {unlockedDocuments.filter((document) => !gameState.document_state[document.id]?.isOpened).length}
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
            documentState={gameState.document_state}
            documents={unlockedDocuments}
            onOpenDocument={handleOpenDocument}
          />
        </div>

        {phase === "case" && currentStep ? (
          <StepCard
            disabled={isPending}
            foundations={availableFoundations}
            freeText={freeText}
            onFreeTextChange={setFreeText}
            onSelectChoice={setSelectedChoice}
            onSubmit={handleSubmitStep}
            onToggleFoundation={toggleFoundation}
            selectedChoice={selectedChoice}
            selectedFoundations={selectedFoundations}
            step={currentStep}
          />
        ) : null}

        {phase === "feedback" && feedback ? (
          <FeedbackPanel feedback={feedback} isFinalStep={feedback.nextStep >= 6} onContinue={handleContinue} />
        ) : null}

        {errorMessage ? <p className="mt-4 text-sm text-garnet">{errorMessage}</p> : null}
      </main>

      {activeDocument ? <DocumentModal document={activeDocument} onClose={handleCloseDocument} /> : null}
    </>
  );
}
