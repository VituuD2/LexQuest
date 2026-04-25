import "server-only";

import type { UserRole } from "@/lib/auth-types";
import {
  buildGameCatalogEntry,
  getGameCatalogDefinitions,
  type GameCatalogDefinition,
  type GameCatalogEntry,
  type GamePublicationStatus
} from "@/lib/game-catalog";
import { getSupabaseAdminClient } from "@/lib/server/supabase";

type CaseVersionStatusRow = {
  case_id: string;
  version_number: number;
  status: GamePublicationStatus;
  published_at: string | null;
};

export type CasePublicationState = {
  status: GamePublicationStatus;
  publishedAt: string | null;
  publishedVersionNumber: number | null;
};

function resolvePublicationState(definition: GameCatalogDefinition, rows: CaseVersionStatusRow[]): CasePublicationState {
  const publishedRow =
    rows
      .filter((row) => row.status === "published")
      .sort((left, right) => right.version_number - left.version_number)[0] ?? null;

  if (publishedRow) {
    return {
      status: "published",
      publishedAt: publishedRow.published_at,
      publishedVersionNumber: publishedRow.version_number
    };
  }

  if (rows.length === 0) {
    return {
      status: definition.defaultPublicationStatus,
      publishedAt: null,
      publishedVersionNumber: null
    };
  }

  const hasArchivedVersion = rows.some((row) => row.status === "archived");
  const hasDraftVersion = rows.some((row) => row.status === "draft");

  if (!hasArchivedVersion && definition.defaultPublicationStatus === "published") {
    return {
      status: "published",
      publishedAt: null,
      publishedVersionNumber: null
    };
  }

  return {
    status: hasDraftVersion ? "draft" : "archived",
    publishedAt: null,
    publishedVersionNumber: null
  };
}

async function listCaseVersionStatuses(caseIds: string[]) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("case_versions")
    .select("case_id, version_number, status, published_at")
    .in("case_id", caseIds);

  if (error) {
    throw new Error(`Falha ao carregar status de publicacao dos jogos: ${error.message}`);
  }

  return (data ?? []) as CaseVersionStatusRow[];
}

export async function getCasePublicationState(caseId: string): Promise<CasePublicationState | null> {
  const definition = getGameCatalogDefinitions().find((game) => game.caseId === caseId);

  if (!definition) {
    return null;
  }

  const rows = await listCaseVersionStatuses([caseId]);
  return resolvePublicationState(definition, rows.filter((row) => row.case_id === caseId));
}

export async function listVisibleGameCatalog(options?: {
  includeUnpublished?: boolean;
  role?: UserRole | null;
}) {
  const definitions = getGameCatalogDefinitions();
  const rows = await listCaseVersionStatuses(definitions.map((game) => game.caseId));
  const includeUnpublished = options?.includeUnpublished ?? options?.role === "admin";

  return definitions
    .map((definition) => {
      const publication = resolvePublicationState(
        definition,
        rows.filter((row) => row.case_id === definition.caseId)
      );

      return buildGameCatalogEntry(definition, publication.status, publication.publishedAt);
    })
    .filter((game) => includeUnpublished || game.publicationStatus === "published");
}

export async function getVisibleGameCatalogEntry(
  caseId: string,
  options?: {
    includeUnpublished?: boolean;
    role?: UserRole | null;
  }
): Promise<GameCatalogEntry | null> {
  const catalog = await listVisibleGameCatalog(options);
  return catalog.find((game) => game.caseId === caseId) ?? null;
}
