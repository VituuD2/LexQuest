import { ChoiceButton } from "@/components/ChoiceButton";
import type { Foundation, Step } from "@/lib/game-types";

type StepCardProps = {
  step: Step;
  foundations: Foundation[];
  selectedChoice: string | null;
  selectedFoundations: string[];
  freeText: string;
  onSelectChoice: (choiceKey: string) => void;
  onToggleFoundation: (foundationId: string) => void;
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

export function StepCard({
  step,
  foundations,
  selectedChoice,
  selectedFoundations,
  freeText,
  onSelectChoice,
  onToggleFoundation,
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
  const canSubmit = isFreeTextStep ? freeText.trim().length > 0 && validFoundationCount : Boolean(selectedChoice) && validFoundationCount;

  return (
    <section className="rounded-[32px] border border-ink/10 bg-white/75 p-6 shadow-dossier">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink/45">Etapa {step.step_number}</p>
          <h2 className="mt-2 font-serifDisplay text-3xl text-ink">{step.title}</h2>
        </div>
        <div className="max-w-sm rounded-2xl border border-brass/30 bg-brass/10 px-4 py-3 text-xs uppercase tracking-[0.14em] text-ink/70">
          Objetivo pedagogico: {step.objective}
        </div>
      </div>

      <div className="mb-5 rounded-[24px] bg-parchment/60 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink/45">Contexto do plantao</p>
        <div className="mt-3 whitespace-pre-line text-sm leading-7 text-ink/85">{step.situation}</div>
      </div>

      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink/45">Pergunta decisoria</p>
        <h3 className="mt-2 text-xl font-semibold text-ink">{step.question}</h3>
      </div>

      {isFreeTextStep ? (
        <div className="space-y-3">
          <textarea
            className="min-h-[240px] w-full rounded-[24px] border border-ink/10 bg-[#fffdf8] px-5 py-4 text-sm leading-7 text-ink outline-none transition focus:border-brass/60"
            onChange={(event) => onFreeTextChange(event.target.value)}
            placeholder="Doutor(a), redija aqui o argumento liminar com foco em cautelaridade, proporcionalidade e aderencia aos autos."
            value={freeText}
          />
          <p className="text-xs text-ink/55">
            A avaliacao do texto continua local nesta sprint, mas a selecao de fundamentos ja impacta o placar do caso.
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
        <div className="mt-7 rounded-[28px] border border-ink/10 bg-[#fffdf8]/85 p-5">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink/45">Fase 2</p>
            <h3 className="mt-2 font-serifDisplay text-2xl text-ink">Selecao de fundamentos</h3>
            <p className="mt-2 text-sm leading-7 text-ink/75">{step.foundation_selection.prompt}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-ink/45">
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
                      ? "border-brass bg-brass/14 shadow-dossier"
                      : "border-ink/10 bg-white hover:border-brass/45"
                  }`}
                  key={foundation.id}
                  onClick={() => onToggleFoundation(foundation.id)}
                  type="button"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h4 className="text-base font-semibold text-ink">{foundation.label}</h4>
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${riskTone(foundation.risk)}`}>
                      risco {foundation.risk}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-ink/75">{foundation.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex justify-end">
        <button
          className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-parchment transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:bg-ink/40"
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
