import type { CardProgress } from "./types";

export type Rating = 0 | 1 | 2 | 3; // Again | Hard | Good | Easy
export const RATING_LABELS: Record<Rating, string> = {
  0: "Again",
  1: "Hard",
  2: "Good",
  3: "Easy",
};

// Maps UI ratings (0–3) to SM-2 quality scores (0–5)
const QUALITY: Record<Rating, number> = {
  0: 0, // Again
  1: 3, // Hard
  2: 4, // Good
  3: 5, // Easy
};

export function createInitialProgress(): CardProgress {
  return {
    interval: 1,
    easinessFactor: 2.5,
    repetitions: 0,
    dueDate: new Date().toISOString(),
    lastReviewed: new Date().toISOString(),
    state: "new",
  };
}

export function applyRating(
  progress: CardProgress,
  rating: Rating
): CardProgress {
  const q = QUALITY[rating];
  let { interval, easinessFactor, repetitions } = progress;

  if (q < 3) {
    // Fail — reset
    interval = 1;
    repetitions = 0;
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easinessFactor);
    }
    repetitions += 1;
  }

  // Update EF
  easinessFactor =
    easinessFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easinessFactor < 1.3) easinessFactor = 1.3;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + interval);

  const state =
    repetitions === 0 ? "learning" : interval >= 21 ? "review" : "learning";

  return {
    interval,
    easinessFactor,
    repetitions,
    dueDate: dueDate.toISOString(),
    lastReviewed: new Date().toISOString(),
    state,
  };
}

export function isDue(progress: CardProgress): boolean {
  return new Date(progress.dueDate) <= new Date();
}
