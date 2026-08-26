"use client";

import { useState } from "react";
import QuizForm from "@/components/QuizForm";
import Quiz from "@/components/Quiz";
import type { Quiz as QuizType } from "@/lib/quiz-schema";

type Status = "idle" | "loading" | "error" | "ready";

export default function Page() {
  const [status, setStatus] = useState<Status>("idle");
  const [quiz, setQuiz] = useState<QuizType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(book: string, chapter: string) {
    setStatus("loading");
    setErrorMessage(null);

    let res: Response;
    try {
      res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book, chapter }),
      });
    } catch {
      setErrorMessage("Network error — couldn't reach the server. Please try again.");
      setStatus("error");
      return;
    }

    // A separate try/catch: the request itself succeeded, but the body
    // might not be valid JSON (e.g. an upstream timeout page) — that's a
    // different failure than "network error" and shouldn't be reported as one.
    try {
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }
      setQuiz(data as QuizType);
      setStatus("ready");
    } catch {
      setErrorMessage("Got an unexpected response from the server. Please try again.");
      setStatus("error");
    }
  }

  function handleReset() {
    setQuiz(null);
    setStatus("idle");
    setErrorMessage(null);
  }

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-12">
      <h1 className="mb-1 text-2xl font-semibold">ReadingQuiz</h1>
      <p className="mb-8 text-sm text-black/60 dark:text-white/60">
        Pick a book and chapter — an AI researches a summary and quizzes you on it.
      </p>

      {status !== "ready" && (
        <>
          <QuizForm onSubmit={handleSubmit} loading={status === "loading"} />
          {status === "loading" && (
            <p className="mt-4 text-sm text-black/60 dark:text-white/60">
              Searching the web and writing your quiz… this can take 15–45 seconds.
            </p>
          )}
          {status === "error" && errorMessage && (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
          )}
        </>
      )}

      {status === "ready" && quiz && <Quiz quiz={quiz} onReset={handleReset} />}
    </main>
  );
}
