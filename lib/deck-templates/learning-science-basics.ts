import type { DeckTemplate } from "../types";

export const learningScienceBasicsTemplate: DeckTemplate = {
  id: "template-learning-science-basics",
  name: "Learning Science Basics",
  description: "Core memory principles to study more effectively.",
  newCardsPerDay: 15,
  cards: [
    {
      type: "basic",
      front: "What is spaced repetition?",
      back: "A study method that reviews information at increasing intervals right before you forget it.",
    },
    {
      type: "basic",
      front: "What does active recall mean?",
      back: "Testing yourself by retrieving information from memory instead of rereading notes.",
    },
    {
      type: "cloze",
      text: "A short break from focused work can improve attention through {{cognitive reset}}.",
    },
    {
      type: "mcq",
      question: "Which strategy usually improves long-term retention most?",
      options: [
        "Rereading notes repeatedly",
        "Highlighting everything",
        "Frequent low-stakes retrieval practice",
        "Studying only right before exams",
      ],
      answer: 2,
    },
  ],
};
