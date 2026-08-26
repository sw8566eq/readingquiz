import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Quiz as QuizType } from "../lib/quiz-schema";
import Quiz from "./Quiz";

const sampleQuiz: QuizType = {
  status: "ok",
  book: "Dune",
  chapter: "Chapter 1",
  questions: [
    { question: "Who is the protagonist?", options: ["Paul", "Duncan", "Gurney", "Leto"], correctIndex: 0 },
    { question: "What planet is Arrakis?", options: ["Caladan", "Giedi Prime", "Arrakis", "Kaitain"], correctIndex: 2 },
  ],
};

function renderQuiz(overrides: { onReset?: () => void; onRegenerate?: () => void } = {}) {
  const onReset = overrides.onReset ?? vi.fn();
  const onRegenerate = overrides.onRegenerate ?? vi.fn();
  render(<Quiz quiz={sampleQuiz} onReset={onReset} onRegenerate={onRegenerate} />);
  return { onReset, onRegenerate };
}

describe("Quiz", () => {
  it("shows the first question with a progress header", () => {
    renderQuiz();

    expect(screen.getByText("Dune — Chapter 1")).toBeInTheDocument();
    expect(screen.getByText(/Question 1 of 2/)).toBeInTheDocument();
    expect(screen.getByText(/Score so far: 0/)).toBeInTheDocument();
    expect(screen.getByText("Who is the protagonist?")).toBeInTheDocument();
  });

  it("reveals correct/incorrect immediately on selecting an answer, and locks it in", () => {
    renderQuiz();

    fireEvent.click(screen.getByRole("button", { name: "Paul" }));

    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Paul" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Duncan" })).toBeDisabled();
    expect(screen.getByText(/Score so far: 1/)).toBeInTheDocument();
  });

  it("shows 'Not quite.' and highlights the correct option when the wrong one is picked", () => {
    renderQuiz();

    fireEvent.click(screen.getByRole("button", { name: "Duncan" }));

    expect(screen.getByText("Not quite.")).toBeInTheDocument();
    expect(screen.getByText(/Score so far: 0/)).toBeInTheDocument();
  });

  it("does not change the answer after it's locked in", () => {
    renderQuiz();

    fireEvent.click(screen.getByRole("button", { name: "Duncan" }));
    fireEvent.click(screen.getByRole("button", { name: "Paul" })); // should be a no-op, already locked

    expect(screen.getByText("Not quite.")).toBeInTheDocument();
    expect(screen.getByText(/Score so far: 0/)).toBeInTheDocument();
  });

  it("advances to the next question and resets selection state", () => {
    renderQuiz();

    fireEvent.click(screen.getByRole("button", { name: "Paul" }));
    fireEvent.click(screen.getByRole("button", { name: "Next question" }));

    expect(screen.getByText(/Question 2 of 2/)).toBeInTheDocument();
    expect(screen.getByText("What planet is Arrakis?")).toBeInTheDocument();
    expect(screen.queryByText("Correct!")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Caladan" })).not.toBeDisabled();
  });

  it("shows 'See results' instead of 'Next question' on the last question", () => {
    renderQuiz();

    fireEvent.click(screen.getByRole("button", { name: "Paul" }));
    fireEvent.click(screen.getByRole("button", { name: "Next question" }));
    fireEvent.click(screen.getByRole("button", { name: "Arrakis" }));

    expect(screen.getByRole("button", { name: "See results" })).toBeInTheDocument();
  });

  it("shows the final score and lets you reset or get new questions", () => {
    const { onReset, onRegenerate } = renderQuiz();

    fireEvent.click(screen.getByRole("button", { name: "Paul" })); // correct
    fireEvent.click(screen.getByRole("button", { name: "Next question" }));
    fireEvent.click(screen.getByRole("button", { name: "Giedi Prime" })); // wrong
    fireEvent.click(screen.getByRole("button", { name: "See results" }));

    expect(screen.getByText(/Final score:/)).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "New questions on this chapter" }));
    expect(onRegenerate).toHaveBeenCalledTimes(1);
    expect(onReset).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Try another chapter" }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
