export type CardType = "basic" | "cloze" | "mcq";
export type CardState = "new" | "learning" | "review";

export interface BasicCard {
  id: string;
  type: "basic";
  front: string;
  back: string;
  createdAt: string;
}

export interface ClozeCard {
  id: string;
  type: "cloze";
  text: string;
  createdAt: string;
}

export interface McqCard {
  id: string;
  type: "mcq";
  question: string;
  options: string[];
  answer: number;
  createdAt: string;
}

export type Card = BasicCard | ClozeCard | McqCard;

// Distributed Omit — correctly strips keys from each union member
export type CardInput =
  | Omit<BasicCard, "id" | "createdAt">
  | Omit<ClozeCard, "id" | "createdAt">
  | Omit<McqCard, "id" | "createdAt">;

export interface Deck {
  id: string;
  name: string;
  newCardsPerDay: number;
  createdAt: string;
  cards: Card[];
}

export interface DecksData {
  decks: Deck[];
}

export interface CardProgress {
  interval: number;
  easinessFactor: number;
  repetitions: number;
  dueDate: string;
  lastReviewed: string;
  state: CardState;
}

export type ProgressData = Record<string, CardProgress>;

export interface DailyNewCards {
  [date: string]: {
    [deckId: string]: number;
  };
}

export interface SettingsData {
  dailyNewCards: DailyNewCards;
}
