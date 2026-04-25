import type { GameState } from "@/lib/game-types";

export type UserRole = "user" | "admin";

export type AuthenticatedUser = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

export type ActiveGameSession = {
  sessionId: string;
  gameState: GameState;
  status: string;
  updatedAt: string;
  finalAverage: number | null;
};

export type AuthSessionPayload = {
  user: AuthenticatedUser | null;
  activeGameSession: ActiveGameSession | null;
};

export type AdminUserRecord = AuthenticatedUser & {
  isActive: boolean;
  updatedAt: string;
  lastLoginAt: string | null;
};
