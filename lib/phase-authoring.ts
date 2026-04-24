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
