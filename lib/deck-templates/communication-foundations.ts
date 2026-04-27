import type { DeckTemplate } from "../types";

export const communicationFoundationsTemplate: DeckTemplate = {
  id: "template-communication-foundations",
  name: "Communication Foundations",
  description: "Reusable cards for clear writing and speaking.",
  newCardsPerDay: 10,
  cards: [
    {
      type: "basic",
      front: "What is the 'one idea per paragraph' rule?",
      back: "Each paragraph should communicate one central point clearly and completely.",
    },
    {
      type: "cloze",
      text: "When giving feedback, focus on {{observable behavior}} rather than assumptions about intent.",
    },
    {
      type: "mcq",
      question: "Which opener is strongest for most professional writing?",
      options: [
        "Long personal story",
        "Main point first, then context",
        "Technical details first",
        "Question with no context",
      ],
      answer: 1,
    },
  ],
};
