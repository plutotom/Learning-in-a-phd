import type { DeckTemplate } from "../types";

export const researchWorkflowTemplate: DeckTemplate = {
  id: "template-research-workflow",
  name: "Research Workflow",
  description: "Practical habits for planning and finishing academic work.",
  newCardsPerDay: 12,
  cards: [
    {
      type: "basic",
      front: "What makes a good weekly research goal?",
      back: "Specific, measurable, and tied to a concrete output (draft, analysis, or experiment).",
    },
    {
      type: "basic",
      front: "Why keep a decision log?",
      back: "It helps track reasoning behind choices so you can justify, revisit, and improve them later.",
    },
    {
      type: "cloze",
      text: "A reliable literature review starts with a clear {{inclusion criteria}} before reading in depth.",
    },
    {
      type: "mcq",
      question: "What is usually the best first step after collecting raw data?",
      options: [
        "Jump to final figures",
        "Delete outliers immediately",
        "Run a quick data quality check",
        "Start writing conclusions",
      ],
      answer: 2,
    },
  ],
};
