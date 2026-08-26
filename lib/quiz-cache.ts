import type { Quiz } from "./quiz-schema";

export const MAX_ENTRIES = 500;

// In-memory only: resets on every cold start and isn't shared across
// multiple instances/processes. Fine as the whole cache layer behind
// `next start` on a single Node process (a VPS, a container, etc.) — not
// enough on its own behind a multi-instance or serverless deployment, where
// you'd want a shared store (e.g. Redis/Vercel KV) behind this same
// get/set/has interface instead of this Map.
const cache = new Map<string, Quiz>();

/** Case-insensitive, whitespace-trimmed so "Dune"/" dune " share a cache entry. */
export function cacheKey(book: string, chapter: string): string {
  return `${book.trim().toLowerCase()}::${chapter.trim().toLowerCase()}`;
}

export function getCachedQuiz(key: string): Quiz | undefined {
  return cache.get(key);
}

export function setCachedQuiz(key: string, quiz: Quiz): void {
  if (!cache.has(key) && cache.size >= MAX_ENTRIES) {
    // FIFO eviction — a Map iterates keys in insertion order, so the first
    // one out is the oldest entry.
    const oldestKey = cache.keys().next().value;
    // The `undefined` case can't actually happen here (size >= MAX_ENTRIES > 0
    // guarantees a first key) — it's only in the type from Map's iterator
    // protocol. Guarded defensively rather than asserted away.
    /* v8 ignore else */
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
  cache.set(key, quiz);
}

/** Test-only escape hatch — cache state would otherwise leak between tests. */
export function clearQuizCache(): void {
  cache.clear();
}
