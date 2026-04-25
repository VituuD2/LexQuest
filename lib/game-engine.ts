import { DEFAULT_CASE_ID, getCaseContent } from "@/lib/case-content";
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

const KEYWORD_MAP: Record<string, string[]> = {
  pedido_liminar_claro: ["liminar", "alvara", "revogacao", "substituicao da prisao", "liberdade provisoria", "soltura"],
  vicio_preventiva: ["fundamentacao generica", "fundamentacao abstrata", "decisao generica", "ordem publica", "risco concreto", "individualizacao", "individualizada"],
  fatos_concretos_autos: ["sem violencia", "ausencia de violencia", "grave ameaca", "bem recuperado", "recuperacao integral", "antecedente", "video", "residencia", "valor reduzido"],
  enfrenta_fato_desfavoravel: ["embalagem", "mochila", "video", "passou pela area dos caixas", "ainda que", "embora"],
  proporcionalidade_cautelares: ["cautelares diversas", "medidas cautelares", "proporcionalidade", "menos gravosa"],
  coerencia_documentos: ["autos", "documentos", "decisao", "certidao", "video", "auto de prisao"],
  linguagem_tecnica_objetiva: ["preventiva", "custodiado", "liminar", "cautelar", "constrangimento ilegal"]
};

function getBundle(caseId = DEFAULT_CASE_ID) {
  return getCaseContent(caseId);
}

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

export function getCaseData(caseId = DEFAULT_CASE_ID) {
  return getBundle(caseId).caseData;
}

export function getLoseConditions(caseId = DEFAULT_CASE_ID) {
  return getCaseData(caseId).case.lose_conditions ?? null;
}

export function getFailureThresholdEntries(caseId = DEFAULT_CASE_ID): Array<{ key: MetricKey; label: string; floor: number }> {
  const loseConditions = getLoseConditions(caseId);
  const floor = loseConditions?.metric_floor ?? 0;

  return [
    { key: "legalidade", label: "Legalidade", floor },
    { key: "estrategia", label: "Estrategia", floor },
    { key: "etica", label: "Etica", floor }
  ];
}

export function getAllSteps(caseId = DEFAULT_CASE_ID) {
  return getBundle(caseId).steps;
}

export function getPlayableSteps(caseId = DEFAULT_CASE_ID) {
  return getAllSteps(caseId).filter((step) => step.step_number < 6);
}

export function getAllDocuments(caseId = DEFAULT_CASE_ID) {
  return getBundle(caseId).documents;
}

export function getRubric(caseId = DEFAULT_CASE_ID) {
  return getBundle(caseId).rubric;
}

export function getAllFoundations(caseId = DEFAULT_CASE_ID) {
  return getBundle(caseId).foundations;
}

export function getFoundationsForStep(caseId: string, stepNumber: number) {
  return getAllFoundations(caseId).filter((foundation) => foundation.valid_for_steps.includes(stepNumber));
}

export function getInitialGameState(caseId = DEFAULT_CASE_ID, startStep = 1): GameState {
  const baseState = getCaseData(caseId).initial_state;
  const playableSteps = getPlayableSteps(caseId);
  const normalizedStartStep = playableSteps.some((step) => step.step_number === startStep) ? startStep : 1;
  const unlockedDocuments = uniqueIds([
    ...baseState.documents_unlocked,
    ...getAllDocuments(caseId)
      .filter((document) => document.unlock_step <= normalizedStartStep)
      .map((document) => document.id)
  ]);

  return {
    ...baseState,
    current_step: normalizedStartStep,
    deadline_hours: Math.max(8, baseState.deadline_hours - Math.max(0, normalizedStartStep - 1) * 8),
    documents_unlocked: unlockedDocuments,
    document_state: initializeDocumentState(unlockedDocuments, baseState.document_state),
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

export function getStep(caseId: string, stepNumber: number) {
  return getAllSteps(caseId).find((step) => step.step_number === stepNumber);
}

export function getUnlockedDocuments(caseId: string, documentIds: string[]) {
  return getAllDocuments(caseId).filter((document) => documentIds.includes(document.id));
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

export function getScoringRule(caseId: string, stepNumber: number, choiceKey: string) {
  return getBundle(caseId).scoringRules.find((rule) => rule.step === stepNumber && rule.choice === choiceKey);
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

function countKeywordHits(normalizedText: string, keywords: string[]) {
  return keywords.filter((keyword) => normalizedText.includes(normalizeText(keyword))).length;
}

function matchesRubricCriterion(criterionId: string, normalizedText: string) {
  const keywords = KEYWORD_MAP[criterionId] ?? [];
  const keywordHits = countKeywordHits(normalizedText, keywords);

  if (criterionId === "pedido_liminar_claro") {
    return normalizedText.includes("liminar") && keywordHits >= 2;
  }

  if (criterionId === "vicio_preventiva") {
    return normalizedText.includes("preventiva") && keywordHits >= 2;
  }

  if (criterionId === "fatos_concretos_autos") {
    return keywordHits >= 3;
  }

  if (criterionId === "enfrenta_fato_desfavoravel") {
    const mentionsBadFact =
      normalizedText.includes("embalagem") ||
      normalizedText.includes("mochila") ||
      normalizedText.includes("video") ||
      normalizedText.includes("caixa");
    const usesConcession =
      normalizedText.includes("embora") ||
      normalizedText.includes("ainda que") ||
      normalizedText.includes("nao se ignora") ||
      normalizedText.includes("sem prejuizo");

    return mentionsBadFact && usesConcession;
  }

  if (criterionId === "proporcionalidade_cautelares") {
    return normalizedText.includes("cautelar") && keywordHits >= 2;
  }

  if (criterionId === "coerencia_documentos") {
    const avoidsUnsupportedCertainty =
      !normalizedText.includes("inocencia plena") &&
      !normalizedText.includes("prova absoluta") &&
      !normalizedText.includes("automaticamente ilegal");

    return keywordHits >= 2 && avoidsUnsupportedCertainty;
  }

  if (criterionId === "linguagem_tecnica_objetiva") {
    const wordCount = normalizedText.split(/\s+/).filter(Boolean).length;
    return wordCount >= 60 && keywordHits >= 3;
  }

  return keywordHits > 0;
}

function getFoundationLabels(caseId: string, foundationIds: string[]) {
  return foundationIds
    .map((foundationId) => getAllFoundations(caseId).find((foundation) => foundation.id === foundationId)?.label)
    .filter((label): label is string => Boolean(label));
}

export function getFoundationDelta(caseId: string, foundationIds: string[]) {
  return foundationIds.reduce(
    (accumulator, foundationId) => {
      const foundation = getAllFoundations(caseId).find((item) => item.id === foundationId);

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

function buildFoundationFeedback(caseId: string, foundationIds: string[]) {
  const selected = getAllFoundations(caseId).filter((foundation) => foundationIds.includes(foundation.id));

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
  const caseData = getCaseData(gameState.case_id);

  if (gameState.ending_key) {
    return gameState.ending_key;
  }

  const average = Math.round((gameState.legalidade + gameState.estrategia + gameState.etica) / 3);
  const openedDocumentCount = Object.values(gameState.document_state ?? {}).filter((document) => document.isOpened).length;
  const lastRubricScore = [...gameState.choices_history]
    .reverse()
    .find((entry) => entry.rubricScore !== undefined)?.rubricScore;
  const selectedFoundationLabels = gameState.choices_history.flatMap((entry) => entry.selectedFoundations ?? []);
  const riskyFoundationCount = selectedFoundationLabels.filter((label) =>
    [
      "Clamor social autoriza preventiva",
      "Todo antecedente justifica prisao",
      "Furto de loja nunca e crime",
      "Seguranca privado invalida o flagrante",
      "Baixa renda afasta crime automaticamente"
    ].includes(label)
  ).length;

  if (riskyFoundationCount >= 2 || gameState.flags.peca_ampla_dispersiva || gameState.flags.nulidade_privada_absolutizada) {
    return average >= 55 ? "atuacao_defensavel_com_falhas" : "atuacao_fraca";
  }

  if (lastRubricScore !== undefined && lastRubricScore < 14 && average < 82) {
    return "atuacao_defensavel_com_falhas";
  }

  if (
    average >= 90 &&
    openedDocumentCount >= 6 &&
    (lastRubricScore ?? 0) >= 24 &&
    gameState.flags.atendimento_responsavel &&
    (gameState.flags.escolheu_medida_urgente || gameState.flags.priorizou_origem_com_documentos) &&
    gameState.flags.tese_principal_correta
  ) {
    return "atuacao_excelente";
  }

  for (const rule of caseData.ending_rules ?? []) {
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
  const loseConditions = getCaseData(nextState.case_id).case.lose_conditions;

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
  const caseId = gameState.case_id;
  const choice = step.options.find((option) => option.key === choiceKey);
  const nextStep = choice?.next_step ?? step.step_number + 1;
  const nextStepData = getStep(caseId, nextStep);
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
  const foundationDelta = getFoundationDelta(caseId, selectedFoundationIds);
  const foundationFeedback = buildFoundationFeedback(caseId, selectedFoundationIds);
  const foundationLabels = getFoundationLabels(caseId, selectedFoundationIds);

  if (step.free_text?.enabled) {
    const evaluation = evaluateFreeText(caseId, freeText ?? "");
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

  const matchedRule = getScoringRule(caseId, step.step_number, choiceKey);
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

export function evaluateFreeText(caseId: string, text: string) {
  const normalizedText = normalizeText(text);
  const rubric = getRubric(caseId);
  let totalScore = 0;
  const matchedCriteria: string[] = [];

  for (const criterion of rubric.criteria) {
    const achieved = matchesRubricCriterion(criterion.id, normalizedText);

    if (achieved) {
      totalScore += criterion.points;
      matchedCriteria.push(criterion.description);
    }
  }

  const delta = {
    legalidade: Math.round(totalScore / 3),
    estrategia: Math.round(totalScore / 4),
    etica: matchedCriteria.some((item) => item.includes("tecnica") || item.includes("objetiva")) ? 3 : 1
  };

  const feedback =
    matchedCriteria.length > 0
      ? `A redacao contemplou ${matchedCriteria.length} dos ${rubric.criteria.length} elementos esperados pela rubrica.`
      : "O argumento ainda esta generico e precisa enfrentar melhor os fundamentos da preventiva.";

  const narrative =
    totalScore >= 20
      ? "A minuta ganha densidade tecnica, hierarquia argumentativa e transmite senso de urgencia compativel com o plantao."
      : "A peca foi apresentada, mas ainda carece de foco e densidade para pressionar revisao imediata da custodia.";

  return {
    score: Math.min(rubric.max_score, totalScore),
    delta,
    feedback,
    narrative
  };
}

export function calculateFinalReport(gameState: GameState): FinalReportData {
  const average = Math.round((gameState.legalidade + gameState.estrategia + gameState.etica) / 3);
  const endingKey = resolveEndingKey(gameState);
  const caseData = getCaseData(gameState.case_id);

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
    judgeOrder: caseData.final_orders?.[endingKey]
  };
}
