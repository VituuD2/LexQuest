type ChoiceButtonProps = {
  choiceKey: string;
  text: string;
  isSelected: boolean;
  onClick: () => void;
};

export function ChoiceButton({ choiceKey, text, isSelected, onClick }: ChoiceButtonProps) {
  return (
    <button
      className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
        isSelected
          ? "border-brass bg-brass/15 shadow-dossier"
          : "border-ink/10 bg-white/75 hover:border-brass/60 hover:bg-white"
      }`}
      onClick={onClick}
      type="button"
    >
      <div className="mb-2 flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-bold text-parchment">
          {choiceKey}
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">Alternativa</span>
      </div>
      <p className="text-sm leading-6 text-ink">{text}</p>
    </button>
  );
}
