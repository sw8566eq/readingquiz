import { NextResponse } from "next/server";
import { GenerateQuizRequestSchema } from "@/lib/quiz-schema";
import { generateQuiz, QuizGenerationError } from "@/lib/generate-quiz";

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

  try {
    const quiz = await generateQuiz(parsed.data.book, parsed.data.chapter);
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
