import type { Card, CardInput, Deck, DeckTemplate } from "./types";
import { deckTemplates } from "./deck-templates";

export const DECK_LIBRARY_TEMPLATES: DeckTemplate[] = deckTemplates;

function buildCard(cardInput: CardInput, createdAt: string): Card {
  const id = crypto.randomUUID();
  switch (cardInput.type) {
    case "basic":
      return { ...cardInput, id, createdAt };
    case "cloze":
      return { ...cardInput, id, createdAt };
    case "mcq":
      return { ...cardInput, id, createdAt };
    default: {
      const exhaustiveCheck: never = cardInput;
      return exhaustiveCheck;
    }
  }
}

export function instantiateDeckFromTemplate(template: DeckTemplate): Deck {
  const createdAt = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: template.name,
    newCardsPerDay: template.newCardsPerDay ?? 20,
    createdAt,
    cards: template.cards.map((card) => buildCard(card, createdAt)),
  };
}
