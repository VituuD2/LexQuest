import caseData from "@/data/cases/hc_48h_001/case.json";
import documents from "@/data/cases/hc_48h_001/documents.json";
import rubric from "@/data/cases/hc_48h_001/rubric.json";
import scoringRules from "@/data/cases/hc_48h_001/scoring-rules.json";
import steps from "@/data/cases/hc_48h_001/steps.json";
import type {
  CaseData,
  CaseDocument,
  ChoiceHistoryEntry,
  FeedbackState,
  FinalReportData,
  GameState,
  Rubric,
  ScoringRule,
  Step
} from "@/lib/game-types";

const typedCaseData = caseData as CaseData;
const typedDocuments = documents as CaseDocument[];
const typedSteps = steps as Step[];
const typedScoringRules = scoringRules as ScoringRule[];
const typedRubric = rubric as Rubric;

const KEYWORD_MAP: Record<string, string[]> = {
  fundamentacao_generica: ["generica", "fundamentacao concreta", "ordem publica", "credibilidade da justica"],
  ausencia_violencia: ["sem violencia", "sem grave ameaca", "ausencia de violencia", "nao houve violencia"],
  bem_recuperado: ["bem recuperado", "recuperacao integral", "objeto recuperado", "sem dano", "bem foi recuperado"],
  antecedentes: ["sem transito em julgado", "sem condenacao definitiva", "primariedade tecnica", "processo anterior"],
  cautelares_diversas: ["medidas cautelares", "cautelares diversas", "comparecimento periodico", "proporcional"],
  tom_tecnico: ["preventiva", "custodiado", "liminar", "proporcionalidade", "constrangimento ilegal"],
  coerencia: ["decisao", "bem", "violencia", "cautelares", "antecedente"]
};

export function getCaseData() {
  return typedCaseData;
}

export function getAllSteps() {
  return typedSteps;
}

export function getAllDocuments() {
  return typedDocuments;
}

export function getRubric() {
  return typedRubric;
}

export function getInitialGameState(): GameState {
  return {
    ...typedCaseData.initial_state,
    choices_history: []
  };
}

export function getStep(stepNumber: number) {
  return typedSteps.find((step) => step.step_number === stepNumber);
}

export function getUnlockedDocuments(documentIds: string[]) {
  return typedDocuments.filter((document) => documentIds.includes(document.id));
}

export function getScoringRule(stepNumber: number, choiceKey: string) {
  return typedScoringRules.find((rule) => rule.step === stepNumber && rule.choice === choiceKey);
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

function uniqueIds(values: string[]) {
  return Array.from(new Set(values));
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function buildChoiceHistoryEntry(
  step: Step,
  choiceKey: string,
  choiceLabel: string,
  feedback: string,
  scoreDelta: FeedbackState["scoreDelta"],
  freeText?: string,
  rubricScore?: number
): ChoiceHistoryEntry {
  return {
    stepNumber: step.step_number,
    stepTitle: step.title,
    choiceKey,
    choiceLabel,
    feedback,
    scoreDelta,
    freeText,
    rubricScore
  };
}

export function applyChoice(params: {
  gameState: GameState;
  step: Step;
  choiceKey: string;
  freeText?: string;
}) {
  const { gameState, step, choiceKey, freeText } = params;
  const choice = step.options.find((option) => option.key === choiceKey);
  const nextStep = step.step_number + 1;
  const nextStepData = getStep(nextStep);
  const unlockedDocuments = uniqueIds([
    ...gameState.documents_unlocked,
    ...(nextStepData?.unlock_documents ?? [])
  ]);

  if (step.free_text?.enabled) {
    const evaluation = evaluateFreeText(freeText ?? "");
    const nextState: GameState = {
      ...gameState,
      current_step: nextStep,
      legalidade: clampScore(gameState.legalidade + evaluation.delta.legalidade),
      estrategia: clampScore(gameState.estrategia + evaluation.delta.estrategia),
      etica: clampScore(gameState.etica + evaluation.delta.etica),
      documents_unlocked: unlockedDocuments,
      flags: {
        ...gameState.flags,
        falou_com_cliente: true
      },
      choices_history: [
        ...gameState.choices_history,
        buildChoiceHistoryEntry(
          step,
          "FREE_TEXT",
          "Argumento liminar",
          evaluation.feedback,
          evaluation.delta,
          freeText,
          evaluation.score
        )
      ]
    };

    const feedback: FeedbackState = {
      title: "Fundamento protocolado",
      narrative: evaluation.narrative,
      juridicalFeedback: evaluation.feedback,
      scoreDelta: evaluation.delta,
      unlockedDocuments,
      nextStep
    };

    return {
      nextState,
      feedback
    };
  }

  const matchedRule = getScoringRule(step.step_number, choiceKey);
  const fallbackFeedback = "Escolha juridicamente fraca ou inadequada para o objetivo da etapa.";
  const delta = matchedRule
    ? {
        legalidade: matchedRule.legalidade,
        estrategia: matchedRule.estrategia,
        etica: matchedRule.etica
      }
    : {
        legalidade: -10,
        estrategia: -10,
        etica: 0
      };

  const activatedFlags = matchedRule?.flags ?? [];
  const nextFlags = {
    ...gameState.flags
  };

  for (const flag of activatedFlags) {
    nextFlags[flag] = true;
  }

  if (step.step_number >= 2) {
    nextFlags.identificou_decisao_generica = nextFlags.identificou_decisao_generica || choiceKey === "A";
  }

  if (step.step_number >= 3) {
    nextFlags.analisou_antecedentes = true;
    nextFlags.viu_video = true;
  }

  if (step.step_number >= 4) {
    nextFlags.falou_com_cliente = true;
  }

  const nextState: GameState = {
    ...gameState,
    current_step: nextStep,
    legalidade: clampScore(gameState.legalidade + delta.legalidade),
    estrategia: clampScore(gameState.estrategia + delta.estrategia),
    etica: clampScore(gameState.etica + delta.etica),
    documents_unlocked: unlockedDocuments,
    flags: nextFlags,
    choices_history: [
      ...gameState.choices_history,
      buildChoiceHistoryEntry(
        step,
        choiceKey,
        choice?.text ?? choiceKey,
        matchedRule?.explanation ?? fallbackFeedback,
        delta
      )
    ]
  };

  const feedback: FeedbackState = {
    title: step.title,
    narrative: buildNarrative(step, matchedRule !== undefined),
    juridicalFeedback: matchedRule?.explanation ?? fallbackFeedback,
    scoreDelta: delta,
    unlockedDocuments,
    nextStep
  };

  return {
    nextState,
    feedback
  };
}

function buildNarrative(step: Step, wasStrongChoice: boolean) {
  if (wasStrongChoice) {
    return `Sua atuação na etapa "${step.title}" consolidou a defesa com mais segurança. O caso segue em movimento, e cada documento agora pesa a favor de uma estratégia mais refinada.`;
  }

  return `A escolha na etapa "${step.title}" manteve o caso vivo, mas abriu espaço para fragilidades estratégicas. O relógio continua correndo e a próxima decisão fica ainda mais importante.`;
}

export function evaluateFreeText(text: string) {
  const normalizedText = normalizeText(text);
  let totalScore = 0;
  const matchedCriteria: string[] = [];

  for (const criterion of typedRubric.criteria) {
    const keywords = KEYWORD_MAP[criterion.id] ?? [];
    const achieved = keywords.some((keyword) => normalizedText.includes(normalizeText(keyword)));

    if (achieved) {
      totalScore += criterion.points;
      matchedCriteria.push(criterion.description);
    }
  }

  const delta = {
    legalidade: Math.round(totalScore / 3),
    estrategia: Math.round(totalScore / 4),
    etica: matchedCriteria.some((item) => item.includes("linguagem tecnica")) ? 3 : 1
  };

  const feedback =
    matchedCriteria.length > 0
      ? `Seu texto contemplou ${matchedCriteria.length} dos ${typedRubric.criteria.length} elementos esperados pela rubrica.`
      : "O argumento ainda esta generico e precisa enfrentar melhor os fundamentos da prisao preventiva.";

  const narrative =
    totalScore >= 20
      ? "A minuta do pedido liminar ganha densidade tecnica e transmite urgencia com boa organizacao defensiva."
      : "A peticao foi apresentada, mas ainda carece de densidade argumentativa para pressionar a revisao da preventiva.";

  return {
    score: Math.min(typedRubric.max_score, totalScore),
    delta,
    feedback,
    narrative
  };
}

export function calculateFinalReport(gameState: GameState): FinalReportData {
  const average = Math.round((gameState.legalidade + gameState.estrategia + gameState.etica) / 3);

  if (average >= 90) {
    return {
      average,
      label: "atuacao excelente",
      summary: "A liminar encontra terreno favoravel: sua estrategia foi tecnica, proporcional e consistente do inicio ao fim."
    };
  }

  if (average >= 70) {
    return {
      average,
      label: "boa atuacao",
      summary: "A defesa construiu um caminho solido. Ainda ha ajustes finos possiveis, mas a linha principal esta bem sustentada."
    };
  }

  if (average >= 40) {
    return {
      average,
      label: "atuacao defensavel com falhas",
      summary: "Voce protegeu parte relevante dos interesses do cliente, mas algumas escolhas reduziram a forca pratica da ofensiva defensiva."
    };
  }

  return {
    average,
    label: "atuacao fraca",
    summary: "A estrategia nao conseguiu responder bem a urgencia do caso. O relatorio mostra onde a defesa perdeu tracao."
  };
}
