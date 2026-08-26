import { beforeEach, describe, expect, it } from "vitest";
import { MAX_ENTRIES, cacheKey, clearQuizCache, getCachedQuiz, setCachedQuiz } from "./quiz-cache";
import type { Quiz } from "./quiz-schema";

function makeQuiz(book: string, chapter: string): Quiz {
  return {
    status: "ok",
    book,
    chapter,
    questions: [{ question: "Q?", options: ["A", "B", "C", "D"], correctIndex: 0 }],
  };
}

describe("cacheKey", () => {
  it("is case-insensitive and trims whitespace", () => {
    expect(cacheKey(" Dune ", " Chapter 1 ")).toBe(cacheKey("dune", "chapter 1"));
  });

  it("distinguishes different book/chapter pairs", () => {
    expect(cacheKey("Dune", "Chapter 1")).not.toBe(cacheKey("Dune", "Chapter 2"));
  });
});

describe("quiz cache get/set", () => {
  beforeEach(() => {
    clearQuizCache();
  });

  it("returns undefined for a key that was never set", () => {
    expect(getCachedQuiz(cacheKey("Dune", "Chapter 1"))).toBeUndefined();
  });

  it("returns what was set for that key", () => {
    const key = cacheKey("Dune", "Chapter 1");
    const quiz = makeQuiz("Dune", "Chapter 1");
    setCachedQuiz(key, quiz);
    expect(getCachedQuiz(key)).toBe(quiz);
  });

  it("overwrites an existing entry for the same key", () => {
    const key = cacheKey("Dune", "Chapter 1");
    setCachedQuiz(key, makeQuiz("Dune", "Chapter 1"));
    const updated = makeQuiz("Dune", "Chapter 1 (updated)");
    setCachedQuiz(key, updated);
    expect(getCachedQuiz(key)).toBe(updated);
  });

  it("evicts the oldest entry once the cache is at capacity", () => {
    for (let i = 0; i < MAX_ENTRIES; i++) {
      setCachedQuiz(cacheKey(`Book ${i}`, "Chapter 1"), makeQuiz(`Book ${i}`, "Chapter 1"));
    }
    expect(getCachedQuiz(cacheKey("Book 0", "Chapter 1"))).toBeDefined();

    setCachedQuiz(cacheKey("Book new", "Chapter 1"), makeQuiz("Book new", "Chapter 1"));

    expect(getCachedQuiz(cacheKey("Book 0", "Chapter 1"))).toBeUndefined();
    expect(getCachedQuiz(cacheKey("Book new", "Chapter 1"))).toBeDefined();
  });
});
