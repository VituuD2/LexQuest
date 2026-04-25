import type { CaseDocument, DocumentStateMap } from "@/lib/game-types";

type DocumentPanelProps = {
  documents: CaseDocument[];
  documentState: DocumentStateMap;
  onOpenDocument: (documentId: string) => void;
};

export function DocumentPanel({ documents, documentState, onOpenDocument }: DocumentPanelProps) {
  return (
    <section className="theme-panel rounded-[30px] border p-5 text-[color:var(--text-primary)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--text-muted)]">Arquivo vivo</p>
          <h2 className="font-serifDisplay text-2xl text-[color:var(--text-primary)]">Documentos desbloqueados</h2>
        </div>
        <div className="theme-pill rounded-2xl border px-3 py-2 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Nao lidos</p>
          <p className="text-lg font-semibold text-[color:var(--text-primary)]">
            {documents.filter((document) => !documentState[document.id]?.isOpened).length}
          </p>
        </div>
      </div>
      <div className="mb-4 rounded-2xl border border-brass/25 bg-brass/10 px-4 py-3">
        <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
          Cada documento e aberto em sobreposicao para leitura integral, com layout proprio conforme a natureza do ato.
        </p>
      </div>

      <div className="grid gap-3">
        {documents.map((document) => {
          const progress = documentState[document.id];

          return (
            <button
              className="theme-card rounded-3xl border px-4 py-4 text-left transition hover:border-brass/50 hover:bg-[var(--surface-card-strong)]"
              key={document.id}
              onClick={() => onOpenDocument(document.id)}
              type="button"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">{document.id}</p>
                    {progress?.isNew ? (
                      <span className="rounded-full bg-garnet px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
                        novo
                      </span>
                    ) : null}
                    {progress?.isOpened ? (
                      <span className="rounded-full border border-emerald/35 bg-emerald/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald">
                        lido
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-base font-semibold text-[color:var(--text-primary)]">{document.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]">{document.template ?? document.type}</p>
                </div>
                <span className="theme-pill rounded-full border px-3 py-2 text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
                  abrir
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
