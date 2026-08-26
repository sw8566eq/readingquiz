# Reading Quiz

Give it a book title and a chapter, get back a 5-question multiple-choice
quiz that checks whether you actually read and understood that chapter —
not generic trivia about the book.

Claude (via the Anthropic API) finds a summary of the chapter with web
search, then writes the quiz. If search can't find anything for an obscure
or self-published book, you can paste the chapter text in instead.

## How it works

1. You enter a book + chapter (or paste the chapter text directly).
2. `app/api/generate-quiz/route.ts` validates the input and calls
   `lib/generate-quiz.ts`, which prompts Claude to search the web (or use
   the pasted text) and return a quiz as schema-constrained JSON.
3. The quiz renders one question at a time, with instant correct/incorrect
   feedback and a running score. You can request a fresh set of questions
   on the same chapter, or start over on a new one.

Untrusted content (web search results, pasted text, your book/chapter
input) is treated as inert data throughout — see `lib/generate-quiz.ts` for
the prompt-injection defenses and `lib/quiz-schema.ts` for the length/shape
limits enforced on everything the model returns.

## Getting started

```bash
cp .env.local.example .env.local   # add your ANTHROPIC_API_KEY
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — local dev server (Turbopack)
- `npm run build` / `npm start` — production build
- `npm test` — run the Vitest suite
- `npm run test:coverage` — run the suite with coverage (enforced at 100%)
- `npm run lint` — ESLint

## Project layout

- `app/` — pages and the `POST /api/generate-quiz` route handler
- `lib/generate-quiz.ts` — prompt construction, Claude API call, retry/error handling
- `lib/quiz-schema.ts` — Zod schemas shared by the client, route, and model output
- `lib/quiz-cache.ts` — optional in-memory quiz cache (see below)
- `components/` — `QuizForm` (input) and `Quiz` (question flow + scoring)

## Optional: quiz caching

Off by default. Set `ENABLE_QUIZ_CACHE=true` to cache generated quizzes
in-memory by book+chapter, so repeat requests skip the Anthropic call. Only
useful if this is ever run somewhere with real traffic; see
`.env.local.example` and `lib/quiz-cache.ts` for details and caveats
(in-memory, per-process — won't help on serverless).

## Notes on this repo

This project runs against a modified/future build of Next.js — see
`AGENTS.md` before making changes; it points at the docs that actually
apply here instead of upstream Next.js conventions. There's also no rate
limiting on the API route by design (see the comment in
`app/api/generate-quiz/route.ts`) since this is meant to run locally for a
single trusted user, not be hosted publicly.
