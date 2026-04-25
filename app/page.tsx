"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DocumentModal } from "@/components/DocumentModal";
import { DocumentPanel } from "@/components/DocumentPanel";
import { FeedbackPanel } from "@/components/FeedbackPanel";
import { FinalReport } from "@/components/FinalReport";
import { ScoreBars } from "@/components/ScoreBars";
import { StepCard } from "@/components/StepCard";
import type { ActiveGameSession, AuthSessionPayload } from "@/lib/auth-types";
import {
  calculateFinalReport,
  getAllSteps,
  getCaseData,
  getFoundationsForStep,
  getInitialGameState,
  getStep,
  getUnlockedDocuments,
  markDocumentOpened
} from "@/lib/game-engine";
import type { FeedbackState, GameState } from "@/lib/game-types";
import { useLexQuestAudio } from "@/lib/use-lexquest-audio";

type AppPhase = "home" | "case" | "feedback" | "result";

const caseData = getCaseData();
const steps = getAllSteps();

function buildDefaultAuthState(): AuthSessionPayload {
  return {
    user: null,
    activeGameSession: null
  };
}

function dateLabel(value: string | null) {
  if (!value) {
    return "agora";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("pt-BR");
}

export default function HomePage() {
  const [aiStatus, setAiStatus] = useState<{
    enabled: boolean;
    model: string;
    missingEnv: string[];
  } | null>(null);
  const [phase, setPhase] = useState<AppPhase>("home");
  const [gameState, setGameState] = useState<GameState>(getInitialGameState());
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [selectedFoundations, setSelectedFoundations] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [openDocumentId, setOpenDocumentId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [authState, setAuthState] = useState<AuthSessionPayload>(buildDefaultAuthState);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [isAuthPending, setIsAuthPending] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  const [gameErrorMessage, setGameErrorMessage] = useState<string | null>(null);
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
  const { unlockAudio, playDecisionCommit, playDocumentClose, playDocumentOpen, playTensionPulse } = useLexQuestAudio();

  const user = authState.user;
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

  function resetTransientState() {
    setSelectedChoice(null);
    setSelectedFoundations([]);
    setFreeText("");
    setOpenDocumentId(null);
    setFeedback(null);
  }

  function applyActiveGameSession(activeGameSession: ActiveGameSession | null) {
    if (!activeGameSession) {
      setSessionId(null);
      setGameState(getInitialGameState());
      resetTransientState();
      setPhase("home");
      return;
    }

    setSessionId(activeGameSession.sessionId);
    setGameState(activeGameSession.gameState);
    resetTransientState();
    setPhase(activeGameSession.status === "completed" || activeGameSession.gameState.current_step >= 6 ? "result" : "case");
  }

  function applyAuthPayload(payload: AuthSessionPayload) {
    setAuthState(payload);
    applyActiveGameSession(payload.activeGameSession);
  }

  function updateActiveSessionState(nextState: GameState) {
    setAuthState((current) => ({
      ...current,
      activeGameSession:
        current.activeGameSession && sessionId
          ? {
              ...current.activeGameSession,
              sessionId,
              gameState: nextState,
              status: nextState.current_step >= 6 ? "completed" : "in_progress",
              updatedAt: new Date().toISOString()
            }
          : current.activeGameSession
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

    updateActiveSessionState(nextState);
  }

  async function startCase(restart = false) {
    if (!user) {
      return;
    }

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
          restart
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Nao foi possivel iniciar a sessao do caso.");
      }

      const payload = (await response.json()) as ActiveGameSession;

      setAuthState((current) => ({
        ...current,
        activeGameSession: payload
      }));
      applyActiveGameSession(payload);
      playTensionPulse();
    } catch (error) {
      setGameErrorMessage(error instanceof Error ? error.message : "Falha inesperada ao iniciar o caso.");
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
      setGameErrorMessage(`Selecione entre ${minFoundations} e ${maxFoundations} fundamentos antes de confirmar.`);
      return;
    }

    setIsPending(true);
    setGameErrorMessage(null);

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
      setFreeText("");
      setPhase("feedback");
      playDecisionCommit();
    } catch (error) {
      setGameErrorMessage(error instanceof Error ? error.message : "Falha inesperada ao salvar a escolha.");
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
        <div className="w-full rounded-[36px] border border-ink/10 bg-white/75 p-8 shadow-dossier">
          Carregando conta e progresso salvo...
        </div>
      </main>
    );
  }

  if (phase === "home") {
    return (
      <main className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[40px] border border-ink/10 bg-white/70 p-8 shadow-dossier backdrop-blur">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-ink/45">LexQuest MVP</p>
                <h1 className="mt-4 max-w-3xl font-serifDisplay text-5xl leading-tight text-ink">
                  Habeas Corpus em 48h
                </h1>
              </div>
              {user ? (
                <div className="rounded-[24px] border border-ink/10 bg-parchment/55 px-4 py-3 text-sm text-ink/80">
                  <p className="font-semibold">@{user.username}</p>
                  <p className="capitalize">{user.role}</p>
                </div>
              ) : null}
            </div>

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

            <div
              className={`mt-6 rounded-[24px] border p-4 text-sm leading-7 ${
                aiStatus?.enabled ? "border-emerald/25 bg-emerald/10 text-ink" : "border-garnet/25 bg-garnet/10 text-ink"
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

            {user ? (
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  className="rounded-full bg-ink px-7 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-parchment transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:bg-ink/40"
                  disabled={isPending}
                  onClick={() => startCase(false)}
                  type="button"
                >
                  {isPending ? "Abrindo sessao..." : "Iniciar caso"}
                </button>
                {user.role === "admin" ? (
                  <Link
                    className="inline-flex rounded-full border border-ink/10 px-7 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-ink transition hover:bg-ink/5"
                    href="/creator"
                  >
                    Abrir central admin
                  </Link>
                ) : null}
                <button
                  className="rounded-full border border-ink/10 px-7 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-ink transition hover:bg-ink/5"
                  disabled={isAuthPending}
                  onClick={logout}
                  type="button"
                >
                  Sair
                </button>
              </div>
            ) : null}

            {gameErrorMessage ? <p className="mt-4 text-sm text-garnet">{gameErrorMessage}</p> : null}
            {authErrorMessage && user ? <p className="mt-4 text-sm text-garnet">{authErrorMessage}</p> : null}
          </div>

          <aside className="rounded-[40px] border border-ink/10 bg-[#1f232b] p-8 text-parchment shadow-dossier">
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
                      className="w-full rounded-2xl border border-white/15 bg-white/12 px-4 py-3 text-sm text-white outline-none placeholder:text-parchment/70"
                      onChange={(event) => setRegisterForm((current) => ({ ...current, username: event.target.value }))}
                      placeholder="Username"
                      value={registerForm.username}
                    />
                    <input
                      className="w-full rounded-2xl border border-white/15 bg-white/12 px-4 py-3 text-sm text-white outline-none placeholder:text-parchment/70"
                      onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
                      placeholder="Email"
                      type="email"
                      value={registerForm.email}
                    />
                    <input
                      className="w-full rounded-2xl border border-white/15 bg-white/12 px-4 py-3 text-sm text-white outline-none placeholder:text-parchment/70"
                      onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                      placeholder="Senha"
                      type="password"
                      value={registerForm.password}
                    />
                    <input
                      className="w-full rounded-2xl border border-white/15 bg-white/12 px-4 py-3 text-sm text-white outline-none placeholder:text-parchment/70"
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
                      className="w-full rounded-2xl border border-white/15 bg-white/12 px-4 py-3 text-sm text-white outline-none placeholder:text-parchment/70"
                      onChange={(event) => setLoginForm((current) => ({ ...current, login: event.target.value }))}
                      placeholder="Email ou username"
                      value={loginForm.login}
                    />
                    <input
                      className="w-full rounded-2xl border border-white/15 bg-white/12 px-4 py-3 text-sm text-white outline-none placeholder:text-parchment/70"
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

                <div className="mt-5 rounded-[24px] bg-white/8 p-5 text-sm leading-7 text-parchment/85">
                  A primeira conta criada vira admin automaticamente para liberar a central administrativa.
                </div>
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
                      Nenhuma sessao em andamento no momento. Inicie o caso para salvar seu progresso nesta conta.
                    </p>
                  </div>
                </div>
              </>
            )}
          </aside>
        </section>
      </main>
    );
  }

  if (phase === "result") {
    return (
      <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-ink/10 bg-white/70 px-5 py-4 shadow-dossier">
          <div className="text-sm text-ink/72">
            Conta: <strong>@{user?.username}</strong>
          </div>
          <div className="flex flex-wrap gap-3">
            {user?.role === "admin" ? (
              <Link
                className="rounded-full border border-ink/10 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-ink/5"
                href="/creator"
              >
                Central admin
              </Link>
            ) : null}
            <button
              className="rounded-full border border-ink/10 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-ink/5"
              disabled={isAuthPending}
              onClick={logout}
              type="button"
            >
              Sair
            </button>
          </div>
        </div>
        <FinalReport gameState={gameState} onRestart={() => void startCase(true)} report={finalReport} />
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
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-ink/10 bg-white/70 px-5 py-4 shadow-dossier">
          <div className="text-sm text-ink/72">
            Conta: <strong>@{user?.username}</strong> {authState.activeGameSession ? `| salvo em ${dateLabel(authState.activeGameSession.updatedAt)}` : ""}
          </div>
          <div className="flex flex-wrap gap-3">
            {user?.role === "admin" ? (
              <Link
                className="rounded-full border border-ink/10 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-ink/5"
                href="/creator"
              >
                Central admin
              </Link>
            ) : null}
            <button
              className="rounded-full border border-ink/10 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-ink/5"
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

        {gameErrorMessage ? <p className="mt-4 text-sm text-garnet">{gameErrorMessage}</p> : null}
      </main>

      {activeDocument ? <DocumentModal document={activeDocument} onClose={handleCloseDocument} /> : null}
    </>
  );
}
