"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { AdminUserRecord, AuthenticatedUser, UserRole } from "@/lib/auth-types";
import type { PhaseBuilderBlock } from "@/lib/phase-authoring";
import { blocksToStepDraft, parseJsonStepDraft } from "@/lib/phase-authoring";
import type { Step } from "@/lib/game-types";

type AuthoringStepBundle = {
  stepNumber: number;
  stepId: string;
  mode: "blocks" | "json";
  blocks: PhaseBuilderBlock[];
  rawJson: string;
  previewStep: Step;
  validation: {
    isValid: boolean;
    issues: string[];
  };
  updatedAt: string;
};

type AuthoringBundle = {
  caseId: string;
  caseTitle: string;
  supportedInputs: Array<"blocks" | "json">;
  defaultMode: "blocks" | "json";
  version: {
    id: string;
    number: number;
    label: string;
    sourceMode: "blocks" | "json";
    status: "draft" | "published" | "archived";
    updatedAt: string;
  };
  steps: AuthoringStepBundle[];
};

type DraftReview = {
  summary: string;
  strengths: string[];
  risks: string[];
  suggestions: string[];
};

type LevelCreatorAppProps = {
  currentUser: AuthenticatedUser;
};

const CASE_ID = "hc_48h_001";

function createBlock(type: PhaseBuilderBlock["type"]): PhaseBuilderBlock {
  return {
    id: `${type}_${crypto.randomUUID()}`,
    type,
    content: "",
    meta: type === "option" ? { key: "A", label: "Nova alternativa" } : undefined
  };
}

function dateLabel(value: string | null) {
  if (!value) {
    return "ainda sem registro";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("pt-BR");
}

export function LevelCreatorApp({ currentUser }: LevelCreatorAppProps) {
  const [bundle, setBundle] = useState<AuthoringBundle | null>(null);
  const [selectedStepNumber, setSelectedStepNumber] = useState<number>(1);
  const [mode, setMode] = useState<"blocks" | "json">("blocks");
  const [blocks, setBlocks] = useState<PhaseBuilderBlock[]>([]);
  const [rawJson, setRawJson] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [draftReview, setDraftReview] = useState<DraftReview | null>(null);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, UserRole>>({});
  const [isUpdatingUserId, setIsUpdatingUserId] = useState<string | null>(null);
  const [userMessage, setUserMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadBundle() {
      setIsLoading(true);
      setErrorMessage(null);
      setUserMessage(null);

      try {
        const [bundleResponse, usersResponse] = await Promise.all([
          fetch(`/api/authoring/cases/${CASE_ID}`),
          fetch("/api/admin/users")
        ]);

        if (!bundleResponse.ok) {
          throw new Error("Nao foi possivel carregar o criador de fases.");
        }

        if (!usersResponse.ok) {
          throw new Error("Nao foi possivel carregar os usuarios cadastrados.");
        }

        const bundlePayload = (await bundleResponse.json()) as AuthoringBundle;
        const usersPayload = (await usersResponse.json()) as {
          users: AdminUserRecord[];
        };

        setBundle(bundlePayload);
        setSelectedStepNumber(bundlePayload.steps[0]?.stepNumber ?? 1);
        setUsers(usersPayload.users);
        setRoleDrafts(
          usersPayload.users.reduce<Record<string, UserRole>>((accumulator, user) => {
            accumulator[user.id] = user.role;
            return accumulator;
          }, {})
        );
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Falha inesperada ao carregar o criador.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadBundle();
  }, []);

  const selectedStep = useMemo(
    () => bundle?.steps.find((step) => step.stepNumber === selectedStepNumber) ?? null,
    [bundle, selectedStepNumber]
  );

  useEffect(() => {
    if (!selectedStep) {
      return;
    }

    setMode(selectedStep.mode);
    setBlocks(selectedStep.blocks);
    setRawJson(selectedStep.rawJson);
    setDraftReview(null);
    setSuccessMessage(null);
  }, [selectedStep]);

  const previewStep = useMemo(() => {
    if (!selectedStep) {
      return null;
    }

    return mode === "blocks"
      ? blocksToStepDraft(selectedStep.previewStep, blocks)
      : parseJsonStepDraft(rawJson, selectedStep.previewStep);
  }, [blocks, mode, rawJson, selectedStep]);

  const validationIssues = useMemo(() => {
    if (!previewStep) {
      return [];
    }

    const issues: string[] = [];

    if (!previewStep.title.trim()) {
      issues.push("Titulo vazio.");
    }
    if (!previewStep.situation.trim()) {
      issues.push("Contexto vazio.");
    }
    if (!previewStep.question.trim()) {
      issues.push("Pergunta vazia.");
    }
    if (!previewStep.free_text?.enabled && previewStep.step_number !== 6 && previewStep.options.length === 0) {
      issues.push("A etapa precisa de alternativas.");
    }

    return issues;
  }, [previewStep]);

  function updateBlock(blockId: string, patch: Partial<PhaseBuilderBlock>) {
    setBlocks((current) =>
      current.map((block) => {
        if (block.id !== blockId) {
          return block;
        }

        return {
          ...block,
          ...patch,
          meta: patch.meta ? { ...block.meta, ...patch.meta } : block.meta
        };
      })
    );
  }

  function removeBlock(blockId: string) {
    setBlocks((current) => current.filter((block) => block.id !== blockId));
  }

  function addBlock(type: PhaseBuilderBlock["type"]) {
    setBlocks((current) => [...current, createBlock(type)]);
  }

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST"
    });

    window.location.href = "/";
  }

  async function saveStep() {
    if (!selectedStep) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/authoring/cases/${CASE_ID}/steps/${selectedStep.stepNumber}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mode,
          blocks,
          rawJson
        })
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel salvar esta etapa.");
      }

      const payload = (await response.json()) as AuthoringStepBundle;

      setBundle((current) =>
        current
          ? {
              ...current,
              version: {
                ...current.version,
                sourceMode: mode,
                updatedAt: new Date().toISOString()
              },
              steps: current.steps.map((step) =>
                step.stepNumber === selectedStep.stepNumber
                  ? {
                      ...step,
                      mode: payload.mode,
                      blocks: payload.blocks,
                      rawJson: payload.rawJson,
                      previewStep: payload.previewStep,
                      validation: payload.validation,
                      updatedAt: new Date().toISOString()
                    }
                  : step
              )
            }
          : current
      );

      setSuccessMessage("Etapa salva no rascunho atual.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Falha inesperada ao salvar a etapa.");
    } finally {
      setIsSaving(false);
    }
  }

  async function reviewWithAi() {
    if (!previewStep) {
      return;
    }

    setIsReviewing(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/authoring/review-step", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ step: previewStep })
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Nao foi possivel revisar a etapa com IA.");
      }

      const payload = (await response.json()) as DraftReview;
      setDraftReview(payload);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Falha inesperada na revisao por IA.");
    } finally {
      setIsReviewing(false);
    }
  }

  async function saveUserRole(userId: string) {
    setIsUpdatingUserId(userId);
    setUserMessage(null);
    setErrorMessage(null);

    try {
      const nextRole = roleDrafts[userId];

      if (!nextRole) {
        throw new Error("Selecione uma permissao valida antes de salvar.");
      }

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          role: nextRole
        })
      });

      const payload = (await response.json()) as AdminUserRecord & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Nao foi possivel atualizar a permissao.");
      }

      setUsers((current) => current.map((user) => (user.id === userId ? payload : user)));
      setRoleDrafts((current) => ({
        ...current,
        [userId]: payload.role
      }));
      setUserMessage(`Permissao de @${payload.username} atualizada para ${payload.role}.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Falha inesperada ao atualizar permissao.");
    } finally {
      setIsUpdatingUserId(null);
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto min-h-screen max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="theme-panel rounded-[32px] border p-8 text-[color:var(--text-primary)]">Carregando criador...</div>
      </main>
    );
  }

  if (!bundle || !selectedStep || !previewStep) {
    return (
      <main className="mx-auto min-h-screen max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-garnet/20 bg-garnet/10 p-8 text-garnet">
          {errorMessage ?? "Nao foi possivel iniciar o criador de fases."}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="theme-panel mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[36px] border p-6 text-[color:var(--text-primary)]">
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-[color:var(--text-muted)]">Studio LexQuest</p>
          <h1 className="mt-2 font-serifDisplay text-4xl text-[color:var(--text-primary)]">Criador de fases</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--text-secondary)]">
            Edite as etapas em blocos guiados ou JSON bruto, salve no rascunho do Supabase e use a IA para revisar clareza, realismo e dificuldade.
            A numeracao de cada etapa tambem define a fase inicial exibida para o jogador na home.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="theme-pill rounded-2xl border px-4 py-3 text-sm text-[color:var(--text-secondary)]">
            Admin logado: @{currentUser.username}
          </div>
          <Link
            className="theme-button-secondary rounded-full border px-4 py-3 text-sm font-semibold transition"
            href="/"
          >
            Voltar ao caso
          </Link>
          <button
            className="theme-button-secondary rounded-full border px-4 py-3 text-sm font-semibold transition"
            onClick={logout}
            type="button"
          >
            Sair
          </button>
          <div className="rounded-2xl border border-brass/25 bg-brass/10 px-4 py-3 text-sm text-[color:var(--text-secondary)]">
            {bundle.version.label} | {bundle.version.status} | atualizada em {dateLabel(bundle.version.updatedAt)}
          </div>
        </div>
      </div>

      <section className="theme-panel mb-6 rounded-[32px] border p-6 text-[color:var(--text-primary)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--text-muted)]">Central admin</p>
            <h2 className="mt-2 font-serifDisplay text-3xl text-[color:var(--text-primary)]">Permissoes de usuarios</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--text-secondary)]">
              Somente admins acessam esta tela. Aqui voce promove ou rebaixa usuarios cadastrados sem perder o progresso salvo de cada conta.
            </p>
          </div>
          <div className="theme-pill rounded-2xl border px-4 py-3 text-sm text-[color:var(--text-secondary)]">
            Contas cadastradas: {users.length}
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {users.map((managedUser) => (
            <div
              className="theme-card grid gap-4 rounded-[28px] border p-5 text-[color:var(--text-primary)] lg:grid-cols-[1.5fr_0.8fr_0.9fr_0.8fr]"
              key={managedUser.id}
            >
              <div>
                <p className="text-lg font-semibold text-[color:var(--text-primary)]">@{managedUser.username}</p>
                <p className="mt-1 text-sm text-[color:var(--text-secondary)]">{managedUser.email}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
                  Criado em {dateLabel(managedUser.createdAt)} | ultimo acesso {dateLabel(managedUser.lastLoginAt)}
                </p>
              </div>

              <div className="theme-card-muted rounded-[22px] p-4 text-sm text-[color:var(--text-secondary)]">
                <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--text-muted)]">Status</p>
                <p className="mt-2 font-semibold">{managedUser.isActive ? "Ativo" : "Inativo"}</p>
              </div>

              <div className="theme-card-muted rounded-[22px] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--text-muted)]">Permissao</p>
                <select
                  className="theme-input mt-3 w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                  onChange={(event) =>
                    setRoleDrafts((current) => ({
                      ...current,
                      [managedUser.id]: event.target.value as UserRole
                    }))
                  }
                  value={roleDrafts[managedUser.id] ?? managedUser.role}
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  className="theme-button-primary w-full rounded-full px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={
                    isUpdatingUserId === managedUser.id ||
                    !roleDrafts[managedUser.id] ||
                    roleDrafts[managedUser.id] === managedUser.role
                  }
                  onClick={() => saveUserRole(managedUser.id)}
                  type="button"
                >
                  {isUpdatingUserId === managedUser.id ? "Salvando..." : "Salvar permissao"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {userMessage ? <p className="mt-4 text-sm text-emerald">{userMessage}</p> : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.32fr_0.68fr]">
        <aside className="theme-panel rounded-[32px] border p-5 text-[color:var(--text-primary)]">
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--text-muted)]">Etapas do caso</p>
          <div className="mt-4 space-y-3">
            {bundle.steps.map((step) => (
              <button
                className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                  step.stepNumber === selectedStepNumber
                    ? "border-brass bg-brass/12 shadow-[var(--shadow-dossier-theme)]"
                    : "theme-card-muted border-[color:var(--border-soft)] hover:border-brass/45"
                }`}
                key={step.stepNumber}
                onClick={() => setSelectedStepNumber(step.stepNumber)}
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[color:var(--text-primary)]">Etapa {step.stepNumber} · Fase {step.stepNumber}</p>
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                      step.validation.isValid ? "bg-emerald/12 text-emerald" : "bg-garnet/12 text-garnet"
                    }`}
                  >
                    {step.validation.isValid ? "ok" : "ajustar"}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">{step.previewStep.title}</p>
              </button>
            ))}
          </div>
        </aside>

        <section className="space-y-6">
          <div className="theme-panel rounded-[32px] border p-6 text-[color:var(--text-primary)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--text-muted)]">Etapa {selectedStep.stepNumber} · Fase {selectedStep.stepNumber}</p>
                <h2 className="mt-2 font-serifDisplay text-3xl text-[color:var(--text-primary)]">{previewStep.title || "Nova etapa"}</h2>
              </div>
              <div className="theme-pill flex gap-2 rounded-full border p-1">
                {bundle.supportedInputs.map((supportedMode) => (
                  <button
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      mode === supportedMode ? "bg-ink text-parchment" : "text-[color:var(--text-secondary)]"
                    }`}
                    key={supportedMode}
                    onClick={() => setMode(supportedMode)}
                    type="button"
                  >
                    {supportedMode === "blocks" ? "Blocos" : "JSON"}
                  </button>
                ))}
              </div>
            </div>

            {mode === "blocks" ? (
              <div className="mt-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {(["title", "situation", "question", "objective", "option", "foundation_prompt", "note", "result_band"] as const).map((blockType) => (
                    <button
                      className="theme-button-secondary rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition hover:border-brass/40 hover:bg-brass/10"
                      key={blockType}
                      onClick={() => addBlock(blockType)}
                      type="button"
                    >
                      + {blockType}
                    </button>
                  ))}
                </div>

                {blocks.map((block) => (
                  <div className="theme-card rounded-[24px] border p-4" key={block.id}>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="theme-pill rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
                        {block.type}
                      </div>
                      <button
                        className="text-xs font-semibold uppercase tracking-[0.14em] text-garnet"
                        onClick={() => removeBlock(block.id)}
                        type="button"
                      >
                        Remover
                      </button>
                    </div>

                    {block.type === "option" ? (
                      <div className="mb-3 grid gap-3 md:grid-cols-2">
                        <input
                          className="theme-input rounded-2xl border px-4 py-3 text-sm outline-none"
                          onChange={(event) =>
                            updateBlock(block.id, {
                              meta: {
                                ...block.meta,
                                key: event.target.value
                              }
                            })
                          }
                          placeholder="Chave"
                          value={String(block.meta?.key ?? "")}
                        />
                        <input
                          className="theme-input rounded-2xl border px-4 py-3 text-sm outline-none"
                          onChange={(event) =>
                            updateBlock(block.id, {
                              meta: {
                                ...block.meta,
                                label: event.target.value
                              }
                            })
                          }
                          placeholder="Label"
                          value={String(block.meta?.label ?? "")}
                        />
                        <input
                          className="theme-input rounded-2xl border px-4 py-3 text-sm outline-none"
                          onChange={(event) =>
                            updateBlock(block.id, {
                              meta: {
                                ...block.meta,
                                next_step: event.target.value
                              }
                            })
                          }
                          placeholder="Proxima etapa (ex: 4)"
                          value={String(block.meta?.next_step ?? "")}
                        />
                        <input
                          className="theme-input rounded-2xl border px-4 py-3 text-sm outline-none"
                          onChange={(event) =>
                            updateBlock(block.id, {
                              meta: {
                                ...block.meta,
                                ending_key: event.target.value
                              }
                            })
                          }
                          placeholder="Ending key opcional"
                          value={String(block.meta?.ending_key ?? "")}
                        />
                        <input
                          className="theme-input rounded-2xl border px-4 py-3 text-sm outline-none md:col-span-2"
                          onChange={(event) =>
                            updateBlock(block.id, {
                              meta: {
                                ...block.meta,
                                unlock_documents: event.target.value
                              }
                            })
                          }
                          placeholder="Documentos liberados por esta rota (doc_009, doc_010)"
                          value={
                            Array.isArray(block.meta?.unlock_documents)
                              ? block.meta?.unlock_documents.join(", ")
                              : String(block.meta?.unlock_documents ?? "")
                          }
                        />
                        <input
                          className="theme-input rounded-2xl border px-4 py-3 text-sm outline-none md:col-span-2"
                          onChange={(event) =>
                            updateBlock(block.id, {
                              meta: {
                                ...block.meta,
                                set_flags: event.target.value
                              }
                            })
                          }
                          placeholder="Flags ativadas por esta rota (rota_hc_plantao, tese_escalonada)"
                          value={
                            Array.isArray(block.meta?.set_flags)
                              ? block.meta?.set_flags.join(", ")
                              : String(block.meta?.set_flags ?? "")
                          }
                        />
                      </div>
                    ) : null}

                    <textarea
                      className="theme-input min-h-[120px] w-full rounded-[20px] border px-4 py-3 text-sm leading-7 outline-none"
                      onChange={(event) => updateBlock(block.id, { content: event.target.value })}
                      placeholder="Conteudo do bloco"
                      value={block.content}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <textarea
                className="theme-code-surface mt-6 min-h-[520px] w-full rounded-[24px] border border-[color:var(--border-soft)] px-5 py-4 font-mono text-sm leading-7 text-parchment outline-none"
                onChange={(event) => setRawJson(event.target.value)}
                value={rawJson}
              />
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="theme-button-primary rounded-full px-6 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40"
                disabled={isSaving}
                onClick={saveStep}
                type="button"
              >
                {isSaving ? "Salvando..." : "Salvar rascunho"}
              </button>
              <button
                className="rounded-full border border-brass/35 bg-brass/10 px-6 py-3 text-sm font-semibold text-[color:var(--text-primary)] transition hover:bg-brass/20 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isReviewing}
                onClick={reviewWithAi}
                type="button"
              >
                {isReviewing ? "Analisando..." : "Revisar com IA"}
              </button>
            </div>

            {successMessage ? <p className="mt-4 text-sm text-emerald">{successMessage}</p> : null}
            {errorMessage ? <p className="mt-4 text-sm text-garnet">{errorMessage}</p> : null}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="theme-panel rounded-[32px] border p-6 text-[color:var(--text-primary)]">
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--text-muted)]">Preview estruturado</p>
              <h3 className="mt-2 text-2xl font-semibold text-[color:var(--text-primary)]">{previewStep.title}</h3>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[color:var(--text-secondary)]">{previewStep.question}</p>
              <div className="mt-5 grid gap-3">
                {previewStep.options.map((option) => (
                  <div className="theme-card-muted rounded-2xl border border-[color:var(--border-soft)] p-4" key={option.key}>
                    <p className="text-sm font-semibold text-[color:var(--text-primary)]">
                      {option.key}. {option.label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">{option.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="theme-panel rounded-[32px] border p-6 text-[color:var(--text-primary)]">
                <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--text-muted)]">Validacao rapida</p>
                <p className="mt-3 text-sm leading-7 text-[color:var(--text-secondary)]">
                  {validationIssues.length === 0
                    ? "A estrutura minima da etapa esta consistente para seguir refinando."
                    : "Ainda ha pontos estruturais para ajustar antes de publicar."}
                </p>
                <div className="mt-4 space-y-2">
                  {validationIssues.length === 0 ? (
                    <div className="rounded-2xl bg-emerald/10 px-4 py-3 text-sm text-emerald">
                      Nenhum bloqueio estrutural detectado.
                    </div>
                  ) : (
                    validationIssues.map((issue) => (
                      <div className="rounded-2xl bg-garnet/10 px-4 py-3 text-sm text-garnet" key={issue}>
                        {issue}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="theme-panel rounded-[32px] border p-6 text-[color:var(--text-primary)]">
                <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--text-muted)]">Parecer da IA</p>
                {draftReview ? (
                  <div className="mt-4 space-y-4 text-sm leading-7 text-[color:var(--text-secondary)]">
                    <p>{draftReview.summary}</p>
                    <div>
                      <p className="font-semibold text-[color:var(--text-primary)]">Forcas</p>
                      <div className="mt-2 space-y-2">
                        {draftReview.strengths.map((item) => (
                          <div className="rounded-2xl bg-emerald/10 px-4 py-3 text-emerald" key={item}>
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-[color:var(--text-primary)]">Riscos</p>
                      <div className="mt-2 space-y-2">
                        {draftReview.risks.map((item) => (
                          <div className="rounded-2xl bg-garnet/10 px-4 py-3 text-garnet" key={item}>
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-[color:var(--text-primary)]">Sugestoes</p>
                      <div className="mt-2 space-y-2">
                        {draftReview.suggestions.map((item) => (
                          <div className="rounded-2xl bg-brass/10 px-4 py-3 text-[color:var(--text-primary)]" key={item}>
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-7 text-[color:var(--text-secondary)]">
                    Use "Revisar com IA" para receber leitura tecnica sobre realismo, dificuldade, coerencia e valor pedagogico da etapa.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
