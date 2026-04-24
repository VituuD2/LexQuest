import type { CaseDocument, DocumentMessage, DocumentSection } from "@/lib/game-types";

type DocumentModalProps = {
  document: CaseDocument;
  onClose: () => void;
};

function Seal({ label }: { label: string }) {
  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#6a6d72] text-center text-[11px] font-bold uppercase leading-4 text-[#4b4e53]">
      {label}
    </div>
  );
}

function FormalHeader({ document }: { document: CaseDocument }) {
  return (
    <div className="mb-8 flex items-start gap-5 border-b border-[#b5b0a5] pb-6">
      <Seal label={document.template?.includes("judicial") ? "TJSP" : document.template?.includes("police") ? "PCSP" : "OFICIAL"} />
      <div className="flex-1 text-[#222]">
        <p className="text-center text-lg font-semibold uppercase tracking-[0.08em]">{document.issuer?.name}</p>
        <p className="text-center text-sm font-semibold uppercase tracking-[0.06em]">{document.issuer?.branch}</p>
        <p className="mt-1 text-center text-xs uppercase tracking-[0.18em] text-[#555]">{document.issuer?.location}</p>
        <div className="mt-5 text-sm leading-7">
          <p><strong>Referencia:</strong> {document.meta?.reference}</p>
          <p><strong>Data:</strong> {document.meta?.date}</p>
          <p><strong>Folha:</strong> {document.meta?.page}</p>
        </div>
      </div>
    </div>
  );
}

function FormalSections({ sections }: { sections?: DocumentSection[] }) {
  return (
    <div className="space-y-6 text-[15px] leading-8 text-[#232323]">
      {sections?.map((section) => (
        <div key={section.heading}>
          <h4 className="mb-2 text-center text-base font-semibold uppercase tracking-[0.08em]">{section.heading}</h4>
          <p className="whitespace-pre-line text-justify">{section.body}</p>
        </div>
      ))}
    </div>
  );
}

function WhatsAppBubble({ message }: { message: DocumentMessage }) {
  const isIncoming = message.role === "remetente";

  return (
    <div className={`flex ${isIncoming ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6 shadow ${
          isIncoming ? "bg-white text-[#1f2328]" : "bg-[#d8fdd2] text-[#1f2328]"
        }`}
      >
        <p className="text-xs font-semibold text-[#6a6d72]">{message.author}</p>
        <p className="mt-1 whitespace-pre-line">{message.text}</p>
        <p className="mt-2 text-right text-[11px] text-[#7a7d82]">{message.timestamp}</p>
      </div>
    </div>
  );
}

function WhatsAppTemplate({ document }: { document: CaseDocument }) {
  return (
    <div className="rounded-[34px] border border-[#d9d3c8] bg-[#e5ddd5] p-4 shadow-dossier">
      <div className="rounded-[26px] bg-[#075e54] px-5 py-4 text-white">
        <p className="text-sm font-semibold">{document.title}</p>
        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/70">{document.meta?.reference}</p>
      </div>
      <div className="mt-4 space-y-3 rounded-[24px] bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22%3E%3Cg fill=%22none%22 stroke=%22rgba(0,0,0,0.03)%22%3E%3Cpath d=%22M0 12h24M12 0v24%22/%3E%3C/g%3E%3C/svg%3E')] p-5">
        {document.messages?.map((message, index) => (
          <WhatsAppBubble key={`${message.timestamp}-${index}`} message={message} />
        ))}
      </div>
    </div>
  );
}

function ReceiptTemplate({ document }: { document: CaseDocument }) {
  return (
    <div className="mx-auto max-w-2xl rounded-[18px] border border-dashed border-[#7c7a73] bg-[#fffef9] p-8 font-mono text-sm leading-7 text-[#232323] shadow-dossier">
      <div className="border-b border-dashed border-[#7c7a73] pb-4 text-center">
        <p className="text-base font-bold uppercase">{document.issuer?.name}</p>
        <p>{document.issuer?.location}</p>
        <p>{document.meta?.date}</p>
      </div>
      <div className="py-5">
        {document.sections?.map((section) => (
          <div className="mb-4" key={section.heading}>
            <p className="font-bold uppercase">{section.heading}</p>
            <p>{section.body}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-dashed border-[#7c7a73] pt-4 text-center text-xs uppercase tracking-[0.18em]">
        {document.meta?.reference}
      </div>
    </div>
  );
}

function InterviewTemplate({ document }: { document: CaseDocument }) {
  return (
    <div className="mx-auto max-w-4xl rounded-[26px] border border-[#b9b2a7] bg-[#fffdf8] p-8 shadow-dossier">
      <div className="mb-6 border-b border-[#cfc8bc] pb-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[#6a6d72]">Memorando reservado</p>
        <h3 className="mt-2 font-serifDisplay text-4xl text-[#232323]">{document.title}</h3>
        <p className="mt-3 text-sm leading-7 text-[#4f5359]">{document.issuer?.name} - {document.meta?.date}</p>
      </div>
      <FormalSections sections={document.sections} />
    </div>
  );
}

function FormalTemplate({ document }: { document: CaseDocument }) {
  return (
    <div className="mx-auto max-w-4xl rounded-[20px] bg-[#fffdf8] p-10 shadow-dossier">
      <FormalHeader document={document} />
      <div className="mb-7 text-center">
        <h3 className="text-3xl font-semibold uppercase tracking-[0.06em] text-[#202226]">{document.title}</h3>
      </div>
      <FormalSections sections={document.sections} />
      <div className="mt-10 border-t border-[#b5b0a5] pt-5 text-xs leading-6 text-[#5c6065]">
        Documento exibido em layout simulado para fins pedagogicos do caso ficticio LexQuest.
      </div>
    </div>
  );
}

function renderByTemplate(document: CaseDocument) {
  switch (document.template) {
    case "whatsapp_plain":
      return <WhatsAppTemplate document={document} />;
    case "receipt":
      return <ReceiptTemplate document={document} />;
    case "interview_memo":
      return <InterviewTemplate document={document} />;
    default:
      return <FormalTemplate document={document} />;
  }
}

export function DocumentModal({ document, onClose }: DocumentModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#13161b]/70 px-4 py-10 backdrop-blur-md">
      <div className="w-full max-w-6xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="rounded-full border border-white/20 bg-white/8 px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/80">
            Documento em leitura
          </div>
          <button
            className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            onClick={onClose}
            type="button"
          >
            Fechar documento
          </button>
        </div>
        <div className="animate-[documentEnter_220ms_ease-out]">{renderByTemplate(document)}</div>
      </div>
    </div>
  );
}
