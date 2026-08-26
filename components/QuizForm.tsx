"use client";

import { useState, type FormEvent } from "react";
import { MAX_FIELD_LENGTH } from "@/lib/quiz-schema";

type QuizFormProps = {
  onSubmit: (book: string, chapter: string) => void;
  loading: boolean;
};

export default function QuizForm({ onSubmit, loading }: QuizFormProps) {
  const [book, setBook] = useState("");
  const [chapter, setChapter] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!book.trim() || !chapter.trim() || loading) return;
    onSubmit(book.trim(), chapter.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="book" className="text-sm font-medium">
          Book title
        </label>
        <input
          id="book"
          type="text"
          value={book}
          onChange={(e) => setBook(e.target.value)}
          placeholder="e.g. To Kill a Mockingbird"
          maxLength={MAX_FIELD_LENGTH}
          disabled={loading}
          className="rounded-md border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 outline-none focus:border-black/40 dark:focus:border-white/40 disabled:opacity-50"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="chapter" className="text-sm font-medium">
          Chapter
        </label>
        <input
          id="chapter"
          type="text"
          value={chapter}
          onChange={(e) => setChapter(e.target.value)}
          placeholder="e.g. Chapter 3"
          maxLength={MAX_FIELD_LENGTH}
          disabled={loading}
          className="rounded-md border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 outline-none focus:border-black/40 dark:focus:border-white/40 disabled:opacity-50"
        />
      </div>
      <button
        type="submit"
        disabled={loading || !book.trim() || !chapter.trim()}
        className="mt-2 rounded-md bg-foreground text-background px-4 py-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Generating quiz…" : "Generate quiz"}
      </button>
    </form>
  );
}
