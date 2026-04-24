type ChoiceButtonProps = {
  choiceKey: string;
  label: string;
  text: string;
  isSelected: boolean;
  onClick: () => void;
};

export function ChoiceButton({ choiceKey, label, text, isSelected, onClick }: ChoiceButtonProps) {
  return (
    <button
      className={`w-full rounded-3xl border px-5 py-5 text-left transition ${
        isSelected
          ? "border-brass bg-brass/15 shadow-dossier"
          : "border-ink/10 bg-white/75 hover:border-brass/60 hover:bg-white"
      }`}
      onClick={onClick}
      type="button"
    >
      <div className="mb-3 flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink text-sm font-bold text-parchment">
          {choiceKey}
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink/45">Estrategia</p>
          <h4 className="mt-1 text-lg font-semibold text-ink">{label}</h4>
        </div>
      </div>
      <p className="text-sm leading-7 text-ink/85">{text}</p>
    </button>
  );
}
