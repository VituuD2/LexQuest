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
    <section className="rounded-[28px] border border-ink/10 bg-white/70 p-6 shadow-dossier backdrop-blur">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink/45">Indicadores</p>
          <h2 className="font-serifDisplay text-2xl text-ink">Painel da Defesa</h2>
        </div>
        <div className="rounded-full border border-ink/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-ink/55">
          48h em andamento
        </div>
      </div>

      <div className="space-y-4">
        {entries.map((entry) => (
          <div key={entry.key}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-ink">{entry.label}</span>
              <span className="text-ink/60">{entry.value}/100</span>
            </div>
            <div className="h-3 rounded-full bg-slateglass">
              <div
                className={`h-3 rounded-full transition-all ${metricColors[entry.key]}`}
                style={{ width: `${entry.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
