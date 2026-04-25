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
          <p className="text-xs uppercase tracking-[0.24em] text-parchment/55">Leitura da etapa</p>
          <h2 className="mt-2 font-serifDisplay text-3xl">{feedback.title}</h2>
        </div>
        <div className="rounded-full border border-parchment/20 px-4 py-2 text-xs uppercase tracking-[0.16em] text-parchment/60">
          Proxima etapa: {feedback.nextStep}
        </div>
      </div>

      <div className="mb-5 rounded-[28px] border border-brass/25 bg-[linear-gradient(180deg,rgba(187,138,57,0.18),rgba(187,138,57,0.08))] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-parchment/60">
          {feedback.mentorTitle ?? "Leitura do advogado senior"}
        </p>
        {feedback.mentorSummary ? <p className="mt-3 text-base leading-8 text-white">{feedback.mentorSummary}</p> : null}

        {feedback.aiFeedback ? (
          <div className="mt-4 rounded-[22px] border border-white/10 bg-[#161a20] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-parchment/55">Parecer tecnico prioritario</p>
            <p className="mt-2 text-sm leading-7 text-parchment/92">{feedback.aiFeedback}</p>
          </div>
        ) : null}

        {feedback.mentorRules && feedback.mentorRules.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {feedback.mentorRules.map((rule) => (
              <div className="rounded-[20px] border border-white/10 bg-white/6 px-4 py-3 text-sm leading-6 text-parchment/88" key={rule}>
                {rule}
              </div>
            ))}
          </div>
        ) : null}

        {feedback.aiRewriteSuggestion ? (
          <div className="mt-4 rounded-[22px] border border-white/10 bg-white/6 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-parchment/55">Ajuste sugerido de redacao</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-parchment/90">{feedback.aiRewriteSuggestion}</p>
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-parchment/55">Consequencia narrativa</p>
            <p className="mt-2 text-sm leading-7 text-parchment/90">{feedback.narrative}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-parchment/55">Leitura juridica da jogada</p>
            <p className="mt-2 text-sm leading-7 text-parchment/90">{feedback.juridicalFeedback}</p>
          </div>
          {feedback.selectedFoundations && feedback.selectedFoundations.length > 0 ? (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-parchment/55">Fundamentos escolhidos</p>
              <p className="mt-2 text-sm leading-7 text-parchment/90">{feedback.selectedFoundations.join(", ")}.</p>
            </div>
          ) : null}
          {feedback.selectedDocuments && feedback.selectedDocuments.length > 0 ? (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-parchment/55">Provas documentais usadas</p>
              <p className="mt-2 text-sm leading-7 text-parchment/90">{feedback.selectedDocuments.join(", ")}.</p>
            </div>
          ) : null}
          {feedback.documentEvidence ? (
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[20px] border border-emerald/25 bg-emerald/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-parchment/55">Bem escolhidas</p>
                <p className="mt-2 text-sm leading-6 text-parchment/90">
                  {feedback.documentEvidence.wellChosen.length > 0 ? feedback.documentEvidence.wellChosen.join(", ") : "Nenhuma."}
                </p>
              </div>
              <div className="rounded-[20px] border border-brass/25 bg-brass/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-parchment/55">Ignoradas</p>
                <p className="mt-2 text-sm leading-6 text-parchment/90">
                  {feedback.documentEvidence.ignored.length > 0 ? feedback.documentEvidence.ignored.join(", ") : "Nenhuma."}
                </p>
              </div>
              <div className="rounded-[20px] border border-garnet/25 bg-garnet/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-parchment/55">Arriscadas</p>
                <p className="mt-2 text-sm leading-6 text-parchment/90">
                  {feedback.documentEvidence.risky.length > 0 ? feedback.documentEvidence.risky.join(", ") : "Nenhuma."}
                </p>
              </div>
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
            {feedback.aiStatus ? (
              <div className="border-t border-parchment/15 pt-3 text-xs uppercase tracking-[0.16em] text-parchment/55">
                Mentor virtual: {feedback.aiStatus}
                {feedback.aiScore !== undefined ? ` | nota sugerida: ${feedback.aiScore}` : ""}
                {feedback.aiStatusDetail ? <p className="mt-2 normal-case tracking-normal text-parchment/75">{feedback.aiStatusDetail}</p> : null}
              </div>
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
