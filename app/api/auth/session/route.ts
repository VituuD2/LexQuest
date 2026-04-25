import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { buildAuthSessionPayload } from "@/lib/server/auth-session";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    return NextResponse.json(await buildAuthSessionPayload(user));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao carregar sessao autenticada.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
