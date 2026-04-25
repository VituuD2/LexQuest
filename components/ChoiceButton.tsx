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
          ? "border-brass bg-brass/15 shadow-[var(--shadow-dossier-theme)]"
          : "theme-card hover:border-brass/60 hover:bg-[var(--surface-card-strong)]"
      }`}
      onClick={onClick}
      type="button"
    >
      <div className="mb-3 flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink text-sm font-bold text-parchment">
          {choiceKey}
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--text-muted)]">Estrategia</p>
          <h4 className="mt-1 text-lg font-semibold text-[color:var(--text-primary)]">{label}</h4>
        </div>
      </div>
      <p className="text-sm leading-7 text-[color:var(--text-secondary)]">{text}</p>
    </button>
  );
}
