"use client";

import { useState, type FormEvent } from "react";
import { MAX_CHAPTER_TEXT_LENGTH, MAX_FIELD_LENGTH } from "@/lib/quiz-schema";
import { BUTTON_PRIMARY_CLASSES, FIELD_CLASSES } from "./styles";

type QuizFormProps = {
  onSubmit: (book: string, chapter: string, chapterText?: string) => void;
  loading: boolean;
};

type TextFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled: boolean;
};

/** Book title and chapter share this exact shape — label above a single-line input. */
function TextField({ id, label, value, onChange, placeholder, disabled }: TextFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={MAX_FIELD_LENGTH}
        disabled={disabled}
        className={FIELD_CLASSES}
      />
    </div>
  );
}

export default function QuizForm({ onSubmit, loading }: QuizFormProps) {
  const [book, setBook] = useState("");
  const [chapter, setChapter] = useState("");
  const [chapterText, setChapterText] = useState("");
  const [showChapterText, setShowChapterText] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!book.trim() || !chapter.trim() || loading) return;
    onSubmit(book.trim(), chapter.trim(), chapterText.trim() || undefined);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextField
        id="book"
        label="Book title"
        value={book}
        onChange={setBook}
        placeholder="e.g. To Kill a Mockingbird"
        disabled={loading}
      />
      <TextField
        id="chapter"
        label="Chapter"
        value={chapter}
        onChange={setChapter}
        placeholder="e.g. Chapter 3"
        disabled={loading}
      />

      <button
        type="button"
        onClick={() => setShowChapterText((v) => !v)}
        className="self-start text-sm underline text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
      >
        {showChapterText ? "Hide pasted text" : "Can't find it? Paste the chapter text instead"}
      </button>

      {showChapterText && (
        <div className="flex flex-col gap-1">
          <label htmlFor="chapterText" className="text-sm font-medium">
            Chapter text (optional)
          </label>
          <p className="text-xs text-black/60 dark:text-white/60">
            Used instead of web search when provided — handy for obscure or self-published books.
          </p>
          <textarea
            id="chapterText"
            value={chapterText}
            onChange={(e) => setChapterText(e.target.value)}
            placeholder="Paste the full chapter text here…"
            maxLength={MAX_CHAPTER_TEXT_LENGTH}
            disabled={loading}
            rows={8}
            className={FIELD_CLASSES}
          />
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !book.trim() || !chapter.trim()}
        className={`mt-2 ${BUTTON_PRIMARY_CLASSES}`}
      >
        {loading ? "Generating quiz…" : "Generate quiz"}
      </button>
    </form>
  );
}
