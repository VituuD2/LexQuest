import { NextResponse } from "next/server";
import type { PhaseBuilderBlock } from "@/lib/phase-authoring";
import { saveCaseAuthoringStep } from "@/lib/server/authoring-repository";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    caseId: string;
    stepNumber: string;
  }>;
};

type SaveStepPayload = {
  mode: "blocks" | "json";
  blocks?: PhaseBuilderBlock[];
  rawJson?: string;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { caseId, stepNumber } = await context.params;
    const payload = (await request.json()) as SaveStepPayload;
    const parsedStepNumber = Number.parseInt(stepNumber, 10);

    if (Number.isNaN(parsedStepNumber)) {
      return NextResponse.json({ error: "Numero de etapa invalido." }, { status: 400 });
    }

    const result = await saveCaseAuthoringStep({
      caseId,
      stepNumber: parsedStepNumber,
      mode: payload.mode,
      blocks: payload.blocks,
      rawJson: payload.rawJson
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao salvar etapa.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
