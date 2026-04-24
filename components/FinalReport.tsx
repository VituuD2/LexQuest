import type { ChoiceHistoryEntry, FinalReportData, GameState } from "@/lib/game-types";

type FinalReportProps = {
  gameState: GameState;
  report: FinalReportData;
  onRestart: () => void;
};

function formatDelta(value: number) {
  return `${value >= 0 ? "+" : ""}${value}`;
}

function renderHistoryItem(item: ChoiceHistoryEntry) {
  return (
    <div className="rounded-[24px] border border-ink/10 bg-white/70 p-5" key={`${item.stepNumber}-${item.choiceKey}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-ink/45">Etapa {item.stepNumber}</p>
          <h3 className="font-serifDisplay text-2xl text-ink">{item.stepTitle}</h3>
        </div>
        <div className="rounded-full border border-ink/10 px-3 py-1 text-xs uppercase tracking-[0.14em] text-ink/60">
          {item.choiceKey}
        </div>
      </div>
      <p className="text-sm font-semibold text-ink">{item.choiceLabel}</p>
      <p className="mt-3 text-sm leading-7 text-ink/80">{item.feedback}</p>
      {item.freeText ? (
        <div className="mt-4 rounded-2xl bg-parchment/45 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-ink/45">Trecho redigido</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-7 text-ink/75">{item.freeText}</p>
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-3 text-xs uppercase tracking-[0.14em] text-ink/60">
        <span>Legalidade {formatDelta(item.scoreDelta.legalidade)}</span>
        <span>Estrategia {formatDelta(item.scoreDelta.estrategia)}</span>
        <span>Etica {formatDelta(item.scoreDelta.etica)}</span>
        {item.rubricScore !== undefined ? <span>Rubrica {item.rubricScore}/30</span> : null}
      </div>
    </div>
  );
}

export function FinalReport({ gameState, report, onRestart }: FinalReportProps) {
  return (
    <section className="space-y-6">
      <div className="rounded-[36px] border border-ink/10 bg-[#1c2128] p-7 text-parchment shadow-dossier">
        <p className="text-xs uppercase tracking-[0.24em] text-parchment/55">Etapa 6</p>
        <h2 className="mt-3 font-serifDisplay text-4xl">Resultado final</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-parchment/85">{report.summary}</p>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-[24px] bg-white/8 p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-parchment/55">Media final</p>
            <p className="mt-3 font-serifDisplay text-4xl">{report.average}</p>
          </div>
          <div className="rounded-[24px] bg-white/8 p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-parchment/55">Desfecho</p>
            <p className="mt-3 text-lg font-semibold capitalize">{report.label}</p>
          </div>
          <div className="rounded-[24px] bg-white/8 p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-parchment/55">Documentos</p>
            <p className="mt-3 text-lg font-semibold">{gameState.documents_unlocked.length}</p>
          </div>
          <div className="rounded-[24px] bg-white/8 p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-parchment/55">Decisoes</p>
            <p className="mt-3 text-lg font-semibold">{gameState.choices_history.length}</p>
          </div>
        </div>

        <div className="mt-6">
          <button
            className="rounded-full bg-brass px-6 py-3 text-sm font-semibold text-ink transition hover:bg-[#c79a51]"
            onClick={onRestart}
            type="button"
          >
            Rejogar caso
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[32px] border border-ink/10 bg-white/70 p-6 shadow-dossier">
          <p className="text-xs uppercase tracking-[0.24em] text-ink/45">Relatorio de aprendizado</p>
          <h3 className="mt-2 font-serifDisplay text-3xl text-ink">Placar final</h3>
          <div className="mt-5 space-y-4 text-sm text-ink/85">
            <div className="rounded-2xl bg-parchment/50 p-4">
              <strong>Legalidade:</strong> {gameState.legalidade}/100
            </div>
            <div className="rounded-2xl bg-parchment/50 p-4">
              <strong>Estrategia:</strong> {gameState.estrategia}/100
            </div>
            <div className="rounded-2xl bg-parchment/50 p-4">
              <strong>Etica:</strong> {gameState.etica}/100
            </div>
          </div>
        </div>

        <div className="space-y-4">{gameState.choices_history.map(renderHistoryItem)}</div>
      </div>
    </section>
  );
}
