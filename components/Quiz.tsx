"use client";

import { useState } from "react";
import type { Quiz as QuizType } from "@/lib/quiz-schema";

type QuizProps = {
  quiz: QuizType;
  onReset: () => void;
};

export default function Quiz({ quiz, onReset }: QuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    () => quiz.questions.map(() => null),
  );

  const score = quiz.questions.reduce(
    (total, q, i) => total + (answers[i] === q.correctIndex ? 1 : 0),
    0,
  );
  const finished = currentIndex >= quiz.questions.length;

  function selectAnswer(optionIndex: number) {
    if (answers[currentIndex] !== null) return; // locked in once answered — immediate feedback, no changing your mind
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = optionIndex;
      return next;
    });
  }

  function goNext() {
    setCurrentIndex((i) => i + 1);
  }

  if (finished) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold">
            {quiz.book} — {quiz.chapter}
          </h2>
          <p className="mt-1 text-sm">
            Final score: <span className="font-medium">{score} / {quiz.questions.length}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="self-start rounded-md border border-black/15 dark:border-white/20 px-4 py-2 font-medium"
        >
          Try another chapter
        </button>
      </div>
    );
  }

  const question = quiz.questions[currentIndex];
  const selected = answers[currentIndex];
  const answered = selected !== null;
  const isCorrect = selected === question.correctIndex;
  const isLastQuestion = currentIndex === quiz.questions.length - 1;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-semibold">
          {quiz.book} — {quiz.chapter}
        </h2>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Question {currentIndex + 1} of {quiz.questions.length} · Score so far: {score}
        </p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="font-medium mb-1">{question.question}</legend>
        <div className="flex flex-col gap-2">
          {question.options.map((option, oi) => {
            const isSelected = selected === oi;
            const isCorrectOption = oi === question.correctIndex;

            let stateClasses =
              "border-black/15 dark:border-white/20 hover:border-black/40 dark:hover:border-white/40";
            if (answered) {
              if (isCorrectOption) {
                stateClasses =
                  "border-green-600 bg-green-600/10 text-green-800 dark:text-green-400";
              } else if (isSelected) {
                stateClasses =
                  "border-red-600 bg-red-600/10 text-red-800 dark:text-red-400";
              } else {
                stateClasses = "border-black/10 dark:border-white/10 opacity-70";
              }
            }

            return (
              <button
                key={oi}
                type="button"
                disabled={answered}
                onClick={() => selectAnswer(oi)}
                className={`text-left rounded-md border px-3 py-2 transition-colors disabled:cursor-default ${stateClasses}`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </fieldset>

      {answered && (
        <div className="flex items-center justify-between gap-4">
          <p
            className={`text-sm font-medium ${
              isCorrect
                ? "text-green-700 dark:text-green-400"
                : "text-red-700 dark:text-red-400"
            }`}
          >
            {isCorrect ? "Correct!" : "Not quite."}
          </p>
          <button
            type="button"
            onClick={goNext}
            className="rounded-md bg-foreground text-background px-4 py-2 font-medium"
          >
            {isLastQuestion ? "See results" : "Next question"}
          </button>
        </div>
      )}
    </div>
  );
}
