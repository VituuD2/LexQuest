"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { DocumentModal } from "@/components/DocumentModal";
import { DocumentPanel } from "@/components/DocumentPanel";
import { FeedbackPanel } from "@/components/FeedbackPanel";
import { FinalReport } from "@/components/FinalReport";
import { AudioControlPanel } from "@/components/AudioControlPanel";
import { PhaseRiskOverlay } from "@/components/PhaseRiskOverlay";
import { ScoreBars } from "@/components/ScoreBars";
import { StepCard } from "@/components/StepCard";
import type { ActiveGameSession, AuthSessionPayload } from "@/lib/auth-types";
import { DEFAULT_CASE_ID } from "@/lib/case-content";
import {
  calculateFinalReport,
  getFailureThresholdEntries,
  getAllSteps,
  getCaseData,
  getFoundationsForStep,
  getInitialGameState,
  getLoseConditions,
  getStep,
  getUnlockedDocuments,
  markDocumentOpened
} from "@/lib/game-engine";
import type { FeedbackState, GameState } from "@/lib/game-types";
import { getDefaultGameCatalog } from "@/lib/game-catalog";
import { useLexQuestAudio } from "@/lib/use-lexquest-audio";
import { useThemePreference } from "@/lib/use-theme-preference";

type AppPhase = "home" | "case" | "feedback" | "result";

const defaultGameCatalog = getDefaultGameCatalog();
const defaultGameId = defaultGameCatalog[0]?.caseId ?? DEFAULT_CASE_ID;
const phaseLoadingPhrases = [
  "Enviando parecer ao sistema",
  "Escrevendo peticoes",
  "Analisando jurisprudencias",
  "Organizando provas documentais",
  "Revisando estrategia do plantao"
];

function buildDefaultAuthState(): AuthSessionPayload {
  return {
    user: null,
    activeGameSession: null,
    activeGameSessions: [],
    gameCatalog: defaultGameCatalog
  };
}

function dateLabel(value: string | null) {
  if (!value) {
    return "agora";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("pt-BR");
}

function getPrimaryCharacterLabel(caseId: string) {
  const caseData = getCaseData(caseId);
  const primaryCharacter =
    caseData.characters?.find((character) => character.role.toLowerCase().includes("cliente")) ??
    caseData.characters?.find((character) => character.id !== "player") ??
    null;

  if (!primaryCharacter) {
    return {
      subjectLabel: "Parte assistida",
      summary: "Caso em andamento com analise tatico-processual."
    };
  }

  return {
    subjectLabel: primaryCharacter.name,
    summary: primaryCharacter.situation ?? primaryCharacter.role
  };
}

function HomeIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M3.75 10.5 12 4l8.25 6.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.75 9.75v9h10.5v-9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 18.75v-5h4v5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function HomePage() {
  const gameTopRef = useRef<HTMLElement | null>(null);
  const [aiStatus, setAiStatus] = useState<{
    enabled: boolean;
    model: string;
    missingEnv: string[];
  } | null>(null);
  const [phase, setPhase] = useState<AppPhase>("home");
  const [gameState, setGameState] = useState<GameState>(getInitialGameState(defaultGameId));
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [selectedFoundations, setSelectedFoundations] = useState<string[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [openDocumentId, setOpenDocumentId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isPhaseTransitioning, setIsPhaseTransitioning] = useState(false);
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);
  const [loadingDotCount, setLoadingDotCount] = useState(1);
  const [authState, setAuthState] = useState<AuthSessionPayload>(buildDefaultAuthState);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [isAuthPending, setIsAuthPending] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  const [gameErrorMessage, setGameErrorMessage] = useState<string | null>(null);
  const [showPhaseRiskOverlay, setShowPhaseRiskOverlay] = useState(false);
  const [isAudioPanelOpen, setIsAudioPanelOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState(defaultGameId);
  const [loginForm, setLoginForm] = useState({
    login: "",
    password: ""
  });
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const {
    unlockAudio,
    playDecisionCommit,
    playDocumentClose,
    playDocumentOpen,
    playTensionPulse,
    stopTensionPulse,
    audioSettings,
    setMusicVolume,
    setEffectsVolume
  } = useLexQuestAudio();
  const { themePreference, setThemePreference } = useThemePreference();

  const user = authState.user;
  const gameCatalog = authState.gameCatalog;
  const catalogDefaultGameId = gameCatalog[0]?.caseId ?? DEFAULT_CASE_ID;
  const homeGame = gameCatalog.find((game) => game.caseId === selectedGameId) ?? gameCatalog[0] ?? null;
  const activeSessionsByCaseId = useMemo(
    () => new Map(authState.activeGameSessions.map((session) => [session.caseId, session])),
    [authState.activeGameSessions]
  );
  const selectedGameSession = activeSessionsByCaseId.get(selectedGameId) ?? null;
  const homeCaseId = homeGame?.caseId ?? catalogDefaultGameId;
  const homeCaseData = getCaseData(homeCaseId);
  const caseData = phase === "home" ? homeCaseData : getCaseData(gameState.case_id);
  const homeCharacter = getPrimaryCharacterLabel(homeCaseId);
  const activeCharacter = getPrimaryCharacterLabel(gameState.case_id);
  const steps = getAllSteps(caseData.case.id);
  const loseConditions = getLoseConditions(caseData.case.id);
  const failureThresholds = getFailureThresholdEntries(caseData.case.id);
  const currentStep = getStep(gameState.case_id, gameState.current_step);
  const unlockedDocuments = useMemo(
    () => getUnlockedDocuments(gameState.case_id, gameState.documents_unlocked),
    [gameState.case_id, gameState.documents_unlocked]
  );
  const activeDocument = unlockedDocuments.find((document) => document.id === openDocumentId) ?? null;
  const availableFoundations = useMemo(
    () => (currentStep ? getFoundationsForStep(gameState.case_id, currentStep.step_number) : []),
    [currentStep, gameState.case_id]
  );
  const finalReport = useMemo(() => calculateFinalReport(gameState), [gameState]);
  const remainingSteps = steps.filter((step) => step.step_number <= 5).length - gameState.choices_history.length;
  const currentCaseSession = activeSessionsByCaseId.get(gameState.case_id) ?? null;
  const canStartSelectedGame = Boolean(homeGame) && (homeGame.status === "available" || user?.role === "admin");
  const primaryGameActionLabel = isPending
    ? "Abrindo sessao..."
    : !homeGame
      ? "Nenhum jogo disponivel"
      : homeGame.status !== "available" && user?.role !== "admin"
        ? `${homeGame.label} em breve`
        : homeGame.status !== "available"
          ? `Testar ${homeGame.label}`
          : selectedGameSession
            ? `Continuar ${homeGame.label}`
            : `Iniciar ${homeGame.label}`;
  const phaseLoadingPhrase = phaseLoadingPhrases[loadingPhraseIndex % phaseLoadingPhrases.length];
  const phaseLoadingDots = Array.from({ length: loadingDotCount }, () => ".").join(" ");
  const phaseTransitionOverlay = isPhaseTransitioning ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 px-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-[32px] border border-white/12 bg-[#1d2128]/95 p-7 text-center text-parchment shadow-[var(--shadow-elevated-theme)]">
        <p className="text-xs uppercase tracking-[0.24em] text-parchment/55">Processando fase</p>
        <p className="mt-4 font-serifDisplay text-3xl text-white">{phaseLoadingPhrase}</p>
        <p className="mt-4 font-serifDisplay text-4xl tracking-[0.16em] text-brass" aria-hidden="true">
          {phaseLoadingDots}
        </p>
        <p className="sr-only" aria-live="polite">
          {phaseLoadingPhrase} {phaseLoadingDots}
        </p>
      </div>
    </div>
  ) : null;

  function resetTransientState() {
    setSelectedChoice(null);
    setSelectedFoundations([]);
    setSelectedDocumentIds([]);
    setFreeText("");
    setOpenDocumentId(null);
    setFeedback(null);
  }

  function applyActiveGameSession(activeGameSession: ActiveGameSession | null, nextCatalog = authState.gameCatalog) {
    const nextDefaultGameId = nextCatalog[0]?.caseId ?? DEFAULT_CASE_ID;

    if (!activeGameSession) {
      setSessionId(null);
      setGameState(getInitialGameState(nextDefaultGameId));
      setSelectedGameId(nextDefaultGameId);
      resetTransientState();
      setShowPhaseRiskOverlay(false);
      setPhase("home");
      return;
    }

    setAuthState((current) => ({
      ...current,
      activeGameSession
    }));
    setSessionId(activeGameSession.sessionId);
    setGameState(activeGameSession.gameState);
    setSelectedGameId(activeGameSession.caseId);
    resetTransientState();
    setPhase(activeGameSession.status === "completed" || activeGameSession.gameState.current_step >= 6 ? "result" : "case");
  }

  function applyAuthPayload(payload: AuthSessionPayload) {
    setAuthState(payload);

    if (!payload.user) {
      applyActiveGameSession(null, payload.gameCatalog);
      return;
    }

    setSelectedGameId(payload.activeGameSessions[0]?.caseId ?? payload.gameCatalog[0]?.caseId ?? DEFAULT_CASE_ID);
    resetTransientState();
    setShowPhaseRiskOverlay(false);
    setPhase("home");
  }

  function updateActiveSessionState(nextState: GameState, nextSessionId = sessionId) {
    setAuthState((current) => ({
      ...current,
      activeGameSession:
        current.activeGameSession && nextSessionId
          ? {
              ...current.activeGameSession,
              sessionId: nextSessionId,
              caseId: nextState.case_id,
              caseTitle: nextState.title,
              gameState: nextState,
              status: nextState.current_step >= 6 ? "completed" : "in_progress",
              updatedAt: new Date().toISOString()
            }
          : current.activeGameSession,
      activeGameSessions:
        nextState.current_step >= 6 || !nextSessionId
          ? current.activeGameSessions.filter((session) => session.caseId !== nextState.case_id)
          : [
              {
                sessionId: nextSessionId,
                caseId: nextState.case_id,
                caseTitle: nextState.title,
                gameState: nextState,
                status: "in_progress",
                updatedAt: new Date().toISOString(),
                finalAverage: null
              },
              ...current.activeGameSessions.filter((session) => session.caseId !== nextState.case_id)
            ]
    }));
  }

  useEffect(() => {
    async function bootstrap() {
      setIsBootstrapping(true);

      try {
        const [aiResponse, authResponse] = await Promise.all([
          fetch("/api/ai/status").catch(() => null),
          fetch("/api/auth/session")
        ]);

        if (aiResponse?.ok) {
          const aiPayload = (await aiResponse.json()) as {
            enabled: boolean;
            model: string;
            missingEnv: string[];
          };
          setAiStatus(aiPayload);
        }

        if (!authResponse.ok) {
          throw new Error("Nao foi possivel validar a sessao da conta.");
        }

        const authPayload = (await authResponse.json()) as AuthSessionPayload;
        applyAuthPayload(authPayload);
      } catch (error) {
        setAuthErrorMessage(error instanceof Error ? error.message : "Falha inesperada ao carregar autenticacao.");
        applyAuthPayload(buildDefaultAuthState());
      } finally {
        setIsBootstrapping(false);
      }
    }

    void bootstrap();
  }, []);

  useEffect(() => {
    if (phase === "case" || phase === "feedback") {
      playTensionPulse();
      return;
    }

    stopTensionPulse();
  }, [phase, currentStep?.step_number, playTensionPulse, stopTensionPulse]);

  useEffect(() => {
    if (!isPhaseTransitioning) {
      setLoadingPhraseIndex(0);
      setLoadingDotCount(1);
      return;
    }

    const phraseTimer = window.setInterval(() => {
      setLoadingPhraseIndex((current) => (current + 1) % phaseLoadingPhrases.length);
    }, 1100);
    const dotTimer = window.setInterval(() => {
      setLoadingDotCount((current) => (current >= 3 ? 1 : current + 1));
    }, 320);

    return () => {
      window.clearInterval(phraseTimer);
      window.clearInterval(dotTimer);
    };
  }, [isPhaseTransitioning]);

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

    updateActiveSessionState(nextState);
  }

  async function startCase(options?: { restart?: boolean; caseId?: string }) {
    if (!user) {
      return;
    }

    const restart = options?.restart ?? false;
    const caseId = options?.caseId ?? selectedGameId;

    unlockAudio();
    setIsPending(true);
    setGameErrorMessage(null);

    try {
      const response = await fetch("/api/session/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          restart,
          caseId
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Nao foi possivel iniciar a sessao do jogo.");
      }

      const payload = (await response.json()) as ActiveGameSession;

      if (restart) {
        setShowPhaseRiskOverlay(false);
      }

      setAuthState((current) => ({
        ...current,
        activeGameSession: payload,
        activeGameSessions: [payload, ...current.activeGameSessions.filter((session) => session.caseId !== payload.caseId)]
      }));
      applyActiveGameSession(payload);
      setShowPhaseRiskOverlay(payload.gameState.current_step === 1);
      playTensionPulse();
    } catch (error) {
      setGameErrorMessage(error instanceof Error ? error.message : "Falha inesperada ao iniciar o jogo.");
    } finally {
      setIsPending(false);
    }
  }

  async function submitAuth(mode: "login" | "register") {
    setIsAuthPending(true);
    setAuthErrorMessage(null);

    try {
      const response = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body:
          mode === "login"
            ? JSON.stringify(loginForm)
            : JSON.stringify({
                username: registerForm.username,
                email: registerForm.email,
                password: registerForm.password,
                confirmPassword: registerForm.confirmPassword
              })
      });

      const payload = (await response.json()) as AuthSessionPayload & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Falha ao autenticar.");
      }

      applyAuthPayload(payload);
      setGameErrorMessage(null);
    } catch (error) {
      setAuthErrorMessage(error instanceof Error ? error.message : "Falha inesperada de autenticacao.");
    } finally {
      setIsAuthPending(false);
    }
  }

  async function logout() {
    setIsAuthPending(true);
    setAuthErrorMessage(null);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel encerrar a sessao.");
      }

      setLoginForm({
        login: "",
        password: ""
      });
      setRegisterForm({
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
      });
      applyAuthPayload(buildDefaultAuthState());
      setShowPhaseRiskOverlay(false);
    } catch (error) {
      setAuthErrorMessage(error instanceof Error ? error.message : "Falha inesperada ao sair.");
    } finally {
      setIsAuthPending(false);
    }
  }

  function toggleFoundation(foundationId: string) {
    const foundationSelection = currentStep?.foundation_selection;

    if (!foundationSelection?.enabled) {
      return;
    }

    setSelectedFoundations((current) => {
      if (current.includes(foundationId)) {
        return current.filter((item) => item !== foundationId);
      }

      if (current.length >= foundationSelection.max) {
        return current;
      }

      return [...current, foundationId];
    });
  }

  function toggleDocumentSelection(documentId: string) {
    const documentSelection = currentStep?.document_selection;

    if (!documentSelection?.enabled) {
      return;
    }

    setSelectedDocumentIds((current) => {
      if (current.includes(documentId)) {
        return current.filter((item) => item !== documentId);
      }

      if (current.length >= documentSelection.max) {
        return current;
      }

      return [...current, documentId];
    });
  }

  async function handleSubmitStep() {
    if (!currentStep || !sessionId || isPhaseTransitioning) {
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
      setGameErrorMessage(`Selecione entre ${minFoundations} e ${maxFoundations} fundamentos antes de confirmar.`);
      return;
    }

    const minDocuments = currentStep.document_selection?.min ?? 0;
    const maxDocuments = currentStep.document_selection?.max ?? Number.MAX_SAFE_INTEGER;

    if (
      currentStep.document_selection?.enabled &&
      (selectedDocumentIds.length < minDocuments || selectedDocumentIds.length > maxDocuments)
    ) {
      setGameErrorMessage(`Selecione entre ${minDocuments} e ${maxDocuments} documentos antes de confirmar.`);
      return;
    }

    setIsPending(true);
    setIsPhaseTransitioning(true);
    setGameErrorMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    gameTopRef.current?.focus({ preventScroll: true });

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
          selectedFoundationIds: selectedFoundations,
          selectedDocumentIds
        })
      });

      const payload = (await response.json()) as {
        sessionId: string;
        gameState: GameState;
        feedback: FeedbackState;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Nao foi possivel registrar essa escolha.");
      }

      setGameState(payload.gameState);
      updateActiveSessionState(payload.gameState);
      setFeedback(payload.feedback);
      setSelectedChoice(null);
      setSelectedFoundations([]);
      setSelectedDocumentIds([]);
      setFreeText("");
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      setPhase("feedback");
      window.scrollTo({ top: 0, behavior: "auto" });
      requestAnimationFrame(() => {
        gameTopRef.current?.focus({ preventScroll: true });
      });
      if (payload.gameState.current_step >= 6) {
        setShowPhaseRiskOverlay(false);
      }
      playDecisionCommit();
    } catch (error) {
      setGameErrorMessage(error instanceof Error ? error.message : "Falha inesperada ao salvar a escolha.");
    } finally {
      setIsPending(false);
      setIsPhaseTransitioning(false);
    }
  }

  function handleContinue() {
    if (!feedback) {
      return;
    }

    setPhase(feedback.nextStep >= 6 ? "result" : "case");
    window.scrollTo({ top: 0, behavior: "auto" });
    requestAnimationFrame(() => {
      gameTopRef.current?.focus({ preventScroll: true });
    });
  }

  function handleReturnHome() {
    setOpenDocumentId(null);
    setShowPhaseRiskOverlay(false);
    setPhase("home");
  }

  async function handleOpenDocument(documentId: string) {
    playDocumentOpen();
    setOpenDocumentId(documentId);

    if (!gameState.document_state[documentId]?.isOpened) {
      const nextState = markDocumentOpened(gameState, documentId);
      setGameState(nextState);
      updateActiveSessionState(nextState);

      try {
        await persistSessionState(nextState);
      } catch {
        setGameErrorMessage("Nao foi possivel registrar a leitura do documento no momento.");
      }
    }
  }

  function handleCloseDocument() {
    playDocumentClose();
    setOpenDocumentId(null);
  }

  if (isBootstrapping) {
    return (
      <main className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="theme-panel w-full rounded-[36px] border p-8 text-[color:var(--text-primary)]">
          Carregando conta e progresso salvo...
        </div>
      </main>
    );
  }

  if (phase === "home") {
    return (
      <>
        <main className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="theme-panel rounded-[40px] border p-8 text-[color:var(--text-primary)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--text-muted)]">
                  {homeGame?.label ?? "Jogo"} | Catalogo LexQuest
                </p>
                <h1 className="mt-4 max-w-3xl font-serifDisplay text-5xl leading-tight text-[color:var(--text-primary)]">
                  {homeGame?.title ?? caseData.case.title}
                </h1>
              </div>
              {user ? (
                <div className="theme-pill rounded-[24px] border px-4 py-3 text-sm text-[color:var(--text-secondary)]">
                  <p className="font-semibold">@{user.username}</p>
                  <p className="capitalize">{user.role}</p>
                </div>
              ) : null}
            </div>

            <p className="mt-5 max-w-2xl text-base leading-8 text-[color:var(--text-secondary)]">{caseData.case.description}</p>

            <div className="theme-card-muted mt-6 rounded-[24px] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Foco narrativo</p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--text-primary)]">{homeCharacter.subjectLabel}</p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--text-secondary)]">{homeCharacter.summary}</p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="theme-card-muted rounded-[24px] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Area</p>
                <p className="mt-2 text-lg font-semibold text-[color:var(--text-primary)]">{caseData.case.area}</p>
              </div>
              <div className="theme-card-muted rounded-[24px] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Dificuldade</p>
                <p className="mt-2 text-lg font-semibold text-[color:var(--text-primary)]">{caseData.case.difficulty}</p>
              </div>
              <div className="theme-card-muted rounded-[24px] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Duracao</p>
                <p className="mt-2 text-lg font-semibold text-[color:var(--text-primary)]">
                  {caseData.case.estimated_duration_minutes.min}-{caseData.case.estimated_duration_minutes.max} min
                </p>
              </div>
            </div>

            <div
              className={`mt-6 rounded-[24px] border p-4 text-sm leading-7 ${
                aiStatus?.enabled
                  ? "border-emerald/25 bg-emerald/10 text-[color:var(--text-primary)]"
                  : "border-garnet/25 bg-garnet/10 text-[color:var(--text-primary)]"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                IA de revisao {aiStatus?.enabled ? "ativa" : "desativada"}
              </p>
              <p className="mt-2">
                Modelo: {aiStatus?.model ?? "gpt-4.1-mini"}.
                {aiStatus?.enabled
                  ? " O caso vai receber feedback juridico personalizado e sugestao de reescrita quando necessario."
                  : ` Configure ${aiStatus?.missingEnv?.join(", ") || "OPENAI_API_KEY"} para sair do status skipped.`}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <button
                  className="theme-button-primary rounded-full px-7 py-4 text-sm font-semibold uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={isPending || !canStartSelectedGame}
                  onClick={() => void startCase({ caseId: selectedGameId })}
                  type="button"
                >
                  {primaryGameActionLabel}
                </button>
              ) : (
                <button
                  className="theme-button-primary rounded-full px-7 py-4 text-sm font-semibold uppercase tracking-[0.14em] transition"
                  onClick={() => setAuthMode("register")}
                  type="button"
                >
                  Criar conta para jogar
                </button>
              )}
              {selectedGameSession ? (
                <button
                  className="theme-button-secondary rounded-full border px-7 py-4 text-sm font-semibold uppercase tracking-[0.14em] transition"
                  onClick={() => applyActiveGameSession(selectedGameSession)}
                  type="button"
                >
                  Retomar progresso salvo
                </button>
              ) : null}
              {user?.role === "admin" ? (
                <Link
                  className="theme-button-secondary inline-flex rounded-full border px-7 py-4 text-sm font-semibold uppercase tracking-[0.14em] transition"
                  href="/creator"
                >
                  Abrir central admin
                </Link>
              ) : null}
              {user ? (
                <button
                  className="theme-button-secondary rounded-full border px-7 py-4 text-sm font-semibold uppercase tracking-[0.14em] transition"
                  disabled={isAuthPending}
                  onClick={logout}
                  type="button"
                >
                  Sair
                </button>
              ) : null}
            </div>

            <div className="theme-card mt-6 rounded-[28px] border p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Escolha o jogo</p>
                  <h3 className="mt-2 font-serifDisplay text-2xl text-[color:var(--text-primary)]">
                    Catalogo de jogos LexQuest
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-[color:var(--text-secondary)]">
                    A home agora funciona como hub central. Volte para ca para trocar entre os jogos e continuar o progresso salvo de cada caso.
                  </p>
                </div>
                {selectedGameSession ? (
                  <div className="theme-pill rounded-[22px] border px-4 py-3 text-sm text-[color:var(--text-secondary)]">
                    Progresso salvo em {dateLabel(selectedGameSession.updatedAt)}
                  </div>
                ) : null}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {gameCatalog.map((game) => {
                  const gameSession = activeSessionsByCaseId.get(game.caseId) ?? null;
                  const isSelected = selectedGameId === game.caseId;

                  return (
                    <button
                      className={`rounded-[26px] border p-5 text-left transition ${
                        isSelected
                          ? "border-brass bg-brass/12 shadow-[var(--shadow-dossier-theme)]"
                          : "theme-card hover:border-brass/35 hover:bg-[var(--surface-card-strong)]"
                      }`}
                      key={game.caseId}
                      onClick={() => setSelectedGameId(game.caseId)}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                            {game.label}
                          </p>
                          <h4 className="mt-2 text-lg font-semibold text-[color:var(--text-primary)]">{game.title}</h4>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                            game.status === "available"
                              ? "bg-emerald/12 text-emerald"
                              : "bg-white/8 text-[color:var(--text-secondary)]"
                          }`}
                        >
                          {game.status === "available" ? "disponivel" : "em breve"}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-[color:var(--text-secondary)]">{game.summary}</p>
                      {gameSession ? (
                        <p className="mt-4 text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
                          Progresso salvo no passo {gameSession.gameState.current_step}
                        </p>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {homeGame ? (
                <div className="theme-card-muted mt-4 rounded-[24px] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--text-muted)]">Jogo selecionado</p>
                  <p className="mt-2 text-lg font-semibold text-[color:var(--text-primary)]">{homeGame.title}</p>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--text-secondary)]">{homeGame.summary}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
                    {homeGame.status === "available"
                      ? user
                        ? "Pronto para abrir ou continuar."
                        : "Disponivel assim que voce entrar na sua conta."
                      : user?.role === "admin"
                        ? "Rascunho visivel apenas para admin. Use a central admin para publicar."
                        : "Ainda nao publicado. Pode ser preparado no studio admin."}
                  </p>
                </div>
              ) : null}
            </div>

            {gameErrorMessage ? <p className="mt-4 text-sm text-garnet">{gameErrorMessage}</p> : null}
            {authErrorMessage && user ? <p className="mt-4 text-sm text-garnet">{authErrorMessage}</p> : null}
          </div>

          <aside className="rounded-[40px] border border-white/10 bg-[var(--surface-contrast)] p-8 text-parchment shadow-[var(--shadow-elevated-theme)]">
            {!user ? (
              <>
                <p className="text-xs uppercase tracking-[0.28em] text-parchment/55">Conta obrigatoria</p>
                <h2 className="mt-4 font-serifDisplay text-3xl">Entrar no LexQuest</h2>
                <p className="mt-4 text-sm leading-7 text-parchment/85">
                  O progresso agora fica salvo por usuario. Cadastre username, email, senha e confirmacao de senha para criar sua conta.
                </p>

                <div className="mt-6 flex gap-2 rounded-full border border-white/10 bg-white/8 p-1">
                  {(["register", "login"] as const).map((modeOption) => (
                    <button
                      className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                        authMode === modeOption ? "bg-parchment text-ink" : "text-parchment/68"
                      }`}
                      key={modeOption}
                      onClick={() => setAuthMode(modeOption)}
                      type="button"
                    >
                      {modeOption === "register" ? "Criar conta" : "Entrar"}
                    </button>
                  ))}
                </div>

                {authMode === "register" ? (
                  <div className="mt-6 space-y-3">
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-parchment/60 focus:border-brass/45"
                      onChange={(event) => setRegisterForm((current) => ({ ...current, username: event.target.value }))}
                      placeholder="Username"
                      value={registerForm.username}
                    />
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-parchment/60 focus:border-brass/45"
                      onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
                      placeholder="Email"
                      type="email"
                      value={registerForm.email}
                    />
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-parchment/60 focus:border-brass/45"
                      onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                      placeholder="Senha"
                      type="password"
                      value={registerForm.password}
                    />
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-parchment/60 focus:border-brass/45"
                      onChange={(event) =>
                        setRegisterForm((current) => ({ ...current, confirmPassword: event.target.value }))
                      }
                      placeholder="Confirmacao de senha"
                      type="password"
                      value={registerForm.confirmPassword}
                    />
                    <button
                      className="w-full rounded-full bg-brass px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-ink transition hover:bg-[#c79a51] disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isAuthPending}
                      onClick={() => submitAuth("register")}
                      type="button"
                    >
                      {isAuthPending ? "Criando..." : "Criar conta"}
                    </button>
                  </div>
                ) : (
                  <div className="mt-6 space-y-3">
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-parchment/60 focus:border-brass/45"
                      onChange={(event) => setLoginForm((current) => ({ ...current, login: event.target.value }))}
                      placeholder="Email ou username"
                      value={loginForm.login}
                    />
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-parchment/60 focus:border-brass/45"
                      onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                      placeholder="Senha"
                      type="password"
                      value={loginForm.password}
                    />
                    <button
                      className="w-full rounded-full bg-brass px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-ink transition hover:bg-[#c79a51] disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isAuthPending}
                      onClick={() => submitAuth("login")}
                      type="button"
                    >
                      {isAuthPending ? "Entrando..." : "Entrar"}
                    </button>
                  </div>
                )}
                {authErrorMessage ? <p className="mt-4 text-sm text-[#f8aca6]">{authErrorMessage}</p> : null}
              </>
            ) : (
              <>
                <p className="text-xs uppercase tracking-[0.28em] text-parchment/55">Conta ativa</p>
                <p className="mt-4 text-sm leading-7 text-parchment/85">
                  Logado como <strong>@{user.username}</strong> com permissao <strong className="capitalize">{user.role}</strong>.
                </p>
                <div className="mt-6 space-y-4">
                  <div className="rounded-[24px] bg-white/8 p-5">
                    <p className="text-xs uppercase tracking-[0.16em] text-parchment/55">Email</p>
                    <p className="mt-2 text-sm leading-7 text-parchment/85">{user.email}</p>
                  </div>
                  <div className="rounded-[24px] bg-white/8 p-5">
                    <p className="text-xs uppercase tracking-[0.16em] text-parchment/55">Progresso</p>
                    <p className="mt-2 text-sm leading-7 text-parchment/85">
                      {authState.activeGameSessions.length > 0
                        ? `${authState.activeGameSessions.length} jogo(s) com progresso salvo. Volte para a home para escolher qual retomar.`
                        : "Nenhum jogo em andamento no momento. Inicie um jogo para salvar seu progresso nesta conta."}
                    </p>
                  </div>
                </div>
              </>
            )}
          </aside>
          </section>
        </main>
        <AudioControlPanel
          audioSettings={audioSettings}
          isOpen={isAudioPanelOpen}
          onEffectsChange={setEffectsVolume}
          onMusicChange={setMusicVolume}
          onThemeChange={setThemePreference}
          onToggleOpen={() => setIsAudioPanelOpen((current) => !current)}
          themePreference={themePreference}
        />
      </>
    );
  }

  if (phase === "result") {
    return (
      <>
        <main
          className={`mx-auto min-h-screen max-w-7xl px-4 py-8 outline-none transition duration-200 sm:px-6 lg:px-8 ${
            isPhaseTransitioning ? "pointer-events-none blur-[2px] brightness-75" : ""
          }`}
          ref={gameTopRef}
          tabIndex={-1}
        >
        <div className="theme-panel mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[28px] border px-5 py-4 text-[color:var(--text-primary)]">
          <div className="text-sm text-[color:var(--text-secondary)]">
            Conta: <strong>@{user?.username}</strong>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="theme-button-secondary inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition"
              onClick={handleReturnHome}
              type="button"
            >
              <HomeIcon />
              Home
            </button>
            {user?.role === "admin" ? (
              <Link
                className="theme-button-secondary rounded-full border px-4 py-3 text-sm font-semibold transition"
                href="/creator"
              >
                Central admin
              </Link>
            ) : null}
            <button
              className="theme-button-secondary rounded-full border px-4 py-3 text-sm font-semibold transition"
              disabled={isAuthPending}
              onClick={logout}
              type="button"
            >
              Sair
            </button>
          </div>
        </div>
        <FinalReport gameState={gameState} onRestart={() => void startCase({ restart: true, caseId: gameState.case_id })} report={finalReport} />
        <AudioControlPanel
          audioSettings={audioSettings}
          isOpen={isAudioPanelOpen}
          onEffectsChange={setEffectsVolume}
          onMusicChange={setMusicVolume}
          onThemeChange={setThemePreference}
          onToggleOpen={() => setIsAudioPanelOpen((current) => !current)}
          themePreference={themePreference}
        />
        </main>
        {phaseTransitionOverlay}
      </>
    );
  }

  return (
    <>
      <main
        className={`mx-auto min-h-screen max-w-7xl px-4 py-8 outline-none transition duration-200 sm:px-6 lg:px-8 ${
          activeDocument || isPhaseTransitioning ? "pointer-events-none blur-[2px] brightness-75" : ""
        }`}
        ref={gameTopRef}
        tabIndex={-1}
      >
        <div className="theme-panel mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[28px] border px-5 py-4 text-[color:var(--text-primary)]">
          <div className="text-sm text-[color:var(--text-secondary)]">
            Conta: <strong>@{user?.username}</strong> {currentCaseSession ? `| salvo em ${dateLabel(currentCaseSession.updatedAt)}` : ""}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="theme-button-secondary inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition"
              onClick={handleReturnHome}
              type="button"
            >
              <HomeIcon />
              Home
            </button>
            {user?.role === "admin" ? (
              <Link
                className="theme-button-secondary rounded-full border px-4 py-3 text-sm font-semibold transition"
                href="/creator"
              >
                Central admin
              </Link>
            ) : null}
            <button
              className="theme-button-secondary rounded-full border px-4 py-3 text-sm font-semibold transition"
              disabled={isAuthPending}
              onClick={logout}
              type="button"
            >
              Sair
            </button>
          </div>
        </div>

        <div className="mb-6 grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
          <div className="space-y-6">
            <div className="theme-panel-strong rounded-[36px] border p-6 text-[color:var(--text-primary)]">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--text-muted)]">Sandbox juridico</p>
                  <h1 className="mt-2 font-serifDisplay text-4xl text-[color:var(--text-primary)]">{caseData.case.title}</h1>
                </div>
                <div className="rounded-2xl border border-garnet/20 bg-garnet/10 px-4 py-3 text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-garnet/70">Nivel de tensao</p>
                  <p className="font-serifDisplay text-3xl text-garnet">{Math.max(0, 100 - remainingSteps * 14)}</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-7 text-[color:var(--text-secondary)]">
                Parte central: {activeCharacter.subjectLabel}. Contexto atual: {activeCharacter.summary}. Situacao do jogo:{" "}
                <span className="font-semibold capitalize">{gameState.client_status.replaceAll("_", " ")}</span>.
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-xs uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
                {sessionId ? (
                  <span className="theme-pill rounded-full border px-3 py-2">Sessao: {sessionId.slice(0, 8)}</span>
                ) : null}
                <span className="theme-pill rounded-full border px-3 py-2">
                  Prazo restante: {Math.max(0, gameState.deadline_hours - gameState.choices_history.length * 8)}h
                </span>
                <span className="theme-pill rounded-full border px-3 py-2">
                  Etapas restantes: {Math.max(0, remainingSteps)}
                </span>
                <span className="theme-pill rounded-full border px-3 py-2">
                  nao lidos: {unlockedDocuments.filter((document) => !gameState.document_state[document.id]?.isOpened).length}
                </span>
              </div>
            </div>

            <ScoreBars
              averageFloor={loseConditions?.average_floor}
              estrategia={gameState.estrategia}
              etica={gameState.etica}
              legalidade={gameState.legalidade}
              metricFloor={loseConditions?.metric_floor}
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
            documents={unlockedDocuments}
            foundations={availableFoundations}
            freeText={freeText}
            onFreeTextChange={setFreeText}
            onOpenDocument={handleOpenDocument}
            onSelectChoice={setSelectedChoice}
            onSubmit={handleSubmitStep}
            onToggleDocument={toggleDocumentSelection}
            onToggleFoundation={toggleFoundation}
            selectedChoice={selectedChoice}
            selectedDocumentIds={selectedDocumentIds}
            selectedFoundations={selectedFoundations}
            step={currentStep}
          />
        ) : null}

        {phase === "feedback" && feedback ? (
          <FeedbackPanel feedback={feedback} isFinalStep={feedback.nextStep >= 6} onContinue={handleContinue} />
        ) : null}

        {gameErrorMessage ? <p className="mt-4 text-sm text-garnet">{gameErrorMessage}</p> : null}
      </main>

      {showPhaseRiskOverlay && loseConditions ? (
        <PhaseRiskOverlay
          averageFloor={loseConditions.average_floor}
          currentStep={gameState.current_step}
          onClose={() => setShowPhaseRiskOverlay(false)}
          thresholds={failureThresholds}
        />
      ) : null}

      <AudioControlPanel
        audioSettings={audioSettings}
        isOpen={isAudioPanelOpen}
        onEffectsChange={setEffectsVolume}
        onMusicChange={setMusicVolume}
        onThemeChange={setThemePreference}
        onToggleOpen={() => setIsAudioPanelOpen((current) => !current)}
        themePreference={themePreference}
      />

      {phaseTransitionOverlay}

      {activeDocument ? <DocumentModal document={activeDocument} onClose={handleCloseDocument} /> : null}
    </>
  );
}
