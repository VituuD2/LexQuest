import type { CaseDocument } from "@/lib/game-types";

type DocumentPanelProps = {
  documents: CaseDocument[];
  selectedDocumentId: string | null;
  onSelectDocument: (documentId: string) => void;
};

export function DocumentPanel({
  documents,
  selectedDocumentId,
  onSelectDocument
}: DocumentPanelProps) {
  const activeDocument = documents.find((document) => document.id === selectedDocumentId) ?? documents[0];

  return (
    <section className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="rounded-[28px] border border-ink/10 bg-white/70 p-5 shadow-dossier">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink/45">Autos</p>
          <h2 className="font-serifDisplay text-2xl text-ink">Documentos</h2>
        </div>

        <div className="space-y-2">
          {documents.map((document) => {
            const isActive = document.id === activeDocument?.id;

            return (
              <button
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  isActive
                    ? "border-brass bg-brass/12"
                    : "border-ink/10 bg-parchment/30 hover:border-brass/50 hover:bg-white"
                }`}
                key={document.id}
                onClick={() => onSelectDocument(document.id)}
                type="button"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/45">{document.id}</p>
                <p className="mt-1 text-sm font-semibold text-ink">{document.title}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[28px] border border-ink/10 bg-[#fffdf8]/85 p-6 shadow-dossier">
        {activeDocument ? (
          <>
            <div className="mb-4 border-b border-ink/10 pb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/45">{activeDocument.type}</p>
              <h3 className="mt-2 font-serifDisplay text-3xl text-ink">{activeDocument.title}</h3>
            </div>
            <div className="whitespace-pre-line text-sm leading-7 text-ink/85">{activeDocument.content}</div>
          </>
        ) : (
          <p className="text-sm text-ink/70">Nenhum documento desbloqueado.</p>
        )}
      </div>
    </section>
  );
}
