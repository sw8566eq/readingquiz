import { NextResponse } from "next/server";
import { GenerateQuizRequestSchema } from "@/lib/quiz-schema";
import { generateQuiz, QuizGenerationError } from "@/lib/generate-quiz";

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
