import "server-only";

import type { AuthenticatedUser, AuthSessionPayload } from "@/lib/auth-types";
import { listVisibleGameCatalog } from "@/lib/server/game-catalog";
import { listActiveSessionsForUser } from "@/lib/server/session-repository";

export async function buildAuthSessionPayload(user: AuthenticatedUser | null): Promise<AuthSessionPayload> {
  const gameCatalog = await listVisibleGameCatalog({
    role: user?.role ?? null
  });

  if (!user) {
    return {
      user: null,
      activeGameSession: null,
      activeGameSessions: [],
      gameCatalog
    };
  }

  const visibleCaseIds = new Set(gameCatalog.map((game) => game.caseId));
  const activeGameSessions = (await listActiveSessionsForUser(user.id)).filter((session) => visibleCaseIds.has(session.caseId));

  return {
    user,
    activeGameSession: activeGameSessions[0] ?? null,
    activeGameSessions,
    gameCatalog
  };
}
