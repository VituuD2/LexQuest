import type { CaseDocument } from "@/lib/game-types";

type DocumentPanelProps = {
  documents: CaseDocument[];
  onOpenDocument: (documentId: string) => void;
};

export function DocumentPanel({ documents, onOpenDocument }: DocumentPanelProps) {
  return (
    <section className="rounded-[28px] border border-ink/10 bg-white/70 p-5 shadow-dossier">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink/45">Autos</p>
        <h2 className="font-serifDisplay text-2xl text-ink">Documentos desbloqueados</h2>
        <p className="mt-2 text-sm leading-6 text-ink/70">
          Cada documento e aberto em sobreposicao para leitura integral, com layout proprio conforme a natureza do ato.
        </p>
      </div>

      <div className="grid gap-3">
        {documents.map((document) => (
          <button
            className="rounded-3xl border border-ink/10 bg-[#fffdf8] px-4 py-4 text-left transition hover:border-brass/50 hover:bg-white"
            key={document.id}
            onClick={() => onOpenDocument(document.id)}
            type="button"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/45">{document.id}</p>
                <p className="mt-1 text-base font-semibold text-ink">{document.title}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-ink/45">{document.template ?? document.type}</p>
              </div>
              <span className="rounded-full border border-ink/10 px-3 py-2 text-xs uppercase tracking-[0.14em] text-ink/55">
                abrir
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
