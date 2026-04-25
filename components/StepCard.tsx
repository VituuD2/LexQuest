import { ChoiceButton } from "@/components/ChoiceButton";
import type { CaseDocument, Foundation, Step } from "@/lib/game-types";

type StepCardProps = {
  step: Step;
  foundations: Foundation[];
  documents: CaseDocument[];
  selectedChoice: string | null;
  selectedFoundations: string[];
  selectedDocumentIds: string[];
  freeText: string;
  onSelectChoice: (choiceKey: string) => void;
  onToggleFoundation: (foundationId: string) => void;
  onToggleDocument: (documentId: string) => void;
  onOpenDocument: (documentId: string) => void;
  onFreeTextChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
};

function riskTone(risk: Foundation["risk"]) {
  if (risk === "alto") {
    return "border-garnet/35 bg-garnet/10 text-garnet";
  }

  if (risk === "medio") {
    return "border-brass/35 bg-brass/10 text-[#8d641c]";
  }

  return "border-emerald/35 bg-emerald/10 text-emerald";
}

function documentSummary(document: CaseDocument) {
  const rawSummary = document.content || document.sections?.[0]?.body || "";

  if (rawSummary.length <= 180) {
    return rawSummary;
  }

  return `${rawSummary.slice(0, 177).trim()}...`;
}

export function StepCard({
  step,
  foundations,
  documents,
  selectedChoice,
  selectedFoundations,
  selectedDocumentIds,
  freeText,
  onSelectChoice,
  onToggleFoundation,
  onToggleDocument,
  onOpenDocument,
  onFreeTextChange,
  onSubmit,
  disabled
}: StepCardProps) {
  const isFreeTextStep = step.free_text?.enabled;
  const minFoundations = step.foundation_selection?.min ?? 0;
  const maxFoundations = step.foundation_selection?.max ?? 0;
  const validFoundationCount =
    !step.foundation_selection?.enabled ||
    (selectedFoundations.length >= minFoundations && selectedFoundations.length <= maxFoundations);
  const minDocuments = step.document_selection?.min ?? 0;
  const maxDocuments = step.document_selection?.max ?? 0;
  const documentSelection = step.document_selection;
  const validDocumentCount =
    !documentSelection?.enabled ||
    (selectedDocumentIds.length >= minDocuments && selectedDocumentIds.length <= maxDocuments);
  const selectableDocumentIds = documentSelection?.enabled
    ? [...documentSelection.relevant_document_ids, ...documentSelection.risky_document_ids]
    : [];
  const selectableDocuments = documents.filter((document) => selectableDocumentIds.includes(document.id));
  const canSubmit = isFreeTextStep
    ? freeText.trim().length > 0 && validFoundationCount && validDocumentCount
    : Boolean(selectedChoice) && validFoundationCount && validDocumentCount;

  return (
    <section className="theme-panel rounded-[32px] border p-6 text-[color:var(--text-primary)]">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--text-muted)]">Etapa {step.step_number}</p>
          <h2 className="mt-2 font-serifDisplay text-3xl text-[color:var(--text-primary)]">{step.title}</h2>
        </div>
        <div className="max-w-sm rounded-2xl border border-brass/30 bg-brass/10 px-4 py-3 text-xs uppercase tracking-[0.14em] text-[color:var(--text-secondary)]">
          Objetivo pedagogico: {step.objective}
        </div>
      </div>

      <div className="theme-card-muted mb-5 rounded-[24px] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--text-muted)]">Contexto do plantao</p>
        <div className="mt-3 whitespace-pre-line text-sm leading-7 text-[color:var(--text-secondary)]">{step.situation}</div>
      </div>

      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--text-muted)]">Pergunta decisoria</p>
        <h3 className="mt-2 text-xl font-semibold text-[color:var(--text-primary)]">{step.question}</h3>
      </div>

      {isFreeTextStep ? (
        <div className="space-y-3">
          <textarea
            className="theme-input min-h-[240px] w-full rounded-[24px] border px-5 py-4 text-sm leading-7 outline-none transition focus:border-brass/60"
            onChange={(event) => onFreeTextChange(event.target.value)}
            placeholder="Doutor(a), redija aqui o argumento liminar com foco em cautelaridade, proporcionalidade e aderencia aos autos."
            value={freeText}
          />
          <p className="text-xs text-[color:var(--text-muted)]">
            O texto sera avaliado pela rubrica local e, quando a IA estiver habilitada no servidor, tambem recebera parecer tecnico complementar.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {step.options.map((option) => (
            <ChoiceButton
              choiceKey={option.key}
              isSelected={selectedChoice === option.key}
              key={option.key}
              label={option.label}
              onClick={() => onSelectChoice(option.key)}
              text={option.text}
            />
          ))}
        </div>
      )}

      {step.foundation_selection?.enabled ? (
        <div className="theme-card mt-7 rounded-[28px] border p-5">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--text-muted)]">
              Etapa complementar
            </p>
            <h3 className="mt-2 font-serifDisplay text-2xl text-[color:var(--text-primary)]">Selecao de fundamentos</h3>
            <p className="mt-2 text-sm leading-7 text-[color:var(--text-secondary)]">{step.foundation_selection.prompt}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
              Selecionados: {selectedFoundations.length} de {step.foundation_selection.min} a {step.foundation_selection.max}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {foundations.map((foundation) => {
              const isSelected = selectedFoundations.includes(foundation.id);

              return (
                <button
                  className={`rounded-3xl border p-4 text-left transition ${
                    isSelected
                      ? "border-brass bg-brass/14 shadow-[var(--shadow-dossier-theme)]"
                      : "theme-card hover:border-brass/45 hover:bg-[var(--surface-card-strong)]"
                  }`}
                  key={foundation.id}
                  onClick={() => onToggleFoundation(foundation.id)}
                  type="button"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h4 className="text-base font-semibold text-[color:var(--text-primary)]">{foundation.label}</h4>
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${riskTone(foundation.risk)}`}>
                      risco {foundation.risk}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">{foundation.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {step.document_selection?.enabled ? (
        <div className="theme-card mt-7 rounded-[28px] border p-5">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--text-muted)]">
              Prova documental
            </p>
            <h3 className="mt-2 font-serifDisplay text-2xl text-[color:var(--text-primary)]">Selecao de prova documental</h3>
            <p className="mt-2 text-sm leading-7 text-[color:var(--text-secondary)]">{step.document_selection.prompt}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
              Selecionados: {selectedDocumentIds.length} de {step.document_selection.min} a {step.document_selection.max}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {selectableDocuments.map((document) => {
              const isSelected = selectedDocumentIds.includes(document.id);
              const isRisky = step.document_selection?.risky_document_ids.includes(document.id);

              return (
                <div
                  className={`rounded-3xl border p-4 transition ${
                    isSelected
                      ? "border-brass bg-brass/14 shadow-[var(--shadow-dossier-theme)]"
                      : "theme-card hover:border-brass/45 hover:bg-[var(--surface-card-strong)]"
                  }`}
                  key={document.id}
                >
                  <button className="w-full text-left" onClick={() => onToggleDocument(document.id)} type="button">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base font-semibold text-[color:var(--text-primary)]">{document.title}</h4>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[color:var(--text-muted)]">{document.type}</p>
                      </div>
                      {isRisky ? (
                        <span className="rounded-full border border-brass/35 bg-brass/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8d641c]">
                          uso sensivel
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">{documentSummary(document)}</p>
                  </button>
                  <button
                    className="theme-button-secondary mt-4 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition"
                    onClick={() => onOpenDocument(document.id)}
                    type="button"
                  >
                    Abrir documento completo
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex justify-end">
        <button
          className="theme-button-primary rounded-full px-6 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!canSubmit || disabled}
          onClick={onSubmit}
          type="button"
        >
          Confirmar estrategia
        </button>
      </div>
    </section>
  );
}
