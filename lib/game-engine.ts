import caseData from "@/data/cases/hc_48h_001/case.json";
import documents from "@/data/cases/hc_48h_001/documents.json";
import foundations from "@/data/cases/hc_48h_001/foundations.json";
import rubric from "@/data/cases/hc_48h_001/rubric.json";
import scoringRules from "@/data/cases/hc_48h_001/scoring-rules.json";
import steps from "@/data/cases/hc_48h_001/steps.json";
import type {
  MetricKey,
  BranchCondition,
  CaseData,
  CaseDocument,
  ChoiceHistoryEntry,
  DocumentStateMap,
  FeedbackState,
  FinalReportData,
  Foundation,
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
const typedFoundations = foundations as Foundation[];

const KEYWORD_MAP: Record<string, string[]> = {
  fundamentacao_generica: ["generica", "fundamentacao concreta", "ordem publica", "credibilidade da justica"],
  ausencia_violencia: ["sem violencia", "sem grave ameaca", "ausencia de violencia", "nao houve violencia"],
  bem_recuperado: ["bem recuperado", "recuperacao integral", "objeto recuperado", "sem dano", "bem foi recuperado"],
  antecedentes: ["sem transito em julgado", "sem condenacao definitiva", "primariedade tecnica", "processo anterior"],
  cautelares_diversas: ["medidas cautelares", "cautelares diversas", "comparecimento periodico", "proporcional"],
  tom_tecnico: ["preventiva", "custodiado", "liminar", "proporcionalidade", "constrangimento ilegal"],
  coerencia: ["decisao", "bem", "violencia", "cautelares", "antecedente"]
};

function initializeDocumentState(documentIds: string[], existingState?: DocumentStateMap) {
  const baseState: DocumentStateMap = { ...(existingState ?? {}) };

  for (const documentId of documentIds) {
    if (!baseState[documentId]) {
      baseState[documentId] = {
        isNew: true,
        isOpened: false
      };
    }
  }

  return baseState;
}

function mergeUnlockedDocumentState(currentState: DocumentStateMap, existingUnlocked: string[], nextUnlocked: string[]) {
  const mergedState = initializeDocumentState(existingUnlocked, currentState);

  for (const documentId of nextUnlocked) {
    if (!mergedState[documentId]) {
      mergedState[documentId] = {
        isNew: true,
        isOpened: false
      };
      continue;
    }

    if (!existingUnlocked.includes(documentId) && !mergedState[documentId].isOpened) {
      mergedState[documentId] = {
        ...mergedState[documentId],
        isNew: true
      };
    }
  }

  return mergedState;
}

export function getCaseData() {
  return typedCaseData;
}

export function getLoseConditions() {
  return typedCaseData.case.lose_conditions ?? null;
}

export function getFailureThresholdEntries(): Array<{ key: MetricKey; label: string; floor: number }> {
  const loseConditions = getLoseConditions();
  const floor = loseConditions?.metric_floor ?? 0;

  return [
    { key: "legalidade", label: "Legalidade", floor },
    { key: "estrategia", label: "Estrategia", floor },
    { key: "etica", label: "Etica", floor }
  ];
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

export function getAllFoundations() {
  return typedFoundations;
}

export function getFoundationsForStep(stepNumber: number) {
  return typedFoundations.filter((foundation) => foundation.valid_for_steps.includes(stepNumber));
}

export function getInitialGameState(): GameState {
  const baseState = typedCaseData.initial_state;

  return {
    ...baseState,
    document_state: initializeDocumentState(baseState.documents_unlocked, baseState.document_state),
    choices_history: [],
    is_case_over: false
  };
}

export function ensureGameStateDefaults(gameState: GameState): GameState {
  return {
    ...gameState,
    document_state: initializeDocumentState(gameState.documents_unlocked, gameState.document_state),
    is_case_over: gameState.is_case_over ?? false
  };
}

export function getStep(stepNumber: number) {
  return typedSteps.find((step) => step.step_number === stepNumber);
}

export function getUnlockedDocuments(documentIds: string[]) {
  return typedDocuments.filter((document) => documentIds.includes(document.id));
}

export function markDocumentOpened(gameState: GameState, documentId: string): GameState {
  if (!gameState.document_state[documentId]) {
    return gameState;
  }

  return {
    ...gameState,
    document_state: {
      ...gameState.document_state,
      [documentId]: {
        isNew: false,
        isOpened: true
      }
    }
  };
}

export function getScoringRule(stepNumber: number, choiceKey: string) {
  return typedScoringRules.find((rule) => rule.step === stepNumber && rule.choice === choiceKey);
}

function getMentorRules(step: Step, selectedFoundationIds: string[]) {
  const rules = [
    "Ataque primeiro a necessidade da cautelar; nao antecipe o merito sem apoio forte nos autos.",
    "Use apenas fatos e inferencias que os documentos realmente sustentam.",
    "Se houver risco residual, ofereca medida cautelar diversa em vez de tese maximalista.",
    "Mantenha tom tecnico, sobrio e proporcional a urgencia do plantao."
  ];

  if (step.step_number === 1) {
    return [
      "Nao prometa soltura imediata sem leitura minima dos autos.",
      "Transforme urgencia em triagem documentada, nao em improviso.",
      "Proteja a confianca da familia sem vender certeza que o caso ainda nao comporta.",
      "Cada minuto sem lastro documental pode custar pontos de estrategia e credibilidade."
    ];
  }

  if (selectedFoundationIds.length > 0) {
    return [...rules, "Selecione fundamentos que conversem entre si; excesso ou contradicao enfraquecem a tese."];
  }

  return rules;
}

function buildMentorSummary(step: Step, delta: FeedbackState["scoreDelta"]) {
  const totalDelta = delta.legalidade + delta.estrategia + delta.etica;

  if (totalDelta >= 20) {
    return `Seu mentor enxergaria esta etapa como uma boa decisao de plantao: ${step.title.toLowerCase()} foi conduzida com criterio e utilidade pratica.`;
  }

  if (totalDelta >= 5) {
    return `Seu mentor veria uma base defensavel aqui, mas ainda com espaco para lapidar a calibragem tecnica da etapa ${step.step_number}.`;
  }

  return `Seu mentor apontaria que a etapa ${step.step_number} abriu vulnerabilidades reais na conducao do caso e exige correcao imediata no proximo movimento.`;
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

function getFoundationLabels(foundationIds: string[]) {
  return foundationIds
    .map((foundationId) => typedFoundations.find((foundation) => foundation.id === foundationId)?.label)
    .filter((label): label is string => Boolean(label));
}

export function getFoundationDelta(foundationIds: string[]) {
  return foundationIds.reduce(
    (accumulator, foundationId) => {
      const foundation = typedFoundations.find((item) => item.id === foundationId);

      if (!foundation) {
        return accumulator;
      }

      return {
        legalidade: accumulator.legalidade + foundation.weight.legalidade,
        estrategia: accumulator.estrategia + foundation.weight.estrategia,
        etica: accumulator.etica + foundation.weight.etica
      };
    },
    {
      legalidade: 0,
      estrategia: 0,
      etica: 0
    }
  );
}

function buildChoiceHistoryEntry(params: {
  step: Step;
  choiceKey: string;
  choiceLabel: string;
  feedback: string;
  consequence?: string;
  scoreDelta: FeedbackState["scoreDelta"];
  selectedFoundations?: string[];
  freeText?: string;
  rubricScore?: number;
}): ChoiceHistoryEntry {
  return {
    stepNumber: params.step.step_number,
    stepTitle: params.step.title,
    choiceKey: params.choiceKey,
    choiceLabel: params.choiceLabel,
    feedback: params.feedback,
    consequence: params.consequence,
    scoreDelta: params.scoreDelta,
    selectedFoundations: params.selectedFoundations,
    freeText: params.freeText,
    rubricScore: params.rubricScore
  };
}

function buildFoundationFeedback(foundationIds: string[]) {
  const selected = typedFoundations.filter((foundation) => foundationIds.includes(foundation.id));

  if (selected.length === 0) {
    return "";
  }

  const positive = selected.filter((foundation) => foundation.risk === "baixo").map((foundation) => foundation.label);
  const risky = selected.filter((foundation) => foundation.risk === "alto").map((foundation) => foundation.label);

  const parts: string[] = [];

  if (positive.length > 0) {
    parts.push(`Fundamentos bem escolhidos: ${positive.join(", ")}.`);
  }

  if (risky.length > 0) {
    parts.push(`Ponto de atencao: ${risky.join(", ")} pode enfraquecer a calibragem tecnica se usado sem cautela.`);
  }

  return parts.join(" ");
}

function matchesCondition(gameState: GameState, average: number, condition: BranchCondition) {
  if (condition.flag && !gameState.flags[condition.flag]) {
    return false;
  }

  if (condition.notFlag && gameState.flags[condition.notFlag]) {
    return false;
  }

  if (condition.minAverage !== undefined && average < condition.minAverage) {
    return false;
  }

  if (condition.maxAverage !== undefined && average > condition.maxAverage) {
    return false;
  }

  if (condition.minLegalidade !== undefined && gameState.legalidade < condition.minLegalidade) {
    return false;
  }

  if (condition.minEstrategia !== undefined && gameState.estrategia < condition.minEstrategia) {
    return false;
  }

  if (condition.minEtica !== undefined && gameState.etica < condition.minEtica) {
    return false;
  }

  return true;
}

function resolveEndingKey(gameState: GameState) {
  if (gameState.ending_key) {
    return gameState.ending_key;
  }

  const average = Math.round((gameState.legalidade + gameState.estrategia + gameState.etica) / 3);

  for (const rule of typedCaseData.ending_rules ?? []) {
    if (rule.conditions.every((condition) => matchesCondition(gameState, average, condition))) {
      return rule.key;
    }
  }

  if (average >= 90) {
    return "atuacao_excelente";
  }

  if (average >= 70) {
    return "boa_atuacao";
  }

  if (average >= 40) {
    return "atuacao_defensavel_com_falhas";
  }

  return "atuacao_fraca";
}

function applyFailureIfNeeded(nextState: GameState) {
  const loseConditions = typedCaseData.case.lose_conditions;

  if (!loseConditions) {
    return nextState;
  }

  const average = Math.round((nextState.legalidade + nextState.estrategia + nextState.etica) / 3);
  const triggered =
    nextState.legalidade <= loseConditions.metric_floor ||
    nextState.estrategia <= loseConditions.metric_floor ||
    nextState.etica <= loseConditions.metric_floor ||
    average <= loseConditions.average_floor;

  if (!triggered) {
    return nextState;
  }

  return {
    ...nextState,
    current_step: 6,
    is_case_over: true,
    ending_key: loseConditions.ending_key
  };
}

export function applyChoice(params: {
  gameState: GameState;
  step: Step;
  choiceKey: string;
  freeText?: string;
  selectedFoundationIds?: string[];
}) {
  const { gameState, step, choiceKey, freeText, selectedFoundationIds = [] } = params;
  const choice = step.options.find((option) => option.key === choiceKey);
  const nextStep = choice?.next_step ?? step.step_number + 1;
  const nextStepData = getStep(nextStep);
  const unlockedDocuments = uniqueIds([
    ...gameState.documents_unlocked,
    ...(choice?.unlock_documents ?? []),
    ...(nextStepData?.unlock_documents ?? [])
  ]);
  const nextDocumentState = mergeUnlockedDocumentState(
    gameState.document_state,
    gameState.documents_unlocked,
    unlockedDocuments
  );
  const foundationDelta = getFoundationDelta(selectedFoundationIds);
  const foundationFeedback = buildFoundationFeedback(selectedFoundationIds);
  const foundationLabels = getFoundationLabels(selectedFoundationIds);

  if (step.free_text?.enabled) {
    const evaluation = evaluateFreeText(freeText ?? "");
    const combinedDelta = {
      legalidade: evaluation.delta.legalidade + foundationDelta.legalidade,
      estrategia: evaluation.delta.estrategia + foundationDelta.estrategia,
      etica: evaluation.delta.etica + foundationDelta.etica
    };

    const nextState: GameState = {
      ...gameState,
      current_step: nextStep,
      legalidade: clampScore(gameState.legalidade + combinedDelta.legalidade),
      estrategia: clampScore(gameState.estrategia + combinedDelta.estrategia),
      etica: clampScore(gameState.etica + combinedDelta.etica),
      documents_unlocked: unlockedDocuments,
      document_state: nextDocumentState,
      flags: {
        ...gameState.flags,
        falou_com_cliente: true
      },
      ending_key: choice?.ending_key ?? gameState.ending_key,
      is_case_over: Boolean(choice?.ending_key),
      choices_history: [
        ...gameState.choices_history,
        buildChoiceHistoryEntry({
          step,
          choiceKey: "FREE_TEXT",
          choiceLabel: "Minuta liminar",
          feedback: `${evaluation.feedback} ${foundationFeedback}`.trim(),
          consequence: "A qualidade da redacao e dos fundamentos escolhidos passa a definir a forca persuasiva do pedido urgente.",
          scoreDelta: combinedDelta,
          selectedFoundations: foundationLabels,
          freeText,
          rubricScore: evaluation.score
        })
      ]
    };

    const adjustedState = applyFailureIfNeeded(nextState);

    const feedback: FeedbackState = {
      title: "Minuta protocolada",
      narrative: evaluation.narrative,
      juridicalFeedback: `${evaluation.feedback} ${foundationFeedback}`.trim(),
      mentorTitle: "Leitura do advogado senior",
      mentorSummary: buildMentorSummary(step, combinedDelta),
      mentorRules: getMentorRules(step, selectedFoundationIds),
      consequence: "O relator recebe uma peca com fundamentos selecionados expressamente pela defesa.",
      scoreDelta: combinedDelta,
      unlockedDocuments,
      nextStep: adjustedState.current_step,
      selectedFoundations: foundationLabels
    };

    return {
      nextState: adjustedState,
      feedback
    };
  }

  const matchedRule = getScoringRule(step.step_number, choiceKey);
  const fallbackFeedback = "Escolha juridicamente fraca ou inadequada para o objetivo da etapa.";
  const strategyDelta = matchedRule
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

  const delta = {
    legalidade: strategyDelta.legalidade + foundationDelta.legalidade,
    estrategia: strategyDelta.estrategia + foundationDelta.estrategia,
    etica: strategyDelta.etica + foundationDelta.etica
  };

  const activatedFlags = matchedRule?.flags ?? [];
  const nextFlags = {
    ...gameState.flags
  };

  for (const flag of activatedFlags) {
    nextFlags[flag] = true;
  }

  for (const flag of choice?.set_flags ?? []) {
    nextFlags[flag] = true;
  }

  if (step.step_number >= 2) {
    nextFlags.identificou_decisao_generica = nextFlags.identificou_decisao_generica || selectedFoundationIds.includes("fund_decisao_generica");
  }

  if (step.step_number >= 3) {
    nextFlags.analisou_antecedentes = true;
    nextFlags.viu_video = true;
  }

  if (step.step_number >= 4) {
    nextFlags.falou_com_cliente = true;
  }

  const rawNextState: GameState = {
    ...gameState,
    current_step: nextStep,
    legalidade: clampScore(gameState.legalidade + delta.legalidade),
    estrategia: clampScore(gameState.estrategia + delta.estrategia),
    etica: clampScore(gameState.etica + delta.etica),
    documents_unlocked: unlockedDocuments,
    document_state: nextDocumentState,
    flags: nextFlags,
    ending_key: choice?.ending_key ?? gameState.ending_key,
    is_case_over: Boolean(choice?.ending_key),
    choices_history: [
      ...gameState.choices_history,
      buildChoiceHistoryEntry({
        step,
        choiceKey,
        choiceLabel: choice ? `${choice.label} - ${choice.text}` : choiceKey,
        feedback: `${matchedRule?.explanation ?? fallbackFeedback} ${foundationFeedback}`.trim(),
        consequence: matchedRule?.consequence,
        scoreDelta: delta,
        selectedFoundations: foundationLabels
      })
    ]
  };

  const nextState = applyFailureIfNeeded(rawNextState);

  const feedback: FeedbackState = {
    title: choice?.label ?? step.title,
    narrative: buildNarrative(step, matchedRule?.consequence),
    juridicalFeedback: `${matchedRule?.explanation ?? fallbackFeedback} ${foundationFeedback}`.trim(),
    mentorTitle: "Leitura do advogado senior",
    mentorSummary: buildMentorSummary(step, delta),
    mentorRules: getMentorRules(step, selectedFoundationIds),
    consequence: matchedRule?.consequence,
    scoreDelta: delta,
    unlockedDocuments,
    nextStep: nextState.current_step,
    selectedFoundations: foundationLabels
  };

  return {
    nextState,
    feedback
  };
}

function buildNarrative(step: Step, consequence?: string) {
  if (consequence) {
    return consequence;
  }

  return `A decisao tomada na etapa "${step.title}" reposiciona a defesa e altera o ritmo do plantao.`;
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
    etica: matchedCriteria.some((item) => item.includes("tecnica")) ? 3 : 1
  };

  const feedback =
    matchedCriteria.length > 0
      ? `A redacao contemplou ${matchedCriteria.length} dos ${typedRubric.criteria.length} elementos esperados pela rubrica.`
      : "O argumento ainda esta generico e precisa enfrentar melhor os fundamentos da preventiva.";

  const narrative =
    totalScore >= 20
      ? "A minuta ganha densidade tecnica, hierarquia argumentativa e transmite senso de urgencia compativel com o plantao."
      : "A peca foi apresentada, mas ainda carece de foco e densidade para pressionar revisao imediata da custodia.";

  return {
    score: Math.min(typedRubric.max_score, totalScore),
    delta,
    feedback,
    narrative
  };
}

export function calculateFinalReport(gameState: GameState): FinalReportData {
  const average = Math.round((gameState.legalidade + gameState.estrategia + gameState.etica) / 3);
  const endingKey = resolveEndingKey(gameState);

  const summaries: Record<string, string> = {
    atuacao_excelente:
      "A defesa atuou com tecnica, timing e selecao madura de fundamentos, elevando bastante a chance de tutela util em plantao.",
    boa_atuacao:
      "A estrategia foi consistente e bem sustentada, ainda que com alguns pontos que poderiam ser calibrados com mais refinamento.",
    atuacao_defensavel_com_falhas:
      "A defesa apresentou caminhos plausiveis, mas escolhas de fundamento ou de foco reduziram a forca global do pedido.",
    atuacao_fraca:
      "A combinacao entre estrategia e fundamentos nao conseguiu entregar resposta tecnicamente robusta para a urgencia do caso.",
    derrota_tecnica_antecipada:
      "A atuacao perdeu tracao cedo demais. A soma entre pressa, fundamentos mal escolhidos e desgaste estrategico fechou o caminho antes do exame ideal do pedido."
  };

  return {
    average,
    endingKey,
    label: endingKey.replaceAll("_", " "),
    summary: summaries[endingKey] ?? summaries.atuacao_fraca,
    judgeOrder: typedCaseData.final_orders?.[endingKey]
  };
}
