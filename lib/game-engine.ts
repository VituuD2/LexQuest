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

function getDocumentTitles(caseId: string, documentIds: string[]) {
  return documentIds
    .map((documentId) => getAllDocuments(caseId).find((document) => document.id === documentId)?.title)
    .filter((title): title is string => Boolean(title));
}

function hasAdequateFoundationForRiskyDocument(documentId: string, foundationIds: string[]) {
  const adequateFoundationsByDocument: Record<string, string[]> = {
    doc_003: ["fund_decisao_generica", "fund_ausencia_violencia", "fund_colaboracao_abordagem"],
    doc_006: ["fund_video_inconclusivo", "fund_abordagem_antes_saida", "fund_duvida_consumacao"],
    doc_008: ["fund_cautelares_diversas", "fund_vinculo_familiar_residencia", "fund_trabalho_informal"]
  };
  const adequateFoundations = adequateFoundationsByDocument[documentId] ?? [
    "fund_decisao_generica",
    "fund_cautelares_diversas"
  ];

  return adequateFoundations.some((foundationId) => foundationIds.includes(foundationId));
}

function evaluateDocumentSelection(caseId: string, step: Step, selectedDocumentIds: string[], selectedFoundationIds: string[]) {
  const config = step.document_selection;

  if (!config?.enabled) {
    return {
      delta: { legalidade: 0, estrategia: 0, etica: 0 },
      selected: [] as string[],
      wellChosen: [] as string[],
      ignored: [] as string[],
      risky: [] as string[],
      feedback: ""
    };
  }

  const selectedRelevantIds = selectedDocumentIds.filter((documentId) => config.relevant_document_ids.includes(documentId));
  const ignoredRelevantIds = config.relevant_document_ids.filter((documentId) => !selectedDocumentIds.includes(documentId));
  const riskyWithoutSupportIds = selectedDocumentIds.filter(
    (documentId) =>
      config.risky_document_ids.includes(documentId) &&
      !hasAdequateFoundationForRiskyDocument(documentId, selectedFoundationIds)
  );

  const missingPenalty = Math.min(12, ignoredRelevantIds.length * config.missing_important_document_penalty);
  const riskyPenalty = riskyWithoutSupportIds.length * 3;
  const delta = {
    legalidade: selectedRelevantIds.length * 2 - riskyWithoutSupportIds.length * 2,
    estrategia: selectedRelevantIds.length * 3 - missingPenalty - riskyPenalty,
    etica: 0
  };
  const selected = getDocumentTitles(caseId, selectedDocumentIds);
  const wellChosen = getDocumentTitles(caseId, selectedRelevantIds);
  const ignored = getDocumentTitles(caseId, ignoredRelevantIds);
  const risky = getDocumentTitles(caseId, riskyWithoutSupportIds);
  const feedbackParts: string[] = [];

  if (wellChosen.length > 0) {
    feedbackParts.push(`Provas bem escolhidas: ${wellChosen.join(", ")}.`);
  }

  if (ignored.length > 0) {
    feedbackParts.push(`Provas importantes ignoradas: ${ignored.join(", ")}.`);
  }

  if (risky.length > 0) {
    feedbackParts.push(`Provas arriscadas usadas sem amarracao suficiente: ${risky.join(", ")}.`);
  }

  return {
    delta,
    selected,
    wellChosen,
    ignored,
    risky,
    feedback: feedbackParts.join(" ")
  };
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
  selectedDocuments?: string[];
  documentEvidence?: ChoiceHistoryEntry["documentEvidence"];
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
    selectedDocuments: params.selectedDocuments,
    documentEvidence: params.documentEvidence,
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
  const ignoredDocumentCount = gameState.choices_history.reduce(
    (total, entry) => total + (entry.documentEvidence?.ignored.length ?? 0),
    0
  );
  const riskyDocumentCount = gameState.choices_history.reduce(
    (total, entry) => total + (entry.documentEvidence?.risky.length ?? 0),
    0
  );
  const riskyFoundationCount = selectedFoundationLabels.filter((label) =>
    [
      "Clamor social autoriza preventiva",
      "Todo antecedente justifica prisao",
      "Furto de loja nunca e crime",
      "Seguranca privado invalida o flagrante",
      "Baixa renda afasta crime automaticamente"
    ].includes(label)
  ).length;

  if (
    riskyFoundationCount >= 2 ||
    riskyDocumentCount >= 2 ||
    gameState.flags.peca_ampla_dispersiva ||
    gameState.flags.nulidade_privada_absolutizada
  ) {
    return average >= 55 ? "atuacao_defensavel_com_falhas" : "atuacao_fraca";
  }

  if ((lastRubricScore !== undefined && lastRubricScore < 14 && average < 82) || ignoredDocumentCount >= 4) {
    return "atuacao_defensavel_com_falhas";
  }

  if (
    average >= 90 &&
    openedDocumentCount >= 6 &&
    ignoredDocumentCount <= 1 &&
    riskyDocumentCount === 0 &&
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
  selectedDocumentIds?: string[];
}) {
  const { gameState, step, choiceKey, freeText, selectedFoundationIds = [], selectedDocumentIds = [] } = params;
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
  const documentEvaluation = evaluateDocumentSelection(caseId, step, selectedDocumentIds, selectedFoundationIds);
  const hasDocumentSelection = Boolean(step.document_selection?.enabled);
  const documentEvidence = hasDocumentSelection
    ? {
        wellChosen: documentEvaluation.wellChosen,
        ignored: documentEvaluation.ignored,
        risky: documentEvaluation.risky
      }
    : undefined;
  const combinedFeedbackParts = (primaryFeedback: string) =>
    [primaryFeedback, foundationFeedback, documentEvaluation.feedback].filter(Boolean).join(" ");

  if (step.free_text?.enabled) {
    const evaluation = evaluateFreeText(caseId, freeText ?? "");
    const combinedDelta = {
      legalidade: evaluation.delta.legalidade + foundationDelta.legalidade + documentEvaluation.delta.legalidade,
      estrategia: evaluation.delta.estrategia + foundationDelta.estrategia + documentEvaluation.delta.estrategia,
      etica: evaluation.delta.etica + foundationDelta.etica + documentEvaluation.delta.etica
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
          feedback: combinedFeedbackParts(evaluation.feedback),
          consequence: "A qualidade da redacao e dos fundamentos escolhidos passa a definir a forca persuasiva do pedido urgente.",
          scoreDelta: combinedDelta,
          selectedFoundations: foundationLabels,
          selectedDocuments: hasDocumentSelection ? documentEvaluation.selected : undefined,
          documentEvidence,
          freeText,
          rubricScore: evaluation.score
        })
      ]
    };

    const adjustedState = applyFailureIfNeeded(nextState);

    const feedback: FeedbackState = {
      title: "Minuta protocolada",
      narrative: evaluation.narrative,
      juridicalFeedback: combinedFeedbackParts(evaluation.feedback),
      mentorTitle: "Leitura do advogado senior",
      mentorSummary: buildMentorSummary(step, combinedDelta),
      mentorRules: getMentorRules(step, selectedFoundationIds),
      consequence: "O relator recebe uma peca com fundamentos selecionados expressamente pela defesa.",
      scoreDelta: combinedDelta,
      unlockedDocuments,
      nextStep: adjustedState.current_step,
      selectedFoundations: foundationLabels,
      selectedDocuments: hasDocumentSelection ? documentEvaluation.selected : undefined,
      documentEvidence
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
    legalidade: strategyDelta.legalidade + foundationDelta.legalidade + documentEvaluation.delta.legalidade,
    estrategia: strategyDelta.estrategia + foundationDelta.estrategia + documentEvaluation.delta.estrategia,
    etica: strategyDelta.etica + foundationDelta.etica + documentEvaluation.delta.etica
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
        feedback: combinedFeedbackParts(matchedRule?.explanation ?? fallbackFeedback),
        consequence: matchedRule?.consequence,
        scoreDelta: delta,
        selectedFoundations: foundationLabels,
        selectedDocuments: hasDocumentSelection ? documentEvaluation.selected : undefined,
        documentEvidence
      })
    ]
  };

  const nextState = applyFailureIfNeeded(rawNextState);

  const feedback: FeedbackState = {
    title: choice?.label ?? step.title,
    narrative: buildNarrative(step, matchedRule?.consequence),
    juridicalFeedback: combinedFeedbackParts(matchedRule?.explanation ?? fallbackFeedback),
    mentorTitle: "Leitura do advogado senior",
    mentorSummary: buildMentorSummary(step, delta),
    mentorRules: getMentorRules(step, selectedFoundationIds),
    consequence: matchedRule?.consequence,
    scoreDelta: delta,
    unlockedDocuments,
    nextStep: nextState.current_step,
    selectedFoundations: foundationLabels,
    selectedDocuments: hasDocumentSelection ? documentEvaluation.selected : undefined,
    documentEvidence
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

function clampRating(value: number) {
  return Math.max(0, Math.min(100, value));
}

function getRiskyFoundationCount(gameState: GameState) {
  const selectedFoundationLabels = gameState.choices_history.flatMap((entry) => entry.selectedFoundations ?? []);

  return selectedFoundationLabels.filter((label) =>
    [
      "Clamor social autoriza preventiva",
      "Todo antecedente justifica prisao",
      "Furto de loja nunca e crime",
      "Seguranca privado invalida o flagrante",
      "Baixa renda afasta crime automaticamente"
    ].includes(label)
  ).length;
}

function getFinalRubricScore(gameState: GameState) {
  return [...gameState.choices_history]
    .reverse()
    .find((entry) => entry.rubricScore !== undefined)?.rubricScore;
}

function getDocumentEvidenceTotals(gameState: GameState) {
  return gameState.choices_history.reduce(
    (totals, entry) => ({
      wellChosen: totals.wellChosen + (entry.documentEvidence?.wellChosen.length ?? 0),
      ignored: totals.ignored + (entry.documentEvidence?.ignored.length ?? 0),
      risky: totals.risky + (entry.documentEvidence?.risky.length ?? 0)
    }),
    {
      wellChosen: 0,
      ignored: 0,
      risky: 0
    }
  );
}

function resolveRatingLabel(score: number) {
  if (score >= 95) {
    return {
      label: "Advogado multinacional",
      headline: "Atuacao de alto nivel: tecnica, prova e timing trabalharam juntos."
    };
  }

  if (score >= 85) {
    return {
      label: "Estrategista de tribunal",
      headline: "Leitura madura de autos, com boa calibragem de risco."
    };
  }

  if (score >= 72) {
    return {
      label: "Advogado senior",
      headline: "Conducao consistente, com poucos ajustes para virar excelencia."
    };
  }

  if (score >= 58) {
    return {
      label: "Advogado de comarca",
      headline: "Boa intuicao pratica, mas ainda com oscilacao tecnica."
    };
  }

  if (score >= 42) {
    return {
      label: "Advogado amador",
      headline: "Voce enxergou partes do problema, mas perdeu pontos de metodo."
    };
  }

  return {
    label: "Estagiario em plantao",
    headline: "A partida mostrou urgencia, mas ainda faltou estrutura profissional."
  };
}

function calculatePerformanceRating(gameState: GameState, average: number): FinalReportData["performanceRating"] {
  const openedDocumentCount = Object.values(gameState.document_state ?? {}).filter((document) => document.isOpened).length;
  const unlockedDocumentCount = Math.max(1, gameState.documents_unlocked.length);
  const openedDocumentRatio = openedDocumentCount / unlockedDocumentCount;
  const finalRubricScore = getFinalRubricScore(gameState);
  const documentTotals = getDocumentEvidenceTotals(gameState);
  const riskyFoundationCount = getRiskyFoundationCount(gameState);
  const riskyChoiceCount = [
    gameState.flags.protocolo_precipitado,
    gameState.flags.adiou_impugnacao_urgente,
    gameState.flags.peca_ampla_dispersiva,
    gameState.flags.exagerou_merito,
    gameState.flags.nulidade_privada_absolutizada
  ].filter(Boolean).length;

  const rubricModifier =
    finalRubricScore === undefined ? -4 : finalRubricScore >= 24 ? 6 : finalRubricScore >= 18 ? 3 : finalRubricScore >= 12 ? 0 : -7;
  const documentModifier = openedDocumentRatio >= 0.75 ? 4 : openedDocumentRatio >= 0.5 ? 1 : -5;
  const evidenceModifier = documentTotals.wellChosen * 2 - documentTotals.ignored * 2 - documentTotals.risky * 4;
  const riskModifier = riskyFoundationCount * -4 + riskyChoiceCount * -3;
  const ethicsModifier = gameState.etica >= 80 ? 3 : gameState.etica < 35 ? -7 : 0;
  const score = clampRating(Math.round(average + rubricModifier + documentModifier + evidenceModifier + riskModifier + ethicsModifier));
  const resolved = resolveRatingLabel(score);
  const strengths: string[] = [];
  const improvements: string[] = [];

  if (gameState.flags.identificou_decisao_generica) {
    strengths.push("Identificou o problema central da preventiva.");
  }

  if (documentTotals.wellChosen >= 6) {
    strengths.push("Usou documentos como prova, nao apenas como leitura de contexto.");
  }

  if ((finalRubricScore ?? 0) >= 24) {
    strengths.push("Redigiu uma minuta com boa estrutura argumentativa.");
  }

  if (gameState.etica >= 75) {
    strengths.push("Manteve postura etica e tecnica sob pressao.");
  }

  if (documentTotals.ignored >= 3) {
    improvements.push("Ler e selecionar melhor os documentos essenciais antes de confirmar a estrategia.");
  }

  if (documentTotals.risky > 0 || riskyFoundationCount > 0) {
    improvements.push("Evitar usar prova ou fundamento sensivel sem amarracao tecnica suficiente.");
  }

  if ((finalRubricScore ?? 0) < 18) {
    improvements.push("Melhorar a estrutura do pedido liminar: pedido, vicio, fatos, risco e cautelares.");
  }

  if (riskyChoiceCount >= 2) {
    improvements.push("Reduzir escolhas impulsivas e manter uma linha processual mais coerente.");
  }

  if (strengths.length === 0) {
    strengths.push("Conseguiu concluir o plantao e receber um diagnostico completo da atuacao.");
  }

  if (improvements.length === 0) {
    improvements.push("Refinar detalhes de prova e redacao para transformar uma boa atuacao em excelencia.");
  }

  return {
    score,
    label: resolved.label,
    headline: resolved.headline,
    summary: `Rating calculado por parametros do caso: media final, documentos lidos, provas escolhidas, rubrica da minuta, fundamentos sensiveis e escolhas de risco.`,
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 3),
    parameters: [
      { label: "Media tecnica", value: `${average}/100` },
      { label: "Documentos lidos", value: `${openedDocumentCount}/${unlockedDocumentCount}` },
      { label: "Provas bem escolhidas", value: `${documentTotals.wellChosen}` },
      { label: "Provas ignoradas", value: `${documentTotals.ignored}` },
      { label: "Provas arriscadas", value: `${documentTotals.risky}` },
      { label: "Rubrica da minuta", value: finalRubricScore === undefined ? "nao avaliada" : `${finalRubricScore}/30` }
    ]
  };
}

export function calculateFinalReport(gameState: GameState): FinalReportData {
  const average = Math.round((gameState.legalidade + gameState.estrategia + gameState.etica) / 3);
  const endingKey = resolveEndingKey(gameState);
  const caseData = getCaseData(gameState.case_id);
  const performanceRating = calculatePerformanceRating(gameState, average);

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
    performanceRating,
    judgeOrder: caseData.final_orders?.[endingKey]
  };
}
