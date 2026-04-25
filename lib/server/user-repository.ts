import "server-only";

import type { AdminUserRecord, AuthenticatedUser, UserRole } from "@/lib/auth-types";
import { getSupabaseAdminClient } from "@/lib/server/supabase";
import { hashPassword, verifyPassword } from "@/lib/server/password";

type UserRow = {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
};

type SessionRow = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
  last_seen_at: string | null;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeUsername(value: string) {
  return value.trim();
}

function sanitizeUser(row: UserRow): AuthenticatedUser {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    createdAt: row.created_at
  };
}

function sanitizeAdminUser(row: UserRow): AdminUserRecord {
  return {
    ...sanitizeUser(row),
    isActive: row.is_active,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at
  };
}

async function getUserByEmail(email: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("id, username, email, password_hash, role, is_active, created_at, updated_at, last_login_at")
    .eq("email", normalizeEmail(email))
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao consultar usuario por email: ${error.message}`);
  }

  return (data as UserRow | null) ?? null;
}

async function getUserByUsername(username: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("id, username, email, password_hash, role, is_active, created_at, updated_at, last_login_at")
    .ilike("username", normalizeUsername(username))
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao consultar usuario por username: ${error.message}`);
  }

  return (data as UserRow | null) ?? null;
}

export async function getUserById(userId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("id, username, email, password_hash, role, is_active, created_at, updated_at, last_login_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao consultar usuario: ${error.message}`);
  }

  return (data as UserRow | null) ?? null;
}

async function countActiveAdmins() {
  const supabase = getSupabaseAdminClient();
  const { count, error } = await supabase
    .from("app_users")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")
    .eq("is_active", true);

  if (error) {
    throw new Error(`Falha ao contar admins: ${error.message}`);
  }

  return count ?? 0;
}

export async function registerUser(params: {
  username: string;
  email: string;
  password: string;
}) {
  const username = normalizeUsername(params.username);
  const email = normalizeEmail(params.email);

  const [existingByEmail, existingByUsername] = await Promise.all([getUserByEmail(email), getUserByUsername(username)]);

  if (existingByEmail) {
    throw new Error("Ja existe uma conta com este email.");
  }

  if (existingByUsername) {
    throw new Error("Ja existe uma conta com este username.");
  }

  const passwordHash = await hashPassword(params.password);
  const role: UserRole = (await countActiveAdmins()) === 0 ? "admin" : "user";
  const supabase = getSupabaseAdminClient();
  const timestamp = new Date().toISOString();

  const { data, error } = await supabase
    .from("app_users")
    .insert({
      username,
      email,
      password_hash: passwordHash,
      role,
      is_active: true,
      created_at: timestamp,
      updated_at: timestamp
    })
    .select("id, username, email, password_hash, role, is_active, created_at, updated_at, last_login_at")
    .single();

  if (error || !data) {
    throw new Error(`Falha ao criar usuario: ${error?.message ?? "erro desconhecido"}`);
  }

  return sanitizeUser(data as UserRow);
}

export async function authenticateUser(login: string, password: string) {
  const identifier = login.trim();
  const user = identifier.includes("@") ? await getUserByEmail(identifier) : await getUserByUsername(identifier);

  if (!user || !user.is_active) {
    return null;
  }

  const isValidPassword = await verifyPassword(password, user.password_hash);

  if (!isValidPassword) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  await supabase
    .from("app_users")
    .update({
      last_login_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", user.id);

  return sanitizeUser(user);
}

export async function createAuthSessionRecord(params: {
  userId: string;
  tokenHash: string;
  expiresAt: string;
}) {
  const supabase = getSupabaseAdminClient();
  const timestamp = new Date().toISOString();
  const { error } = await supabase.from("auth_sessions").insert({
    user_id: params.userId,
    token_hash: params.tokenHash,
    expires_at: params.expiresAt,
    created_at: timestamp,
    last_seen_at: timestamp
  });

  if (error) {
    throw new Error(`Falha ao criar sessao autenticada: ${error.message}`);
  }
}

export async function revokeSessionByTokenHash(tokenHash: string) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("auth_sessions").delete().eq("token_hash", tokenHash);

  if (error) {
    throw new Error(`Falha ao encerrar sessao autenticada: ${error.message}`);
  }
}

export async function getUserBySessionTokenHash(tokenHash: string) {
  const supabase = getSupabaseAdminClient();
  const { data: sessionData, error: sessionError } = await supabase
    .from("auth_sessions")
    .select("id, user_id, token_hash, expires_at, created_at, last_seen_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (sessionError) {
    throw new Error(`Falha ao consultar sessao autenticada: ${sessionError.message}`);
  }

  const session = (sessionData as SessionRow | null) ?? null;

  if (!session) {
    return null;
  }

  const user = await getUserById(session.user_id);

  if (!user || !user.is_active) {
    return null;
  }

  return {
    session,
    user: sanitizeUser(user)
  };
}

export async function touchSession(tokenHash: string) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("auth_sessions")
    .update({
      last_seen_at: new Date().toISOString()
    })
    .eq("token_hash", tokenHash);

  if (error) {
    throw new Error(`Falha ao atualizar atividade da sessao: ${error.message}`);
  }
}

export async function listUsersForAdmin() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("id, username, email, password_hash, role, is_active, created_at, updated_at, last_login_at")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Falha ao listar usuarios: ${error.message}`);
  }

  return ((data ?? []) as UserRow[]).map(sanitizeAdminUser);
}

export async function updateUserRole(params: {
  userId: string;
  role: UserRole;
}) {
  const currentUser = await getUserById(params.userId);

  if (!currentUser) {
    throw new Error("Usuario nao encontrado.");
  }

  if (currentUser.role === "admin" && params.role !== "admin") {
    const totalAdmins = await countActiveAdmins();

    if (totalAdmins <= 1) {
      throw new Error("Nao e possivel remover a ultima conta admin.");
    }
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("app_users")
    .update({
      role: params.role,
      updated_at: new Date().toISOString()
    })
    .eq("id", params.userId)
    .select("id, username, email, password_hash, role, is_active, created_at, updated_at, last_login_at")
    .single();

  if (error || !data) {
    throw new Error(`Falha ao atualizar permissao do usuario: ${error?.message ?? "erro desconhecido"}`);
  }

  return sanitizeAdminUser(data as UserRow);
}
