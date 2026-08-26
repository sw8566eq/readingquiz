import { z } from "zod";

/** Number of questions generated per quiz. Safe to tune. */
export const QUESTION_COUNT = 5;

/** Max length for the book/chapter inputs. Shared with the client form so its maxLength/UI validation stays in sync with this schema. */
export const MAX_FIELD_LENGTH = 200;

// Hard ceilings on model-generated quiz content. These are a backstop, not
// just a style nudge: they're independent of prompt compliance, and they're
// also fed into the request's output_config.format (see lib/generate-quiz.ts)
// so the API is asked to constrain generation to this same schema.
const MAX_QUESTION_LENGTH = 300;
const MAX_OPTION_LENGTH = 150;
const MAX_REASON_LENGTH = 500;

export const QuizQuestionSchema = z.object({
  question: z.string().min(1).max(MAX_QUESTION_LENGTH),
  options: z.array(z.string().min(1).max(MAX_OPTION_LENGTH)).length(4),
  correctIndex: z.number().int().min(0).max(3),
});

/**
 * The model's final JSON block is either a successful quiz or an explicit
 * "couldn't find a summary" signal. A discriminated union lets us branch on
 * `status` instead of sniffing English text for failure phrases.
 */
export const QuizResultSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("ok"),
    book: z.string().min(1).max(MAX_FIELD_LENGTH),
    chapter: z.string().min(1).max(MAX_FIELD_LENGTH),
    questions: z.array(QuizQuestionSchema).length(QUESTION_COUNT),
  }),
  z.object({
    status: z.literal("error"),
    reason: z.string().min(1).max(MAX_REASON_LENGTH),
  }),
]);

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type QuizResult = z.infer<typeof QuizResultSchema>;
export type Quiz = Extract<QuizResult, { status: "ok" }>;

export const GenerateQuizRequestSchema = z.object({
  book: z.string().trim().min(1).max(MAX_FIELD_LENGTH),
  chapter: z.string().trim().min(1).max(MAX_FIELD_LENGTH),
});
export type GenerateQuizRequest = z.infer<typeof GenerateQuizRequestSchema>;
