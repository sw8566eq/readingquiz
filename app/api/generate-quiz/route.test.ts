// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearQuizCache } from "../../../lib/quiz-cache";
import type { Quiz } from "../../../lib/quiz-schema";

vi.mock("../../../lib/generate-quiz", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../lib/generate-quiz")>();
  return { ...actual, generateQuiz: vi.fn() };
});

import { generateQuiz } from "../../../lib/generate-quiz";
import { POST } from "./route";

const generateQuizMock = generateQuiz as unknown as ReturnType<typeof vi.fn>;

function makeQuiz(book: string, chapter: string, question = "Q?"): Quiz {
  return {
    status: "ok",
    book,
    chapter,
    questions: [{ question, options: ["A", "B", "C", "D"], correctIndex: 0 }],
  };
}

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/generate-quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/generate-quiz caching", () => {
  const originalEnv = process.env.ENABLE_QUIZ_CACHE;

  beforeEach(() => {
    clearQuizCache();
    generateQuizMock.mockReset();
  });

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.ENABLE_QUIZ_CACHE;
    else process.env.ENABLE_QUIZ_CACHE = originalEnv;
  });

  it("calls generateQuiz on every request when caching is disabled (default)", async () => {
    delete process.env.ENABLE_QUIZ_CACHE;
    generateQuizMock.mockResolvedValue(makeQuiz("Dune", "Chapter 1"));

    await POST(postRequest({ book: "Dune", chapter: "Chapter 1" }));
    await POST(postRequest({ book: "Dune", chapter: "Chapter 1" }));

    expect(generateQuizMock).toHaveBeenCalledTimes(2);
  });

  it("serves a cached quiz on a repeat request when caching is enabled", async () => {
    process.env.ENABLE_QUIZ_CACHE = "true";
    generateQuizMock.mockResolvedValue(makeQuiz("Dune", "Chapter 1"));

    const first = await POST(postRequest({ book: "Dune", chapter: "Chapter 1" }));
    // different casing/whitespace — should still hit the same cache key
    const second = await POST(postRequest({ book: "dune", chapter: " Chapter 1 " }));

    expect(generateQuizMock).toHaveBeenCalledTimes(1);
    expect(await second.json()).toEqual(await first.json());
  });

  it("bypasses and refreshes the cache when regenerate is true", async () => {
    process.env.ENABLE_QUIZ_CACHE = "true";
    generateQuizMock
      .mockResolvedValueOnce(makeQuiz("Dune", "Chapter 1", "Original question?"))
      .mockResolvedValueOnce(makeQuiz("Dune", "Chapter 1", "Fresh question?"));

    await POST(postRequest({ book: "Dune", chapter: "Chapter 1" }));
    const regenerated = await POST(
      postRequest({ book: "Dune", chapter: "Chapter 1", regenerate: true }),
    );

    expect(generateQuizMock).toHaveBeenCalledTimes(2);
    expect((await regenerated.json()).questions[0].question).toBe("Fresh question?");

    // the cache should now reflect the regenerated result, not the original
    const third = await POST(postRequest({ book: "Dune", chapter: "Chapter 1" }));
    expect(generateQuizMock).toHaveBeenCalledTimes(2); // still 2 — served from the refreshed cache
    expect((await third.json()).questions[0].question).toBe("Fresh question?");
  });
});
