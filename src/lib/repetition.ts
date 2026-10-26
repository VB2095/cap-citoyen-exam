import type { ProgressState, Rating } from "../types";
import { unique, without } from "./utils";

export function intervalForRating(progress: ProgressState, id: string, rating: Rating): number {
  const previous = progress.schedule[id]?.intervalDays || 0;
  if (rating === "again") return 0;
  if (rating === "hard") return previous ? Math.max(1, Math.round(previous * 1.25)) : 1;
  if (rating === "good") return previous ? Math.max(3, Math.round(previous * 2)) : 3;
  return previous ? Math.max(7, Math.round(previous * 2.5)) : 7;
}

export function intervalLabel(progress: ProgressState, id: string, rating: Rating): string {
  if (rating === "again") return "Dans 10 min";
  const days = intervalForRating(progress, id, rating);
  return days === 1 ? "Demain" : `Dans ${days} jours`;
}

export function applyCardRating(
  progress: ProgressState,
  id: string,
  rating: Rating,
  now = Date.now(),
): { progress: ProgressState; intervalDays: number } {
  const intervalDays = intervalForRating(progress, id, rating);
  const previous = progress.schedule[id] || { repetitions: 0, intervalDays: 0, lapses: 0 };
  const repetitions = rating === "again" ? 0 : previous.repetitions + 1;
  const delay = rating === "again" ? 10 * 60 * 1000 : intervalDays * 24 * 60 * 60 * 1000;
  const review = ["again", "hard"].includes(rating) ? unique([...progress.review, id]) : without(progress.review, id);
  const remainsKnown = (progress.known.includes(id) && ["good", "easy"].includes(rating))
    || (repetitions >= 3 && intervalDays >= 14);

  return {
    intervalDays,
    progress: {
      ...progress,
      seen: unique([...progress.seen, id]),
      review,
      known: remainsKnown ? unique([...progress.known, id]) : without(progress.known, id),
      schedule: {
        ...progress.schedule,
        [id]: {
          repetitions,
          intervalDays,
          lapses: previous.lapses + (rating === "again" ? 1 : 0),
          lastRating: rating,
          lastReviewedAt: new Date(now).toISOString(),
          dueAt: new Date(now + delay).toISOString(),
        },
      },
    },
  };
}
