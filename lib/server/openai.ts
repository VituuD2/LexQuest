import "server-only";

const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-4.1-mini";

export type AiChoiceReviewResult = {
  feedback: string;
  narrative: string;
  rewriteSuggestion?: string;
  score?: number;
  raw?: unknown;
};

export type AiDraftReviewResult = {
  summary: string;
  strengths: string[];
  risks: string[];
  suggestions: string[];
};

function getOpenAiKey() {
  return process.env.OPENAI_API_KEY;
}

export function isAiEnabled() {
  return Boolean(getOpenAiKey());
}

async function callResponsesApi<T>(params: {
  system: string;
  user: string;
  jsonSchemaName: string;
  schema: Record<string, unknown>;
}): Promise<T> {
  const apiKey = getOpenAiKey();

  if (!apiKey) {
    throw new Error("Missing required environment variable: OPENAI_API_KEY");
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: params.system }]
        },
        {
          role: "user",
          content: [{ type: "input_text", text: params.user }]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: params.jsonSchemaName,
          schema: params.schema,
          strict: true
        }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const payload = (await response.json()) as {
    output_text?: string;
  };

  if (!payload.output_text) {
    throw new Error("OpenAI request returned no output_text");
  }

  return JSON.parse(payload.output_text) as T;
}

export async function reviewStepChoice(input: {
  prompt: string;
  context: unknown;
}): Promise<AiChoiceReviewResult> {
  const result = await callResponsesApi<AiChoiceReviewResult>({
    system:
      "Voce e tutor juridico do LexQuest. Analise a escolha do doutor sem inventar lei, sumula ou jurisprudencia. Seja tecnico, claro e pedagogico. Responda apenas em JSON valido.",
    user: `${input.prompt}\n\nContexto estruturado:\n${JSON.stringify(input.context, null, 2)}`,
    jsonSchemaName: "lexquest_step_feedback",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        feedback: { type: "string" },
        narrative: { type: "string" },
        rewriteSuggestion: { type: ["string", "null"] },
        score: { type: ["number", "null"] },
        raw: { type: ["object", "null"], additionalProperties: true }
      },
      required: ["feedback", "narrative", "rewriteSuggestion", "score", "raw"]
    }
  });

  return result;
}

export async function reviewStepDraft(input: {
  prompt: string;
  step: unknown;
}): Promise<AiDraftReviewResult> {
  return callResponsesApi<AiDraftReviewResult>({
    system:
      "Voce e consultor de design instrucional juridico do LexQuest. Revise uma etapa de simulacao decisoria, sem inventar leis, sumulas ou jurisprudencia. Foque em realismo, dificuldade, coerencia entre contexto e pergunta, qualidade das alternativas e valor pedagogico. Responda apenas em JSON valido.",
    user: `${input.prompt}\n\nEtapa estruturada:\n${JSON.stringify(input.step, null, 2)}`,
    jsonSchemaName: "lexquest_step_authoring_review",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        summary: { type: "string" },
        strengths: {
          type: "array",
          items: { type: "string" }
        },
        risks: {
          type: "array",
          items: { type: "string" }
        },
        suggestions: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: ["summary", "strengths", "risks", "suggestions"]
    }
  });
}
