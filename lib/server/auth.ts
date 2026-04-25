import "server-only";

import { createHmac, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthenticatedUser } from "@/lib/auth-types";
import {
  createAuthSessionRecord,
  getUserBySessionTokenHash,
  revokeSessionByTokenHash,
  touchSession
} from "@/lib/server/user-repository";

const AUTH_COOKIE_NAME = "lexquest_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;

function getAuthSessionSecret() {
  const value = process.env.AUTH_SESSION_SECRET;

  if (!value) {
    throw new Error("Missing required environment variable: AUTH_SESSION_SECRET");
  }

  return value;
}

function buildTokenHash(token: string) {
  return createHmac("sha256", getAuthSessionSecret()).update(token).digest("hex");
}

function getCookieOptions(expiresAt: Date) {
  return {
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt
  };
}

export async function createAuthSession(userId: string) {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = buildTokenHash(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await createAuthSessionRecord({
    userId,
    tokenHash,
    expiresAt: expiresAt.toISOString()
  });

  const cookieStore = await cookies();
  cookieStore.set({
    ...getCookieOptions(expiresAt),
    value: rawToken
  });
}

export async function clearAuthSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set({
    ...getCookieOptions(new Date(0)),
    value: ""
  });
}

async function getCurrentSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const token = await getCurrentSessionToken();

  if (!token) {
    return null;
  }

  const tokenHash = buildTokenHash(token);
  const sessionData = await getUserBySessionTokenHash(tokenHash);

  if (!sessionData) {
    await clearAuthSessionCookie();
    return null;
  }

  const expiresAt = new Date(sessionData.session.expires_at);

  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    await revokeSessionByTokenHash(tokenHash);
    await clearAuthSessionCookie();
    return null;
  }

  await touchSession(tokenHash);
  return sessionData.user;
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/");
  }

  return user;
}

export async function requireAdminUser() {
  const user = await requireAuthenticatedUser();

  if (user.role !== "admin") {
    redirect("/");
  }

  return user;
}

export async function destroyCurrentAuthSession() {
  const token = await getCurrentSessionToken();

  if (token) {
    await revokeSessionByTokenHash(buildTokenHash(token));
  }

  await clearAuthSessionCookie();
}
