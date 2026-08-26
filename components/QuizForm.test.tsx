import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import QuizForm from "./QuizForm";

function fillBookAndChapter() {
  fireEvent.change(screen.getByLabelText("Book title"), { target: { value: "Dune" } });
  fireEvent.change(screen.getByLabelText("Chapter"), { target: { value: "Chapter 1" } });
}

describe("QuizForm", () => {
  it("keeps the submit button disabled until both fields are filled", () => {
    render(<QuizForm onSubmit={vi.fn()} loading={false} />);

    expect(screen.getByRole("button", { name: "Generate quiz" })).toBeDisabled();
    fillBookAndChapter();
    expect(screen.getByRole("button", { name: "Generate quiz" })).not.toBeDisabled();
  });

  it("submits book/chapter with no chapterText by default", () => {
    const onSubmit = vi.fn();
    render(<QuizForm onSubmit={onSubmit} loading={false} />);

    fillBookAndChapter();
    fireEvent.click(screen.getByRole("button", { name: "Generate quiz" }));

    expect(onSubmit).toHaveBeenCalledWith("Dune", "Chapter 1", undefined);
  });

  it("hides the paste-text textarea until toggled", () => {
    render(<QuizForm onSubmit={vi.fn()} loading={false} />);

    expect(screen.queryByLabelText(/Chapter text/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Can't find it? Paste the chapter text instead" }));
    expect(screen.getByLabelText(/Chapter text/)).toBeInTheDocument();
  });

  it("submits the trimmed pasted chapter text when provided", () => {
    const onSubmit = vi.fn();
    render(<QuizForm onSubmit={onSubmit} loading={false} />);

    fillBookAndChapter();
    fireEvent.click(screen.getByRole("button", { name: "Can't find it? Paste the chapter text instead" }));
    fireEvent.change(screen.getByLabelText(/Chapter text/), {
      target: { value: "  It was a hot day on Arrakis.  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate quiz" }));

    expect(onSubmit).toHaveBeenCalledWith("Dune", "Chapter 1", "It was a hot day on Arrakis.");
  });

  it("ignores a submit event while already loading (defense in depth)", () => {
    // Inputs/button are disabled while loading, which normally prevents this
    // — this exercises the handler's own loading guard directly, in case a
    // submit event ever reaches it some other way (e.g. Enter mid-request).
    const onSubmit = vi.fn();
    const { container, rerender } = render(<QuizForm onSubmit={onSubmit} loading={false} />);
    fillBookAndChapter();
    rerender(<QuizForm onSubmit={onSubmit} loading={true} />);

    fireEvent.submit(container.querySelector("form")!);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("disables inputs while loading", () => {
    render(<QuizForm onSubmit={vi.fn()} loading={true} />);

    expect(screen.getByLabelText("Book title")).toBeDisabled();
    expect(screen.getByLabelText("Chapter")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Generating quiz…" })).toBeDisabled();
  });
});
