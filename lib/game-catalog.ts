import { listCaseContentIds } from "@/lib/case-content";

export type GamePublicationStatus = "draft" | "published" | "archived";

export type GameCatalogEntry = {
  caseId: string;
  gameKey: string;
  label: string;
  title: string;
  summary: string;
  status: "available" | "coming_soon";
  publicationStatus: GamePublicationStatus;
  publishedAt: string | null;
  accent: string;
};

export type GameCatalogDefinition = Omit<GameCatalogEntry, "status" | "publicationStatus" | "publishedAt"> & {
  defaultPublicationStatus: GamePublicationStatus;
};

const GAME_CATALOG: GameCatalogDefinition[] = [
  {
    caseId: "hc_48h_001",
    gameKey: "jogo_1",
    label: "Jogo 1",
    title: "Rafael e o habeas corpus em 48h",
    summary: "Caso criminal jogavel e completo, com plantao urgente, leitura de autos e decisoes em cadeia.",
    defaultPublicationStatus: "published",
    accent: "#bb8a39"
  },
  {
    caseId: "trabalho_plantao_002",
    gameKey: "jogo_2",
    label: "Jogo 2",
    title: "Plantao trabalhista de madrugada",
    summary: "Novo caso em preparacao no studio. Ja aparece no catalogo para manter a estrutura pronta para os proximos jogos.",
    defaultPublicationStatus: "draft",
    accent: "#2f6f5e"
  }
];

function mapPublicationStatusToCatalogStatus(publicationStatus: GamePublicationStatus) {
  return publicationStatus === "published" ? "available" : "coming_soon";
}

export function getGameCatalogDefinitions() {
  return GAME_CATALOG.filter((game) => listCaseContentIds().includes(game.caseId));
}

export function buildGameCatalogEntry(
  game: GameCatalogDefinition,
  publicationStatus: GamePublicationStatus = game.defaultPublicationStatus,
  publishedAt: string | null = null
): GameCatalogEntry {
  return {
    caseId: game.caseId,
    gameKey: game.gameKey,
    label: game.label,
    title: game.title,
    summary: game.summary,
    status: mapPublicationStatusToCatalogStatus(publicationStatus),
    publicationStatus,
    publishedAt,
    accent: game.accent
  };
}

export function getDefaultGameCatalog(options?: {
  includeUnpublished?: boolean;
}) {
  const includeUnpublished = options?.includeUnpublished ?? false;

  return getGameCatalogDefinitions()
    .map((game) => buildGameCatalogEntry(game))
    .filter((game) => includeUnpublished || game.publicationStatus === "published");
}

export function getDefaultGameCatalogEntry(
  caseId: string,
  options?: {
    includeUnpublished?: boolean;
  }
) {
  return getDefaultGameCatalog(options).find((game) => game.caseId === caseId) ?? null;
}
