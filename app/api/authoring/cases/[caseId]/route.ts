import { NextResponse } from "next/server";
import { getCaseAuthoringBundle } from "@/lib/server/authoring-repository";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    caseId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { caseId } = await context.params;
    const bundle = await getCaseAuthoringBundle(caseId);
    return NextResponse.json(bundle);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao carregar criador de fases.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
