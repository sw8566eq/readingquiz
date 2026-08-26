import { describe, expect, it } from "vitest";
import {
  GenerateQuizRequestSchema,
  MAX_CHAPTER_TEXT_LENGTH,
  MAX_FIELD_LENGTH,
  MAX_OPTION_LENGTH,
  MAX_QUESTION_LENGTH,
  MAX_REASON_LENGTH,
  QUESTION_COUNT,
  QuizQuestionSchema,
  QuizResultSchema,
} from "./quiz-schema";

function validQuestion(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    question: "What happened first?",
    options: ["A", "B", "C", "D"],
    correctIndex: 0,
    ...overrides,
  };
}

function validQuiz(questionCount = QUESTION_COUNT) {
  return {
    status: "ok" as const,
    book: "Some Book",
    chapter: "Chapter 1",
    questions: Array.from({ length: questionCount }, () => validQuestion()),
  };
}

describe("QuizQuestionSchema", () => {
  it("accepts a well-formed question", () => {
    expect(QuizQuestionSchema.safeParse(validQuestion()).success).toBe(true);
  });

  it("rejects an empty question string", () => {
    expect(QuizQuestionSchema.safeParse(validQuestion({ question: "" })).success).toBe(false);
  });

  it("rejects a question longer than MAX_QUESTION_LENGTH", () => {
    const tooLong = "a".repeat(MAX_QUESTION_LENGTH + 1);
    expect(QuizQuestionSchema.safeParse(validQuestion({ question: tooLong })).success).toBe(false);
  });

  it("accepts a question at exactly MAX_QUESTION_LENGTH", () => {
    const atLimit = "a".repeat(MAX_QUESTION_LENGTH);
    expect(QuizQuestionSchema.safeParse(validQuestion({ question: atLimit })).success).toBe(true);
  });

  it("rejects an option longer than MAX_OPTION_LENGTH", () => {
    const tooLong = "a".repeat(MAX_OPTION_LENGTH + 1);
    const q = validQuestion({ options: ["A", "B", "C", tooLong] });
    expect(QuizQuestionSchema.safeParse(q).success).toBe(false);
  });

  it("rejects fewer than 4 options", () => {
    expect(QuizQuestionSchema.safeParse(validQuestion({ options: ["A", "B", "C"] })).success).toBe(false);
  });

  it("rejects more than 4 options", () => {
    expect(QuizQuestionSchema.safeParse(validQuestion({ options: ["A", "B", "C", "D", "E"] })).success).toBe(false);
  });

  it.each([-1, 4, 4.5])("rejects correctIndex out of range (%s)", (bad) => {
    expect(QuizQuestionSchema.safeParse(validQuestion({ correctIndex: bad })).success).toBe(false);
  });

  it.each([0, 1, 2, 3])("accepts correctIndex in range (%s)", (ok) => {
    expect(QuizQuestionSchema.safeParse(validQuestion({ correctIndex: ok })).success).toBe(true);
  });
});

describe("QuizResultSchema", () => {
  it("accepts a well-formed 'ok' result", () => {
    expect(QuizResultSchema.safeParse(validQuiz()).success).toBe(true);
  });

  it("rejects an 'ok' result with too few questions", () => {
    expect(QuizResultSchema.safeParse(validQuiz(QUESTION_COUNT - 1)).success).toBe(false);
  });

  it("rejects an 'ok' result with too many questions", () => {
    expect(QuizResultSchema.safeParse(validQuiz(QUESTION_COUNT + 1)).success).toBe(false);
  });

  it("rejects book/chapter longer than MAX_FIELD_LENGTH", () => {
    const tooLong = "a".repeat(MAX_FIELD_LENGTH + 1);
    expect(QuizResultSchema.safeParse({ ...validQuiz(), book: tooLong }).success).toBe(false);
  });

  it("accepts a well-formed 'error' result", () => {
    expect(QuizResultSchema.safeParse({ status: "error", reason: "Couldn't find it." }).success).toBe(true);
  });

  it("rejects a reason longer than MAX_REASON_LENGTH", () => {
    const tooLong = "a".repeat(MAX_REASON_LENGTH + 1);
    expect(QuizResultSchema.safeParse({ status: "error", reason: tooLong }).success).toBe(false);
  });

  it("rejects an unrecognized status", () => {
    expect(QuizResultSchema.safeParse({ status: "pending", reason: "x" }).success).toBe(false);
  });

  it("rejects an 'error' status missing its required 'reason' (unknown keys don't rescue it)", () => {
    const { book, chapter, questions } = validQuiz();
    expect(QuizResultSchema.safeParse({ status: "error", book, chapter, questions }).success).toBe(false);
  });
});

describe("GenerateQuizRequestSchema", () => {
  it("accepts and trims valid book/chapter, defaulting regenerate to false", () => {
    const result = GenerateQuizRequestSchema.safeParse({ book: "  Dune  ", chapter: " Ch 1 " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ book: "Dune", chapter: "Ch 1", regenerate: false });
    }
  });

  it("accepts an explicit regenerate: true", () => {
    const result = GenerateQuizRequestSchema.safeParse({ book: "Dune", chapter: "Ch 1", regenerate: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.regenerate).toBe(true);
    }
  });

  it("rejects a non-boolean regenerate", () => {
    const result = GenerateQuizRequestSchema.safeParse({ book: "Dune", chapter: "Ch 1", regenerate: "true" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty book after trimming", () => {
    expect(GenerateQuizRequestSchema.safeParse({ book: "   ", chapter: "Ch 1" }).success).toBe(false);
  });

  it("rejects a book longer than MAX_FIELD_LENGTH", () => {
    const tooLong = "a".repeat(MAX_FIELD_LENGTH + 1);
    expect(GenerateQuizRequestSchema.safeParse({ book: tooLong, chapter: "Ch 1" }).success).toBe(false);
  });

  it("rejects a missing chapter", () => {
    expect(GenerateQuizRequestSchema.safeParse({ book: "Dune" }).success).toBe(false);
  });

  it("accepts a request with no chapterText at all", () => {
    const result = GenerateQuizRequestSchema.safeParse({ book: "Dune", chapter: "Ch 1" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.chapterText).toBeUndefined();
    }
  });

  it("accepts and trims pasted chapterText", () => {
    const result = GenerateQuizRequestSchema.safeParse({
      book: "Dune",
      chapter: "Ch 1",
      chapterText: "  It was a hot day on Arrakis.  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.chapterText).toBe("It was a hot day on Arrakis.");
    }
  });

  it("rejects chapterText longer than MAX_CHAPTER_TEXT_LENGTH", () => {
    const tooLong = "a".repeat(MAX_CHAPTER_TEXT_LENGTH + 1);
    const result = GenerateQuizRequestSchema.safeParse({ book: "Dune", chapter: "Ch 1", chapterText: tooLong });
    expect(result.success).toBe(false);
  });

  it("accepts chapterText at exactly MAX_CHAPTER_TEXT_LENGTH", () => {
    const atLimit = "a".repeat(MAX_CHAPTER_TEXT_LENGTH);
    const result = GenerateQuizRequestSchema.safeParse({ book: "Dune", chapter: "Ch 1", chapterText: atLimit });
    expect(result.success).toBe(true);
  });
});
