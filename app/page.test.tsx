import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Quiz as QuizType } from "@/lib/quiz-schema";
import Page from "./page";

function sampleQuiz(book = "Dune", chapter = "Chapter 1"): QuizType {
  return {
    status: "ok",
    book,
    chapter,
    questions: [{ question: "Who is the protagonist?", options: ["Paul", "B", "C", "D"], correctIndex: 0 }],
  };
}

function jsonResponse(ok: boolean, body: unknown) {
  return { ok, json: async () => body };
}

function fillAndSubmit(book = "Dune", chapter = "Chapter 1") {
  fireEvent.change(screen.getByLabelText("Book title"), { target: { value: book } });
  fireEvent.change(screen.getByLabelText("Chapter"), { target: { value: chapter } });
  fireEvent.click(screen.getByRole("button", { name: "Generate quiz" }));
}

describe("Page", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the web-search loading message, then the quiz, on a successful submission", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(true, sampleQuiz()));

    render(<Page />);
    fillAndSubmit();

    expect(screen.getByText(/Searching the web/)).toBeInTheDocument();
    await screen.findByText("Who is the protagonist?");

    expect(fetch).toHaveBeenCalledWith(
      "/api/generate-quiz",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ book: "Dune", chapter: "Chapter 1", chapterText: undefined, regenerate: false }),
      }),
    );
  });

  it("shows the pasted-text loading message when chapter text was submitted", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(true, sampleQuiz()));

    render(<Page />);
    fireEvent.change(screen.getByLabelText("Book title"), { target: { value: "Dune" } });
    fireEvent.change(screen.getByLabelText("Chapter"), { target: { value: "Chapter 1" } });
    fireEvent.click(screen.getByRole("button", { name: "Can't find it? Paste the chapter text instead" }));
    fireEvent.change(screen.getByLabelText(/Chapter text/), { target: { value: "Some pasted text." } });
    fireEvent.click(screen.getByRole("button", { name: "Generate quiz" }));

    expect(screen.getByText(/Writing your quiz from the pasted text/)).toBeInTheDocument();
    await screen.findByText("Who is the protagonist?");
  });

  it("shows the server's error message when the response isn't ok", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse(false, { error: "Couldn't find that chapter." }),
    );

    render(<Page />);
    fillAndSubmit();

    expect(await screen.findByText("Couldn't find that chapter.")).toBeInTheDocument();
  });

  it("falls back to a generic error message when the error response has none", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(false, {}));

    render(<Page />);
    fillAndSubmit();

    expect(await screen.findByText("Something went wrong.")).toBeInTheDocument();
  });

  it("shows a network-error message when fetch itself rejects", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("network down"));

    render(<Page />);
    fillAndSubmit();

    expect(await screen.findByText(/Network error/)).toBeInTheDocument();
  });

  it("shows an unexpected-response message when the body isn't valid JSON", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error("bad json");
      },
    });

    render(<Page />);
    fillAndSubmit();

    expect(await screen.findByText(/unexpected response/)).toBeInTheDocument();
  });

  it("returns to the form via 'Try another chapter' after finishing a quiz", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(true, sampleQuiz()));

    render(<Page />);
    fillAndSubmit();
    await screen.findByText("Who is the protagonist?");

    fireEvent.click(screen.getByRole("button", { name: "Paul" }));
    fireEvent.click(screen.getByRole("button", { name: "See results" }));
    fireEvent.click(screen.getByRole("button", { name: "Try another chapter" }));

    expect(screen.getByLabelText("Book title")).toHaveValue("");
  });

  it("regenerates using the quiz's normalized book/chapter and the remembered pasted text", async () => {
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(jsonResponse(true, sampleQuiz("Dune", "Chapter 1")))
      .mockResolvedValueOnce(jsonResponse(true, sampleQuiz("Dune", "Chapter 1")));

    render(<Page />);
    fireEvent.change(screen.getByLabelText("Book title"), { target: { value: "dune" } });
    fireEvent.change(screen.getByLabelText("Chapter"), { target: { value: "ch 1" } });
    fireEvent.click(screen.getByRole("button", { name: "Can't find it? Paste the chapter text instead" }));
    fireEvent.change(screen.getByLabelText(/Chapter text/), { target: { value: "Some pasted text." } });
    fireEvent.click(screen.getByRole("button", { name: "Generate quiz" }));
    await screen.findByText("Who is the protagonist?");

    fireEvent.click(screen.getByRole("button", { name: "Paul" }));
    fireEvent.click(screen.getByRole("button", { name: "See results" }));
    fireEvent.click(screen.getByRole("button", { name: "New questions on this chapter" }));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    const secondCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[1];
    expect(JSON.parse(secondCall[1].body)).toEqual({
      book: "Dune",
      chapter: "Chapter 1",
      chapterText: "Some pasted text.",
      regenerate: true,
    });
  });
});
