import type { ChoiceHistoryEntry, FinalOrder, FinalReportData, GameState } from "@/lib/game-types";

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
    <div className="theme-panel rounded-[24px] border p-5 text-[color:var(--text-primary)]" key={`${item.stepNumber}-${item.choiceKey}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">Etapa {item.stepNumber}</p>
          <h3 className="font-serifDisplay text-2xl text-[color:var(--text-primary)]">{item.stepTitle}</h3>
        </div>
        <div className="theme-pill rounded-full border px-3 py-1 text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
          {item.choiceKey}
        </div>
      </div>
      <p className="text-sm font-semibold text-[color:var(--text-primary)]">{item.choiceLabel}</p>
      <p className="mt-3 text-sm leading-7 text-[color:var(--text-secondary)]">{item.feedback}</p>
      {item.selectedFoundations && item.selectedFoundations.length > 0 ? (
        <p className="mt-3 text-sm leading-7 text-[color:var(--text-secondary)]">
          <strong>Fundamentos:</strong> {item.selectedFoundations.join(", ")}.
        </p>
      ) : null}
      {item.consequence ? (
        <p className="mt-3 text-sm leading-7 text-[color:var(--text-secondary)]">
          <strong>Efeito pratico:</strong> {item.consequence}
        </p>
      ) : null}
      {item.freeText ? (
        <div className="theme-card-muted mt-4 rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Trecho redigido</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[color:var(--text-secondary)]">{item.freeText}</p>
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-3 text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
        <span>Legalidade {formatDelta(item.scoreDelta.legalidade)}</span>
        <span>Estrategia {formatDelta(item.scoreDelta.estrategia)}</span>
        <span>Etica {formatDelta(item.scoreDelta.etica)}</span>
        {item.rubricScore !== undefined ? <span>Rubrica {item.rubricScore}/30</span> : null}
      </div>
    </div>
  );
}

function JudicialDispatch({ order }: { order: FinalOrder }) {
  return (
    <div className="rounded-[28px] bg-[#fffdf8] p-8 text-[#232323] shadow-dossier">
      <div className="mb-6 flex items-start gap-4 border-b border-[#c9c2b5] pb-5">
        <img alt="Selo TJSP" className="h-16 w-16 object-contain" src="/svg/tjsp.svg" />
        <div className="flex-1">
          <p className="text-center text-lg font-semibold uppercase tracking-[0.08em]">{order.issuer.name}</p>
          <p className="text-center text-sm font-semibold uppercase tracking-[0.06em]">{order.issuer.branch}</p>
          <p className="mt-1 text-center text-xs uppercase tracking-[0.16em] text-[#676b72]">{order.issuer.location}</p>
          <div className="mt-4 text-sm leading-7">
            <p><strong>Referencia:</strong> {order.meta.reference}</p>
            <p><strong>Data:</strong> {order.meta.date}</p>
            <p><strong>Classe:</strong> {order.meta.page}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-[#676b72]">Despacho judicial</p>
        <h3 className="mt-2 font-serifDisplay text-3xl">{order.title}</h3>
      </div>

      <div className="space-y-5 text-[15px] leading-8">
        {order.sections.map((section) => (
          <div key={section.heading}>
            <h4 className="mb-2 text-center text-base font-semibold uppercase tracking-[0.08em]">{section.heading}</h4>
            <p className="text-justify">{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FinalReport({ gameState, report, onRestart }: FinalReportProps) {
  const openedDocumentCount = Object.values(gameState.document_state ?? {}).filter((document) => document.isOpened).length;

  return (
    <section className="space-y-6">
      <div className="rounded-[36px] border border-white/10 bg-[var(--surface-contrast)] p-7 text-parchment shadow-[var(--shadow-elevated-theme)]">
        <p className="text-xs uppercase tracking-[0.24em] text-parchment/55">Etapa 6</p>
        <h2 className="mt-3 font-serifDisplay text-4xl">Resultado final</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-parchment/85">{report.summary}</p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-parchment/70">
          O despacho abaixo muda conforme suas metricas, documentos lidos, fundamentos escolhidos e flags ativados ao longo do caso.
        </p>

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
            <p className="mt-3 text-lg font-semibold">{openedDocumentCount}/{gameState.documents_unlocked.length}</p>
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

      {report.judgeOrder ? (
        <section className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--text-muted)]">Despacho final</p>
            <h3 className="mt-2 font-serifDisplay text-3xl text-[color:var(--text-primary)]">Decisao judicial recebida</h3>
          </div>
          <JudicialDispatch order={report.judgeOrder} />
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="theme-panel rounded-[32px] border p-6 text-[color:var(--text-primary)]">
          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--text-muted)]">Relatorio de aprendizado</p>
          <h3 className="mt-2 font-serifDisplay text-3xl text-[color:var(--text-primary)]">Placar final</h3>
          <div className="mt-5 space-y-4 text-sm text-[color:var(--text-secondary)]">
            <div className="theme-card-muted rounded-2xl p-4">
              <strong>Legalidade:</strong> {gameState.legalidade}/100
            </div>
            <div className="theme-card-muted rounded-2xl p-4">
              <strong>Estrategia:</strong> {gameState.estrategia}/100
            </div>
            <div className="theme-card-muted rounded-2xl p-4">
              <strong>Etica:</strong> {gameState.etica}/100
            </div>
          </div>
        </div>

        <div className="space-y-4">{gameState.choices_history.map(renderHistoryItem)}</div>
      </div>
    </section>
  );
}
