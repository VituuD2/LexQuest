import { ChoiceButton } from "@/components/ChoiceButton";
import type { Step } from "@/lib/game-types";

type StepCardProps = {
  step: Step;
  selectedChoice: string | null;
  freeText: string;
  onSelectChoice: (choiceKey: string) => void;
  onFreeTextChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
};

export function StepCard({
  step,
  selectedChoice,
  freeText,
  onSelectChoice,
  onFreeTextChange,
  onSubmit,
  disabled
}: StepCardProps) {
  const isFreeTextStep = step.free_text?.enabled;
  const canSubmit = isFreeTextStep ? freeText.trim().length > 0 : Boolean(selectedChoice);

  return (
    <section className="rounded-[32px] border border-ink/10 bg-white/75 p-6 shadow-dossier">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink/45">Etapa {step.step_number}</p>
          <h2 className="mt-2 font-serifDisplay text-3xl text-ink">{step.title}</h2>
        </div>
        <div className="max-w-sm rounded-2xl border border-brass/30 bg-brass/10 px-4 py-3 text-xs uppercase tracking-[0.14em] text-ink/70">
          Objetivo: {step.objective}
        </div>
      </div>

      <div className="mb-5 rounded-[24px] bg-parchment/60 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink/45">Situacao</p>
        <p className="mt-3 text-sm leading-7 text-ink/85">{step.situation}</p>
      </div>

      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink/45">Pergunta</p>
        <h3 className="mt-2 text-xl font-semibold text-ink">{step.question}</h3>
      </div>

      {isFreeTextStep ? (
        <div className="space-y-3">
          <textarea
            className="min-h-[220px] w-full rounded-[24px] border border-ink/10 bg-[#fffdf8] px-5 py-4 text-sm leading-7 text-ink outline-none transition focus:border-brass/60"
            onChange={(event) => onFreeTextChange(event.target.value)}
            placeholder="Redija aqui o argumento liminar com base nos documentos do caso."
            value={freeText}
          />
          <p className="text-xs text-ink/55">
            Avaliacao local provisoria por rubrica. Na proxima sprint, este campo podera ser corrigido por IA.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {step.options.map((option) => (
            <ChoiceButton
              choiceKey={option.key}
              isSelected={selectedChoice === option.key}
              key={option.key}
              onClick={() => onSelectChoice(option.key)}
              text={option.text}
            />
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-parchment transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:bg-ink/40"
          disabled={!canSubmit || disabled}
          onClick={onSubmit}
          type="button"
        >
          Confirmar decisao
        </button>
      </div>
    </section>
  );
}
