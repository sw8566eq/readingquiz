import { NextResponse } from "next/server";
import { GenerateQuizRequestSchema } from "@/lib/quiz-schema";
import { generateQuiz, QuizGenerationError } from "@/lib/generate-quiz";
import { cacheKey, getCachedQuiz, setCachedQuiz } from "@/lib/quiz-cache";

// No rate limiting on this route. Fine as long as this stays a local/private
// app with a single trusted user — not fine if this is ever hosted somewhere
// public, since every request costs real money against the Anthropic API key
// and there's currently nothing stopping it from being hit in a tight loop.
// Before any public deploy, add per-IP or per-session throttling here (e.g.
// a token bucket backed by Upstash/Redis, or middleware-level rate limiting).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = GenerateQuizRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please provide a book title and a chapter." },
      { status: 400 },
    );
  }

  // Off by default — this only matters for someone who deploys this
  // somewhere with real traffic and wants to cut down on repeat Anthropic
  // calls for the same book+chapter. Unset ENABLE_QUIZ_CACHE means every
  // request always generates fresh, same as before this existed. Never
  // applies to a pasted-chapter-text request — different pasted text for the
  // same book/chapter label would otherwise risk serving a mismatched quiz.
  const cacheEnabled = process.env.ENABLE_QUIZ_CACHE === "true" && !parsed.data.chapterText;
  const key = cacheKey(parsed.data.book, parsed.data.chapter);

  if (cacheEnabled && !parsed.data.regenerate) {
    const cached = getCachedQuiz(key);
    if (cached) return NextResponse.json(cached);
  }

  try {
    const quiz = await generateQuiz(parsed.data.book, parsed.data.chapter, parsed.data.chapterText);
    if (cacheEnabled) setCachedQuiz(key, quiz);
    return NextResponse.json(quiz);
  } catch (err) {
    if (err instanceof QuizGenerationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Unexpected error generating quiz:", err);
    return NextResponse.json(
      { error: "Something went wrong generating the quiz. Please try again." },
      { status: 500 },
    );
  }
}
