import hcCaseData from "@/data/cases/hc_48h_001/case.json";
import hcDocuments from "@/data/cases/hc_48h_001/documents.json";
import hcFoundations from "@/data/cases/hc_48h_001/foundations.json";
import hcRubric from "@/data/cases/hc_48h_001/rubric.json";
import hcScoringRules from "@/data/cases/hc_48h_001/scoring-rules.json";
import hcSteps from "@/data/cases/hc_48h_001/steps.json";
import futureCaseData from "@/data/cases/trabalho_plantao_002/case.json";
import futureDocuments from "@/data/cases/trabalho_plantao_002/documents.json";
import futureFoundations from "@/data/cases/trabalho_plantao_002/foundations.json";
import futureRubric from "@/data/cases/trabalho_plantao_002/rubric.json";
import futureScoringRules from "@/data/cases/trabalho_plantao_002/scoring-rules.json";
import futureSteps from "@/data/cases/trabalho_plantao_002/steps.json";
import type { CaseData, CaseDocument, Foundation, Rubric, ScoringRule, Step } from "@/lib/game-types";

export const DEFAULT_CASE_ID = "hc_48h_001";

export type CaseContentBundle = {
  caseData: CaseData;
  documents: CaseDocument[];
  foundations: Foundation[];
  rubric: Rubric;
  scoringRules: ScoringRule[];
  steps: Step[];
};

const CASE_CONTENT: Record<string, CaseContentBundle> = {
  hc_48h_001: {
    caseData: hcCaseData as CaseData,
    documents: hcDocuments as CaseDocument[],
    foundations: hcFoundations as Foundation[],
    rubric: hcRubric as Rubric,
    scoringRules: hcScoringRules as ScoringRule[],
    steps: hcSteps as Step[]
  },
  trabalho_plantao_002: {
    caseData: futureCaseData as CaseData,
    documents: futureDocuments as CaseDocument[],
    foundations: futureFoundations as Foundation[],
    rubric: futureRubric as Rubric,
    scoringRules: futureScoringRules as ScoringRule[],
    steps: futureSteps as Step[]
  }
};

export function getCaseContent(caseId = DEFAULT_CASE_ID): CaseContentBundle {
  const bundle = CASE_CONTENT[caseId];

  if (!bundle) {
    throw new Error(`Caso nao encontrado no catalogo local: ${caseId}`);
  }

  return bundle;
}

export function listCaseContentIds() {
  return Object.keys(CASE_CONTENT);
}
