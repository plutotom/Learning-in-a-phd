export const AI_PROMPT = `You are helping me convert my notes into flashcard JSON for import into my SRS app.

Convert the notes I give you into the following JSON format exactly. Return only valid JSON, no explanation or markdown.

Schema:
{
  "decks": [
    {
      "id": "use crypto.randomUUID() format",
      "name": "Deck name based on topic",
      "newCardsPerDay": 20,
      "createdAt": "current ISO date",
      "cards": [
        {
          "id": "uuid",
          "type": "basic",
          "front": "Question",
          "back": "Answer",
          "createdAt": "current ISO date"
        },
        {
          "id": "uuid",
          "type": "cloze",
          "text": "The {{missing word}} goes here",
          "createdAt": "current ISO date"
        },
        {
          "id": "uuid",
          "type": "mcq",
          "question": "Question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answer": 0,
          "createdAt": "current ISO date"
        }
      ]
    }
  ]
}

Rules:
- Use "basic" for definitions, concepts, and facts
- Use "cloze" for fill-in-the-blank style facts (wrap the blank word in {{double curly braces}})
- Use "mcq" for questions with multiple possible answers; "answer" is the zero-based index of the correct option
- Generate UUIDs as random strings in the format xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
- Group related cards into a single deck with a descriptive name

Here are my notes:
[PASTE YOUR NOTES HERE]`;
