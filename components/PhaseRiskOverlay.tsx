import type { MetricKey } from "@/lib/game-types";

type ThresholdEntry = {
  key: MetricKey;
  label: string;
  floor: number;
};

type PhaseRiskOverlayProps = {
  averageFloor: number;
  currentStep: number;
  onClose: () => void;
  thresholds: ThresholdEntry[];
};

const metricAccent: Record<MetricKey, string> = {
  legalidade: "border-brass/45 bg-brass/10 text-[#8d641c]",
  estrategia: "border-emerald/35 bg-emerald/10 text-emerald",
  etica: "border-garnet/35 bg-garnet/10 text-garnet"
};

export function PhaseRiskOverlay({ averageFloor, currentStep, onClose, thresholds }: PhaseRiskOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#10141a]/55 px-4 pt-20 backdrop-blur-md">
      <div className="w-full max-w-3xl rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(28,33,40,0.98),rgba(22,25,31,0.96))] p-7 text-parchment shadow-[0_32px_90px_rgba(0,0,0,0.35)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-parchment/50">Alerta de etapa</p>
            <h2 className="mt-2 font-serifDisplay text-4xl text-white">O caso pode morrer cedo</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-parchment/82">
              Etapa {currentStep}. Cada decisao mexe nas metricas. Se voce afundar demais uma delas ou deixar a media geral despencar, o plantao fecha antes do melhor ataque defensivo.
            </p>
          </div>
          <button
            className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-parchment/72 transition hover:bg-white/5"
            onClick={onClose}
            type="button"
          >
            Entendi
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {thresholds.map((threshold) => (
            <div className={`rounded-[24px] border p-4 ${metricAccent[threshold.key]}`} key={threshold.key}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">{threshold.label}</p>
              <p className="mt-2 font-serifDisplay text-4xl">{threshold.floor}</p>
              <p className="mt-2 text-sm leading-6">
                Se {threshold.label.toLowerCase()} cair para {threshold.floor} ou menos, voce perde o caso.
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-parchment/55">Regra adicional</p>
          <p className="mt-2 text-sm leading-7 text-parchment/85">
            Se a media entre legalidade, estrategia e etica cair para {averageFloor} ou menos, o desfecho vira derrota tecnica antecipada.
          </p>
        </div>

        <div className="mt-5 rounded-[24px] border border-brass/20 bg-brass/10 p-5 text-sm leading-7 text-parchment/88">
          Suas escolhas mudam os flags do caso, a leitura do mentor, os caminhos narrativos e o despacho final. Ha varios desfechos possiveis, inclusive finais parciais e decisoes diferentes de juiz para juiz.
        </div>
      </div>
    </div>
  );
}
