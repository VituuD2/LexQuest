import "server-only";

import { getAllSteps, getCaseData, getStep } from "@/lib/game-engine";
import type { PhaseBuilderBlock } from "@/lib/phase-authoring";
import { blocksToStepDraft, buildPhaseAuthoringSnapshot, parseJsonStepDraft, validateStepDraft } from "@/lib/phase-authoring";
import type { Step } from "@/lib/game-types";
import { getCasePublicationState } from "@/lib/server/game-catalog";
import { getSupabaseAdminClient } from "@/lib/server/supabase";

type CaseVersionRow = {
  id: string;
  case_id: string;
  version_number: number;
  label: string;
  source_mode: "blocks" | "json";
  status: "draft" | "published" | "archived";
  updated_at: string;
};

type StepBuilderRow = {
  id: string;
  case_version_id: string;
  step_id: string | null;
  step_number: number;
  mode: "blocks" | "json";
  blocks: PhaseBuilderBlock[] | null;
  raw_json: Step | null;
  normalized_step: Step | null;
  validation: {
    isValid: boolean;
    issues: string[];
  } | null;
  updated_at: string;
};

export type AuthoringStepBundle = {
  stepNumber: number;
  stepId: string;
  mode: "blocks" | "json";
  blocks: PhaseBuilderBlock[];
  rawJson: string;
  previewStep: Step;
  validation: {
    isValid: boolean;
    issues: string[];
  };
  updatedAt: string;
};

export type AuthoringBundle = {
  caseId: string;
  caseTitle: string;
  supportedInputs: Array<"blocks" | "json">;
  defaultMode: "blocks" | "json";
  publication: {
    status: "draft" | "published" | "archived";
    publishedAt: string | null;
    publishedVersionNumber: number | null;
  };
  version: {
    id: string;
    number: number;
    label: string;
    sourceMode: "blocks" | "json";
    status: "draft" | "published" | "archived";
    updatedAt: string;
  };
  steps: AuthoringStepBundle[];
};

function buildDefaultStepBundle(step: Step): Omit<AuthoringStepBundle, "updatedAt"> {
  const blocks = buildPhaseAuthoringSnapshot(step);
  const rawJson = JSON.stringify(step, null, 2);

  return {
    stepNumber: step.step_number,
    stepId: step.id,
    mode: "blocks",
    blocks,
    rawJson,
    previewStep: step,
    validation: validateStepDraft(step)
  };
}

function buildStepFromBlocks(caseId: string, stepNumber: number, blocks: PhaseBuilderBlock[]) {
  const fallbackStep = getStep(caseId, stepNumber);

  if (!fallbackStep) {
    throw new Error("Etapa base nao encontrada para autoria.");
  }

  return blocksToStepDraft(fallbackStep, blocks);
}

async function getStepBuildersForVersion(versionId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("case_step_builders")
    .select("id, case_version_id, step_id, step_number, mode, blocks, raw_json, normalized_step, validation, updated_at")
    .eq("case_version_id", versionId)
    .order("step_number", { ascending: true });

  if (error) {
    throw new Error(`Falha ao carregar etapas da versao: ${error.message}`);
  }

  return (data ?? []) as StepBuilderRow[];
}

async function ensureCaseRecord(caseId: string) {
  const supabase = getSupabaseAdminClient();
  const caseMeta = getCaseData(caseId);
  const { data, error } = await supabase
    .from("cases")
    .select("id")
    .eq("id", caseId)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao consultar caso base no banco: ${error.message}`);
  }

  if (data) {
    return;
  }

  const { error: insertError } = await supabase.from("cases").insert({
    id: caseMeta.case.id,
    title: caseMeta.case.title,
    description: caseMeta.case.description,
    area: caseMeta.case.area,
    difficulty: caseMeta.case.difficulty,
    estimated_duration_minutes: caseMeta.case.estimated_duration_minutes,
    target_audience: caseMeta.case.target_audience,
    score_bands: caseMeta.score_bands,
    characters: [],
    authoring_schema: {
      source: "local-case-catalog"
    },
    ai_config: {}
  });

  if (insertError) {
    throw new Error(`Falha ao registrar caso base no banco: ${insertError.message}`);
  }
}

async function createDraftVersion(
  caseId: string,
  options?: {
    sourceMode?: "blocks" | "json";
    sourceBuilders?: StepBuilderRow[];
  }
) {
  const supabase = getSupabaseAdminClient();
  await ensureCaseRecord(caseId);
  const { data: existingVersions, error: versionsError } = await supabase
    .from("case_versions")
    .select("version_number")
    .eq("case_id", caseId)
    .order("version_number", { ascending: false });

  if (versionsError) {
    throw new Error(`Falha ao consultar versoes do caso: ${versionsError.message}`);
  }

  const nextVersionNumber = (existingVersions?.[0]?.version_number ?? 0) + 1;
  const caseMeta = getCaseData(caseId);
  const sourceMode = options?.sourceMode ?? caseMeta.case.phase_builder?.default_mode ?? "blocks";

  const { data: versionData, error: insertVersionError } = await supabase
    .from("case_versions")
    .insert({
      case_id: caseId,
      version_number: nextVersionNumber,
      label: `Rascunho ${nextVersionNumber}`,
      source_mode: sourceMode,
      status: "draft",
      definition: {}
    })
    .select("id, case_id, version_number, label, source_mode, status, updated_at")
    .single();

  if (insertVersionError || !versionData) {
    throw new Error(`Falha ao criar versao em rascunho: ${insertVersionError?.message ?? "desconhecida"}`);
  }

  const defaultBuilders =
    options?.sourceBuilders?.map((step) => ({
      case_version_id: versionData.id,
      step_id: step.step_id,
      step_number: step.step_number,
      mode: step.mode,
      blocks: step.blocks,
      raw_json: step.raw_json,
      normalized_step: step.normalized_step,
      validation: step.validation
    })) ??
    getAllSteps(caseId)
      .filter((step) => step.step_number <= 6)
      .map((step) => {
        const snapshot = buildDefaultStepBundle(step);

        return {
          case_version_id: versionData.id,
          step_id: step.id,
          step_number: step.step_number,
          mode: snapshot.mode,
          blocks: snapshot.blocks,
          raw_json: snapshot.previewStep,
          normalized_step: snapshot.previewStep,
          validation: snapshot.validation
        };
      });

  const { error: buildersError } = await supabase.from("case_step_builders").insert(defaultBuilders);

  if (buildersError) {
    throw new Error(`Falha ao popular o rascunho inicial: ${buildersError.message}`);
  }

  return versionData as CaseVersionRow;
}

async function ensureDraftVersion(caseId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("case_versions")
    .select("id, case_id, version_number, label, source_mode, status, updated_at")
    .eq("case_id", caseId)
    .eq("status", "draft")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao carregar rascunho do caso: ${error.message}`);
  }

  if (data) {
    return data as CaseVersionRow;
  }

  return createDraftVersion(caseId);
}

export async function getCaseAuthoringBundle(caseId: string): Promise<AuthoringBundle> {
  const version = await ensureDraftVersion(caseId);
  const caseMeta = getCaseData(caseId);
  const builders = await getStepBuildersForVersion(version.id);
  const publication = await getCasePublicationState(caseId);
  const steps = getAllSteps(caseId)
    .filter((step) => step.step_number <= 6)
    .map((baseStep) => {
      const builder = builders.find((item) => item.step_number === baseStep.step_number);
      const fallback = buildDefaultStepBundle(baseStep);

      return {
        stepNumber: baseStep.step_number,
        stepId: baseStep.id,
        mode: builder?.mode ?? fallback.mode,
        blocks: builder?.blocks ?? fallback.blocks,
        rawJson: JSON.stringify(builder?.raw_json ?? fallback.previewStep, null, 2),
        previewStep: (builder?.normalized_step ?? fallback.previewStep) as Step,
        validation: builder?.validation ?? fallback.validation,
        updatedAt: builder?.updated_at ?? version.updated_at
      } satisfies AuthoringStepBundle;
    });

  return {
    caseId,
    caseTitle: caseMeta.case.title,
    supportedInputs: caseMeta.case.phase_builder?.supported_inputs ?? ["blocks", "json"],
    defaultMode: caseMeta.case.phase_builder?.default_mode ?? "blocks",
    publication: publication ?? {
      status: "draft",
      publishedAt: null,
      publishedVersionNumber: null
    },
    version: {
      id: version.id,
      number: version.version_number,
      label: version.label,
      sourceMode: version.source_mode,
      status: version.status,
      updatedAt: version.updated_at
    },
    steps
  };
}

export async function saveCaseAuthoringStep(params: {
  caseId: string;
  stepNumber: number;
  mode: "blocks" | "json";
  blocks?: PhaseBuilderBlock[];
  rawJson?: string;
}) {
  const supabase = getSupabaseAdminClient();
  const version = await ensureDraftVersion(params.caseId);
  const fallbackStep = getStep(params.caseId, params.stepNumber);

  if (!fallbackStep) {
    throw new Error("Etapa nao encontrada.");
  }

  const blocks = params.mode === "blocks" ? params.blocks ?? buildPhaseAuthoringSnapshot(fallbackStep) : buildPhaseAuthoringSnapshot(fallbackStep);
  const normalizedStep =
    params.mode === "blocks"
      ? buildStepFromBlocks(params.caseId, params.stepNumber, blocks)
      : parseJsonStepDraft(params.rawJson ?? JSON.stringify(fallbackStep, null, 2), fallbackStep);
  const validation = validateStepDraft(normalizedStep);

  const { error } = await supabase.from("case_step_builders").upsert(
    {
      case_version_id: version.id,
      step_id: normalizedStep.id,
      step_number: params.stepNumber,
      mode: params.mode,
      blocks,
      raw_json: params.mode === "json" ? JSON.parse(params.rawJson ?? JSON.stringify(normalizedStep)) : normalizedStep,
      normalized_step: normalizedStep,
      validation,
      updated_at: new Date().toISOString()
    },
    {
      onConflict: "case_version_id,step_number"
    }
  );

  if (error) {
    throw new Error(`Falha ao salvar etapa no criador: ${error.message}`);
  }

  const { error: versionUpdateError } = await supabase
    .from("case_versions")
    .update({
      source_mode: params.mode,
      updated_at: new Date().toISOString()
    })
    .eq("id", version.id);

  if (versionUpdateError) {
    throw new Error(`Falha ao atualizar metadata da versao: ${versionUpdateError.message}`);
  }

  return {
    versionId: version.id,
    stepNumber: params.stepNumber,
    mode: params.mode,
    blocks,
    rawJson: JSON.stringify(params.mode === "json" ? JSON.parse(params.rawJson ?? JSON.stringify(normalizedStep)) : normalizedStep, null, 2),
    previewStep: normalizedStep,
    validation,
    updatedAt: new Date().toISOString()
  };
}

export async function publishCaseDraft(caseId: string) {
  const supabase = getSupabaseAdminClient();
  const draftVersion = await ensureDraftVersion(caseId);
  const draftBuilders = await getStepBuildersForVersion(draftVersion.id);
  const now = new Date().toISOString();

  const { error: archivePublishedError } = await supabase
    .from("case_versions")
    .update({
      status: "archived",
      updated_at: now
    })
    .eq("case_id", caseId)
    .eq("status", "published");

  if (archivePublishedError) {
    throw new Error(`Falha ao arquivar versoes publicadas anteriores: ${archivePublishedError.message}`);
  }

  const { error: publishDraftError } = await supabase
    .from("case_versions")
    .update({
      label: `Publicado ${draftVersion.version_number}`,
      status: "published",
      published_at: now,
      updated_at: now
    })
    .eq("id", draftVersion.id);

  if (publishDraftError) {
    throw new Error(`Falha ao publicar o rascunho atual: ${publishDraftError.message}`);
  }

  await createDraftVersion(caseId, {
    sourceMode: draftVersion.source_mode,
    sourceBuilders: draftBuilders
  });
}

export async function unpublishCase(caseId: string) {
  const supabase = getSupabaseAdminClient();
  const draftVersion = await ensureDraftVersion(caseId);
  const draftBuilders = await getStepBuildersForVersion(draftVersion.id);
  const now = new Date().toISOString();

  const { data: publishedVersions, error: publishedLookupError } = await supabase
    .from("case_versions")
    .select("id")
    .eq("case_id", caseId)
    .eq("status", "published");

  if (publishedLookupError) {
    throw new Error(`Falha ao consultar versoes publicadas: ${publishedLookupError.message}`);
  }

  if ((publishedVersions ?? []).length > 0) {
    const { error: archivePublishedError } = await supabase
      .from("case_versions")
      .update({
        status: "archived",
        updated_at: now
      })
      .eq("case_id", caseId)
      .eq("status", "published");

    if (archivePublishedError) {
      throw new Error(`Falha ao retirar o jogo da home: ${archivePublishedError.message}`);
    }

    return;
  }

  const { error: archiveDraftError } = await supabase
    .from("case_versions")
    .update({
      label: `Arquivado ${draftVersion.version_number}`,
      status: "archived",
      updated_at: now
    })
    .eq("id", draftVersion.id);

  if (archiveDraftError) {
    throw new Error(`Falha ao registrar o estado oculto do jogo: ${archiveDraftError.message}`);
  }

  await createDraftVersion(caseId, {
    sourceMode: draftVersion.source_mode,
    sourceBuilders: draftBuilders
  });
}
