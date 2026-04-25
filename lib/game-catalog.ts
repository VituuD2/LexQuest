import { listCaseContentIds } from "@/lib/case-content";

export type GameCatalogEntry = {
  caseId: string;
  gameKey: string;
  label: string;
  title: string;
  summary: string;
  status: "available" | "coming_soon";
  accent: string;
};

const GAME_CATALOG: GameCatalogEntry[] = [
  {
    caseId: "hc_48h_001",
    gameKey: "jogo_1",
    label: "Jogo 1",
    title: "Rafael e o habeas corpus em 48h",
    summary: "Caso criminal jogavel e completo, com plantao urgente, leitura de autos e decisoes em cadeia.",
    status: "available",
    accent: "#bb8a39"
  },
  {
    caseId: "trabalho_plantao_002",
    gameKey: "jogo_2",
    label: "Jogo 2",
    title: "Plantao trabalhista de madrugada",
    summary: "Novo caso em preparacao no studio. Ja aparece no catalogo para manter a estrutura pronta para os proximos jogos.",
    status: "coming_soon",
    accent: "#2f6f5e"
  }
];

export function getGameCatalog() {
  return GAME_CATALOG.filter((game) => listCaseContentIds().includes(game.caseId));
}

export function getGameCatalogEntry(caseId: string) {
  return getGameCatalog().find((game) => game.caseId === caseId) ?? null;
}
