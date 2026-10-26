import { describe, expect, it } from "vitest";

import type { ProgressState } from "../types";
import { applyCardRating, intervalForRating } from "./repetition";

function progress(): ProgressState {
  return { known: [], review: [], seen: [], schedule: {}, practice: { answered: 0, correct: 0 }, exams: [] };
}

describe("spaced repetition", () => {
  it("schedules a missed card ten minutes later", () => {
    const now = Date.UTC(2026, 9, 26, 10, 0, 0);
    const result = applyCardRating(progress(), "official-1", "again", now);

    expect(result.intervalDays).toBe(0);
    expect(result.progress.review).toContain("official-1");
    expect(result.progress.schedule["official-1"].dueAt).toBe(new Date(now + 10 * 60 * 1000).toISOString());
    expect(result.progress.schedule["official-1"].lapses).toBe(1);
  });

  it("uses the expected first intervals", () => {
    const state = progress();
    expect(intervalForRating(state, "card", "hard")).toBe(1);
    expect(intervalForRating(state, "card", "good")).toBe(3);
    expect(intervalForRating(state, "card", "easy")).toBe(7);
  });

  it("marks a sufficiently consolidated card as mastered", () => {
    const state = progress();
    state.review = ["card"];
    state.schedule.card = {
      repetitions: 2,
      intervalDays: 7,
      lapses: 0,
      lastRating: "good",
      lastReviewedAt: "2026-10-19T10:00:00.000Z",
      dueAt: "2026-10-26T10:00:00.000Z",
    };

    const result = applyCardRating(state, "card", "good", Date.UTC(2026, 9, 26, 10, 0, 0));
    expect(result.intervalDays).toBe(14);
    expect(result.progress.known).toContain("card");
    expect(result.progress.review).not.toContain("card");
  });
});
