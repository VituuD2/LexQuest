import type { AudioSettings, ThemePreference } from "@/lib/game-types";

type AudioControlPanelProps = {
  audioSettings: AudioSettings;
  isOpen: boolean;
  onToggleOpen: () => void;
  onMusicChange: (value: number) => void;
  onEffectsChange: (value: number) => void;
  themePreference: ThemePreference;
  onThemeChange: (value: ThemePreference) => void;
};

function percentage(value: number) {
  return Math.round(value * 100);
}

export function AudioControlPanel({
  audioSettings,
  isOpen,
  onToggleOpen,
  onMusicChange,
  onEffectsChange,
  themePreference,
  onThemeChange
}: AudioControlPanelProps) {
  const themeOptions: Array<{ value: ThemePreference; label: string }> = [
    { value: "system", label: "Sistema" },
    { value: "light", label: "Claro" },
    { value: "dark", label: "Escuro" }
  ];

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {isOpen ? (
        <div className="theme-panel-strong w-[340px] rounded-[28px] border p-5 text-[color:var(--text-primary)] backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Ajustes</p>
              <h3 className="mt-1 font-serifDisplay text-2xl text-[color:var(--text-primary)]">Preferencias</h3>
            </div>
            <button
              className="theme-button-secondary rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition"
              onClick={onToggleOpen}
              type="button"
            >
              Fechar
            </button>
          </div>

          <div className="mt-5 space-y-5">
            <div>
              <div className="mb-3">
                <p className="text-sm font-semibold text-[color:var(--text-primary)]">Tema</p>
                <p className="mt-1 text-xs leading-6 text-[color:var(--text-muted)]">
                  Siga o sistema ou fixe um visual claro ou escuro neste navegador.
                </p>
              </div>

              <div className="theme-pill grid grid-cols-3 gap-2 rounded-full border p-1">
                {themeOptions.map((option) => (
                  <button
                    className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                      themePreference === option.value
                        ? "bg-ink text-parchment"
                        : "text-[color:var(--text-secondary)] hover:bg-[var(--button-secondary-hover)]"
                    }`}
                    key={option.value}
                    onClick={() => onThemeChange(option.value)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm text-[color:var(--text-primary)]">
                <span>Musica</span>
                <span>{percentage(audioSettings.musicVolume)}%</span>
              </div>
              <input
                className="w-full accent-[#c79a51]"
                max="100"
                min="0"
                onChange={(event) => onMusicChange(Number(event.target.value) / 100)}
                type="range"
                value={percentage(audioSettings.musicVolume)}
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm text-[color:var(--text-primary)]">
                <span>Efeitos</span>
                <span>{percentage(audioSettings.effectsVolume)}%</span>
              </div>
              <input
                className="w-full accent-[#d05346]"
                max="100"
                min="0"
                onChange={(event) => onEffectsChange(Number(event.target.value) / 100)}
                type="range"
                value={percentage(audioSettings.effectsVolume)}
              />
            </div>
          </div>
        </div>
      ) : null}

      <button
        aria-label="Abrir ajustes"
        className="theme-panel-strong flex h-14 w-14 items-center justify-center rounded-full border text-[color:var(--text-primary)] transition hover:scale-[1.03]"
        onClick={onToggleOpen}
        title="Ajustes"
        type="button"
      >
        <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path
            d="M10.5 4.75c.4-1.2 2.1-1.2 2.5 0l.39 1.15a1.6 1.6 0 0 0 2.02 1l1.13-.39c1.18-.41 2.38.8 1.97 1.98l-.39 1.12a1.6 1.6 0 0 0 1 2.02l1.15.39c1.2.4 1.2 2.1 0 2.5l-1.15.39a1.6 1.6 0 0 0-1 2.02l.39 1.13c.41 1.18-.79 2.38-1.97 1.97l-1.13-.39a1.6 1.6 0 0 0-2.02 1l-.39 1.15c-.4 1.2-2.1 1.2-2.5 0l-.39-1.15a1.6 1.6 0 0 0-2.02-1l-1.12.39c-1.19.41-2.39-.79-1.98-1.97l.39-1.13a1.6 1.6 0 0 0-1-2.02l-1.15-.39c-1.2-.4-1.2-2.1 0-2.5l1.15-.39a1.6 1.6 0 0 0 1-2.02l-.39-1.12c-.41-1.18.79-2.39 1.98-1.98l1.12.39a1.6 1.6 0 0 0 2.02-1z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="2.9" />
        </svg>
      </button>
    </div>
  );
}
