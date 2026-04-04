export const AI_PROMPT = `You are helping me convert my notes into flashcard JSON for import into my SRS app.

Convert the notes I give you into the following JSON format exactly. Return only valid JSON, no explanation or markdown.

Schema:
{
  "folders": [
    {
      "id": "uuid",
      "name": "Folder name (e.g. a subject or module)",
      "createdAt": "current ISO date"
    }
  ],
  "decks": [
    {
      "id": "uuid",
      "name": "Deck name based on topic",
      "folderId": "uuid of the folder this deck belongs to (omit if no folder)",
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
- Group related decks into folders by subject or module (e.g. "Year 1", "Neuroscience", "Statistics")
- Each deck's "folderId" must match the "id" of one of the folders in the "folders" array
- If all notes belong to the same subject you can use a single folder; omit "folders" and "folderId" entirely if no grouping is needed

Here are my notes:
[PASTE YOUR NOTES HERE]`;
