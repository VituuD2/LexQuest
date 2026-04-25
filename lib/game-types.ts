export type MetricKey = "legalidade" | "estrategia" | "etica";
export type ThemePreference = "system" | "light" | "dark";

export type CaseFlagMap = Record<string, boolean>;
export type BranchCondition = {
  flag?: string;
  notFlag?: string;
  minAverage?: number;
  maxAverage?: number;
  minLegalidade?: number;
  minEstrategia?: number;
  minEtica?: number;
};

export type DocumentProgressState = {
  isNew: boolean;
  isOpened: boolean;
};

export type DocumentStateMap = Record<string, DocumentProgressState>;

export type InitialCaseState = {
  case_id: string;
  title: string;
  current_step: number;
  client_status: string;
  deadline_hours: number;
  legalidade: number;
  estrategia: number;
  etica: number;
  documents_unlocked: string[];
  document_state: DocumentStateMap;
  flags: CaseFlagMap;
};

export type CaseData = {
  case: {
    id: string;
    title: string;
    description: string;
    area: string;
    difficulty: string;
    estimated_duration_minutes: {
      min: number;
      max: number;
    };
    target_audience: string[];
    phase_builder?: {
      supported_inputs: Array<"blocks" | "json">;
      default_mode: "blocks" | "json";
      description: string;
    };
    lose_conditions?: {
      metric_floor: number;
      average_floor: number;
      ending_key: string;
    };
  };
  initial_state: InitialCaseState;
  metrics?: Record<
    MetricKey,
    {
      description: string;
    }
  >;
  score_bands: Array<{
    min: number;
    max: number;
    label: string;
  }>;
  characters?: Array<{
    id: string;
    name: string;
    role: string;
    goal?: string;
    age?: number;
    occupation?: string;
    situation?: string;
    background?: string;
    version?: string;
    narrative_function?: string;
    relevant_info?: string;
    observation?: string;
    legal_issue?: string;
    thesis?: string;
  }>;
  ending_rules?: Array<{
    key: string;
    label: string;
    conditions: BranchCondition[];
  }>;
  final_orders?: Record<string, FinalOrder>;
};

export type DocumentMessage = {
  author: string;
  role: "remetente" | "destinatario";
  timestamp: string;
  text: string;
};

export type DocumentSection = {
  heading: string;
  body: string;
};

export type CaseDocument = {
  id: string;
  title: string;
  type: string;
  template?: string;
  unlock_step: number;
  content: string;
  issuer?: {
    name: string;
    branch: string;
    location: string;
  };
  meta?: {
    reference: string;
    date: string;
    page: string;
  };
  sections?: DocumentSection[];
  messages?: DocumentMessage[];
};

export type DocumentSelectionConfig = {
  enabled: boolean;
  min: number;
  max: number;
  prompt: string;
  relevant_document_ids: string[];
  risky_document_ids: string[];
  missing_important_document_penalty: number;
};

export type StepOption = {
  key: string;
  label: string;
  text: string;
  next_step?: number;
  unlock_documents?: string[];
  set_flags?: string[];
  ending_key?: string;
};

export type Step = {
  id: string;
  case_id: string;
  step_number: number;
  title: string;
  situation: string;
  question: string;
  objective: string;
  unlock_documents: string[];
  options: StepOption[];
  best_choice?: string;
  pedagogical_note?: string;
  ai_prompt_override?: string;
  foundation_selection?: {
    enabled: boolean;
    min: number;
    max: number;
    prompt: string;
  };
  document_selection?: DocumentSelectionConfig;
  free_text?: {
    enabled: boolean;
    min_lines: number;
    max_lines: number;
  };
  criteria?: string[];
  result_bands?: Array<{
    label: string;
    description: string;
  }>;
  authoring?: {
    mode: "blocks" | "json";
    blocks?: Array<{
      id: string;
      type: string;
      content: string;
      meta?: Record<string, string | number | boolean | string[]>;
    }>;
    raw_json?: string;
  };
};

export type ScoringRule = {
  step: number;
  choice: string;
  legalidade: number;
  estrategia: number;
  etica: number;
  flags: string[];
  explanation: string;
  consequence: string;
};

export type Rubric = {
  rubric_id: string;
  max_score: number;
  criteria: Array<{
    id: string;
    description: string;
    points: number;
  }>;
};

export type Foundation = {
  id: string;
  label: string;
  description: string;
  weight: {
    legalidade: number;
    estrategia: number;
    etica: number;
  };
  valid_for_steps: number[];
  risk: "baixo" | "medio" | "alto";
};

export type ChoiceHistoryEntry = {
  stepNumber: number;
  stepTitle: string;
  choiceKey: string;
  choiceLabel: string;
  feedback: string;
  consequence?: string;
  scoreDelta: {
    legalidade: number;
    estrategia: number;
    etica: number;
  };
  selectedFoundations?: string[];
  selectedDocuments?: string[];
  documentEvidence?: {
    wellChosen: string[];
    ignored: string[];
    risky: string[];
  };
  freeText?: string;
  rubricScore?: number;
};

export type GameState = InitialCaseState & {
  choices_history: ChoiceHistoryEntry[];
  ending_key?: string;
  is_case_over?: boolean;
};

export type FeedbackState = {
  title: string;
  narrative: string;
  juridicalFeedback: string;
  mentorTitle?: string;
  mentorSummary?: string;
  mentorRules?: string[];
  consequence?: string;
  aiFeedback?: string;
  aiRewriteSuggestion?: string;
  aiScore?: number;
  aiStatus?: "pending" | "completed" | "failed" | "skipped";
  aiStatusDetail?: string;
  scoreDelta: {
    legalidade: number;
    estrategia: number;
    etica: number;
  };
  unlockedDocuments: string[];
  nextStep: number;
  selectedFoundations?: string[];
  selectedDocuments?: string[];
  documentEvidence?: {
    wellChosen: string[];
    ignored: string[];
    risky: string[];
  };
};

export type FinalReportData = {
  average: number;
  label: string;
  summary: string;
  performanceRating: {
    score: number;
    label: string;
    headline: string;
    summary: string;
    strengths: string[];
    improvements: string[];
    parameters: Array<{
      label: string;
      value: string;
    }>;
  };
  judgeOrder?: FinalOrder;
  endingKey?: string;
};

export type AudioSettings = {
  musicVolume: number;
  effectsVolume: number;
};

export type FinalOrder = {
  template: string;
  title: string;
  issuer: {
    name: string;
    branch: string;
    location: string;
  };
  meta: {
    reference: string;
    date: string;
    page: string;
  };
  sections: DocumentSection[];
};
