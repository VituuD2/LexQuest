import type { FeedbackState } from "@/lib/game-types";

type FeedbackPanelProps = {
  feedback: FeedbackState;
  onContinue: () => void;
  isFinalStep: boolean;
};

export function FeedbackPanel({ feedback, onContinue, isFinalStep }: FeedbackPanelProps) {
  return (
    <section className="rounded-[32px] border border-ink/10 bg-[#1d2128] p-6 text-parchment shadow-dossier">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-parchment/55">Feedback</p>
          <h2 className="mt-2 font-serifDisplay text-3xl">{feedback.title}</h2>
        </div>
        <div className="rounded-full border border-parchment/20 px-4 py-2 text-xs uppercase tracking-[0.16em] text-parchment/60">
          Proxima etapa: {feedback.nextStep}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-parchment/55">Consequencia narrativa</p>
            <p className="mt-2 text-sm leading-7 text-parchment/90">{feedback.narrative}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-parchment/55">Feedback juridico</p>
            <p className="mt-2 text-sm leading-7 text-parchment/90">{feedback.juridicalFeedback}</p>
          </div>
          {feedback.selectedFoundations && feedback.selectedFoundations.length > 0 ? (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-parchment/55">Fundamentos escolhidos</p>
              <p className="mt-2 text-sm leading-7 text-parchment/90">{feedback.selectedFoundations.join(", ")}.</p>
            </div>
          ) : null}
        </div>

        <div className="rounded-[24px] bg-white/8 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-parchment/55">Impacto</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Legalidade</span>
              <span>{feedback.scoreDelta.legalidade >= 0 ? "+" : ""}{feedback.scoreDelta.legalidade}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Estrategia</span>
              <span>{feedback.scoreDelta.estrategia >= 0 ? "+" : ""}{feedback.scoreDelta.estrategia}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Etica</span>
              <span>{feedback.scoreDelta.etica >= 0 ? "+" : ""}{feedback.scoreDelta.etica}</span>
            </div>
            {feedback.consequence ? (
              <div className="border-t border-parchment/15 pt-3 text-xs leading-6 text-parchment/75">{feedback.consequence}</div>
            ) : null}
            <div className="border-t border-parchment/15 pt-3 text-xs text-parchment/65">
              {feedback.unlockedDocuments.length} documentos disponiveis apos esta etapa.
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          className="rounded-full bg-brass px-6 py-3 text-sm font-semibold text-ink transition hover:bg-[#c79a51]"
          onClick={onContinue}
          type="button"
        >
          {isFinalStep ? "Ver relatorio final" : "Continuar caso"}
        </button>
      </div>
    </section>
  );
}
