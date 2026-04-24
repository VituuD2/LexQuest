import type { Step } from "@/lib/game-types";

export type PhaseBuilderBlock = {
  id: string;
  type:
    | "title"
    | "situation"
    | "question"
    | "objective"
    | "option"
    | "foundation_prompt"
    | "result_band"
    | "note";
  content: string;
  meta?: Record<string, string | number | boolean>;
};

export type PhaseAuthoringInput =
  | {
      mode: "blocks";
      blocks: PhaseBuilderBlock[];
    }
  | {
      mode: "json";
      raw: string;
    };

export type PhaseValidationResult = {
  isValid: boolean;
  issues: string[];
};

export function normalizePhaseAuthoringInput(input: PhaseAuthoringInput): PhaseBuilderBlock[] {
  if (input.mode === "blocks") {
    return input.blocks;
  }

  try {
    const parsed = JSON.parse(input.raw) as { authoring?: { blocks?: PhaseBuilderBlock[] } };
    return parsed.authoring?.blocks ?? [];
  } catch {
    return [];
  }
}

export function buildPhaseAuthoringSnapshot(step: Step): PhaseBuilderBlock[] {
  const blocks: PhaseBuilderBlock[] = [
    { id: `${step.id}_title`, type: "title", content: step.title },
    { id: `${step.id}_situation`, type: "situation", content: step.situation },
    { id: `${step.id}_question`, type: "question", content: step.question },
    { id: `${step.id}_objective`, type: "objective", content: step.objective }
  ];

  for (const option of step.options) {
    blocks.push({
      id: `${step.id}_option_${option.key}`,
      type: "option",
      content: option.text,
      meta: {
        key: option.key,
        label: option.label
      }
    });
  }

  if (step.foundation_selection?.prompt) {
    blocks.push({
      id: `${step.id}_foundation_prompt`,
      type: "foundation_prompt",
      content: step.foundation_selection.prompt
    });
  }

  if (step.pedagogical_note) {
    blocks.push({
      id: `${step.id}_note`,
      type: "note",
      content: step.pedagogical_note
    });
  }

  return blocks;
}

export function blocksToStepDraft(step: Step, blocks: PhaseBuilderBlock[]): Step {
  const nextStep: Step = {
    ...step,
    options: []
  };

  const options = blocks
    .filter((block) => block.type === "option")
    .map((block, index) => ({
      key: String(block.meta?.key ?? String.fromCharCode(65 + index)),
      label: String(block.meta?.label ?? `Opcao ${index + 1}`),
      text: block.content
    }));

  for (const block of blocks) {
    switch (block.type) {
      case "title":
        nextStep.title = block.content;
        break;
      case "situation":
        nextStep.situation = block.content;
        break;
      case "question":
        nextStep.question = block.content;
        break;
      case "objective":
        nextStep.objective = block.content;
        break;
      case "foundation_prompt":
        nextStep.foundation_selection = nextStep.foundation_selection
          ? { ...nextStep.foundation_selection, prompt: block.content }
          : {
              enabled: true,
              min: 2,
              max: 4,
              prompt: block.content
            };
        break;
      case "note":
        nextStep.pedagogical_note = block.content;
        break;
      default:
        break;
    }
  }

  nextStep.options = options;
  return nextStep;
}

export function parseJsonStepDraft(raw: string, fallbackStep: Step): Step {
  try {
    const parsed = JSON.parse(raw) as Partial<Step>;
    return {
      ...fallbackStep,
      ...parsed,
      options: parsed.options ?? fallbackStep.options
    };
  } catch {
    return fallbackStep;
  }
}

export function validateStepDraft(step: Step): PhaseValidationResult {
  const issues: string[] = [];

  if (!step.title.trim()) {
    issues.push("A etapa precisa de um titulo.");
  }

  if (!step.situation.trim()) {
    issues.push("A etapa precisa de um contexto narrativo.");
  }

  if (!step.question.trim()) {
    issues.push("A etapa precisa de uma pergunta decisoria.");
  }

  if (!step.objective.trim()) {
    issues.push("A etapa precisa de um objetivo pedagogico.");
  }

  if (!step.free_text?.enabled && step.step_number !== 6 && step.options.length === 0) {
    issues.push("Etapas decisorias precisam ter ao menos uma alternativa.");
  }

  const duplicatedOptionKeys = new Set<string>();
  const seenOptionKeys = new Set<string>();

  for (const option of step.options) {
    if (!option.label.trim()) {
      issues.push(`A alternativa ${option.key || "sem chave"} precisa de label.`);
    }

    if (!option.text.trim()) {
      issues.push(`A alternativa ${option.key || "sem chave"} precisa de texto.`);
    }

    if (seenOptionKeys.has(option.key)) {
      duplicatedOptionKeys.add(option.key);
    }

    seenOptionKeys.add(option.key);
  }

  if (duplicatedOptionKeys.size > 0) {
    issues.push(`Existem chaves de alternativa repetidas: ${Array.from(duplicatedOptionKeys).join(", ")}.`);
  }

  if (step.foundation_selection?.enabled && step.foundation_selection.min > step.foundation_selection.max) {
    issues.push("A selecao de fundamentos esta com minimo maior que maximo.");
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}
