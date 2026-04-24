import type { MetricKey } from "@/lib/game-types";

const metricColors: Record<MetricKey, string> = {
  legalidade: "bg-brass",
  estrategia: "bg-emerald",
  etica: "bg-garnet"
};

type ScoreBarsProps = {
  legalidade: number;
  estrategia: number;
  etica: number;
};

export function ScoreBars({ legalidade, estrategia, etica }: ScoreBarsProps) {
  const entries: Array<{ key: MetricKey; label: string; value: number }> = [
    { key: "legalidade", label: "Legalidade", value: legalidade },
    { key: "estrategia", label: "Estrategia", value: estrategia },
    { key: "etica", label: "Etica", value: etica }
  ];

  return (
    <section className="rounded-[30px] border border-ink/10 bg-[linear-gradient(180deg,rgba(28,33,40,0.96),rgba(24,27,34,0.92))] p-6 text-parchment shadow-dossier backdrop-blur">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-parchment/45">Metricas criticas</p>
          <h2 className="font-serifDisplay text-2xl text-parchment">Painel da Defesa</h2>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em] text-parchment/65">
          pressao maxima
        </div>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        {entries.map((entry) => (
          <div className="rounded-2xl border border-white/8 bg-white/5 p-4" key={`${entry.key}-chip`}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-parchment/45">{entry.label}</p>
            <p className="mt-2 font-serifDisplay text-4xl text-white">{entry.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {entries.map((entry) => (
          <div key={entry.key}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-parchment">{entry.label}</span>
              <span className="text-parchment/60">{entry.value}/100</span>
            </div>
            <div className="h-4 rounded-full bg-white/10 p-[3px]">
              <div
                className={`h-full rounded-full transition-all ${metricColors[entry.key]} shadow-[0_0_18px_rgba(255,255,255,0.18)]`}
                style={{ width: `${entry.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
