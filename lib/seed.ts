import type { DecksData } from "./types";
import { getDecks, saveDecks } from "./storage";

const SEED_DECK: DecksData = {
  decks: [
    {
      id: "seed-deck-srs-intro",
      name: "How SRS Works (Example Deck)",
      newCardsPerDay: 20,
      createdAt: "2024-01-01T00:00:00.000Z",
      cards: [
        {
          id: "seed-card-01",
          type: "basic",
          front: "What does SRS stand for?",
          back: "Spaced Repetition System — a learning technique that schedules reviews at increasing intervals based on how well you know each card.",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "seed-card-02",
          type: "basic",
          front: "What do the four rating buttons mean?",
          back: "Again = complete blackout, Hard = struggled, Good = recalled with effort, Easy = recalled instantly. The harder the rating, the sooner the card comes back.",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "seed-card-03",
          type: "cloze",
          text: "In SM-2, the {{easiness factor}} controls how quickly review intervals grow over time.",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "seed-card-04",
          type: "cloze",
          text: "Cards you rate {{Again}} come back in the same study session. Cards you rate {{Good}} or higher are scheduled for a future day.",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "seed-card-05",
          type: "mcq",
          question: "Which rating should you choose when you remembered the answer but it took real effort?",
          options: ["Again", "Hard", "Good", "Easy"],
          answer: 2,
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "seed-card-06",
          type: "mcq",
          question: "What happens to a card's review interval when you keep rating it Easy?",
          options: [
            "It stays the same",
            "It gets shorter",
            "It grows longer and longer",
            "It is deleted after 10 reviews",
          ],
          answer: 2,
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "seed-card-07",
          type: "basic",
          front: "How do you import your own notes as flashcards?",
          back: "Click 'Copy AI Prompt' on the home screen, paste it into Claude or ChatGPT along with your notes, then import the returned JSON using the 'Import' button.",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "seed-card-08",
          type: "basic",
          front: "What keyboard shortcuts work during a study session?",
          back: "Space = show answer. 1 = Again, 2 = Hard, 3 = Good, 4 = Easy.",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ],
    },
  ],
};

export function seedIfEmpty(): void {
  if (typeof window === "undefined") return;
  const data = getDecks();
  if (data.decks.length === 0) {
    saveDecks(SEED_DECK);
  }
}
