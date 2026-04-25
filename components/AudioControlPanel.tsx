import type { AudioSettings } from "@/lib/game-types";

type AudioControlPanelProps = {
  audioSettings: AudioSettings;
  isOpen: boolean;
  onToggleOpen: () => void;
  onMusicChange: (value: number) => void;
  onEffectsChange: (value: number) => void;
};

function percentage(value: number) {
  return Math.round(value * 100);
}

export function AudioControlPanel({
  audioSettings,
  isOpen,
  onToggleOpen,
  onMusicChange,
  onEffectsChange
}: AudioControlPanelProps) {
  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {isOpen ? (
        <div className="w-[320px] rounded-[28px] border border-ink/10 bg-[linear-gradient(180deg,rgba(28,33,40,0.98),rgba(22,25,31,0.96))] p-5 text-parchment shadow-dossier backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-parchment/50">Central de som</p>
              <h3 className="mt-1 font-serifDisplay text-2xl text-white">Mix do plantao</h3>
            </div>
            <button
              className="rounded-full border border-white/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-parchment/70 transition hover:bg-white/5"
              onClick={onToggleOpen}
              type="button"
            >
              Fechar
            </button>
          </div>

          <div className="mt-5 space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
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
              <div className="mb-2 flex items-center justify-between text-sm">
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
        className="rounded-full border border-ink/10 bg-[#1d2128] px-5 py-3 text-sm font-semibold text-parchment shadow-dossier transition hover:bg-[#242933]"
        onClick={onToggleOpen}
        type="button"
      >
        Som
      </button>
    </div>
  );
}
