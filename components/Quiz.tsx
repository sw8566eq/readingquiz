"use client";

import { useState } from "react";
import type { Quiz as QuizType } from "@/lib/quiz-schema";

type QuizProps = {
  quiz: QuizType;
  onReset: () => void;
};

export default function Quiz({ quiz, onReset }: QuizProps) {
  const [answers, setAnswers] = useState<(number | null)[]>(
    () => quiz.questions.map(() => null),
  );
  const [submitted, setSubmitted] = useState(false);

  const score = quiz.questions.reduce(
    (total, q, i) => total + (answers[i] === q.correctIndex ? 1 : 0),
    0,
  );

  function selectAnswer(questionIndex: number, optionIndex: number) {
    if (submitted) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = optionIndex;
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-semibold">
          {quiz.book} — {quiz.chapter}
        </h2>
        {submitted && (
          <p className="mt-1 text-sm">
            Score: <span className="font-medium">{score} / {quiz.questions.length}</span>
          </p>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {quiz.questions.map((q, qi) => {
          const selected = answers[qi];
          const isCorrect = selected === q.correctIndex;
          return (
            <fieldset key={qi} className="flex flex-col gap-2">
              <legend className="font-medium mb-1">
                {qi + 1}. {q.question}
              </legend>
              <div className="flex flex-col gap-2">
                {q.options.map((option, oi) => {
                  const isSelected = selected === oi;
                  const isCorrectOption = oi === q.correctIndex;

                  let stateClasses =
                    "border-black/15 dark:border-white/20 hover:border-black/40 dark:hover:border-white/40";
                  if (submitted) {
                    if (isCorrectOption) {
                      stateClasses =
                        "border-green-600 bg-green-600/10 text-green-800 dark:text-green-400";
                    } else if (isSelected && !isCorrect) {
                      stateClasses =
                        "border-red-600 bg-red-600/10 text-red-800 dark:text-red-400";
                    } else {
                      stateClasses = "border-black/10 dark:border-white/10 opacity-70";
                    }
                  } else if (isSelected) {
                    stateClasses = "border-foreground";
                  }

                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={submitted}
                      onClick={() => selectAnswer(qi, oi)}
                      className={`text-left rounded-md border px-3 py-2 transition-colors disabled:cursor-default ${stateClasses}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>

      <div className="flex gap-3">
        {!submitted ? (
          <button
            type="button"
            onClick={() => setSubmitted(true)}
            className="rounded-md bg-foreground text-background px-4 py-2 font-medium"
          >
            Submit quiz
          </button>
        ) : (
          <button
            type="button"
            onClick={onReset}
            className="rounded-md border border-black/15 dark:border-white/20 px-4 py-2 font-medium"
          >
            Try another chapter
          </button>
        )}
      </div>
    </div>
  );
}
