# Flashcard SRS App — Build Handoff Plan

## Overview

A Next.js spaced repetition flashcard app hosted on Vercel. All data lives in localStorage. No backend, no auth. Supports deck organization, three card types, SRS scheduling, and JSON import/export.

---

## Tech Stack

| Tool | Choice |
|---|---|
| **Framework** | Next.js (App Router) |
| **Hosting** | Vercel |
| **Styling** | Tailwind CSS |
| **State** | React state + localStorage (no Redux/Zustand needed) |
| **Routing** | Next.js App Router (file-based, no React Router) |
| **IDs** | `crypto.randomUUID()` |
| **SRS Algorithm** | SM-2 |
| **Toasts** | `sonner` |

> **Why Next.js over Vite + React Router?** Next.js deploys to Vercel with zero config, gets edge caching, automatic code splitting, and file-based routing out of the box. No tradeoffs for a localStorage-only app.

---

## Important: `'use client'` Strategy

Since all data lives in localStorage (a browser-only API), **every page and component that reads or writes data must be a client component**. Add `'use client'` at the top of any file that uses:

- `localStorage`
- `useState` / `useEffect` / `useReducer`
- `useRouter` / `useParams` / `useSearchParams`
- Event handlers

Next.js will default to Server Components — you'll get hydration errors if you forget this. A safe pattern: keep a thin `page.tsx` as a server component for metadata, and render a `<PageNameClient />` component that has `'use client'` and does all the work.

---

## File / Route Structure

```
app/
├── page.tsx                          # / — Home / Deck List
├── layout.tsx                        # Root layout (Toaster lives here)
├── not-found.tsx                     # 404 fallback
├── deck/
│   └── [deckId]/
│       ├── study/
│       │   └── page.tsx              # /deck/:deckId/study
│       ├── browse/
│       │   └── page.tsx              # /deck/:deckId/browse
│       └── edit/
│           └── page.tsx              # /deck/:deckId/edit
└── card/
    ├── new/
    │   └── page.tsx                  # /card/new?deckId=
    └── [cardId]/
        └── edit/
            └── page.tsx              # /card/:cardId/edit
```

### `useSearchParams` — Suspense Required

The `/card/new?deckId=` page uses `useSearchParams`. Next.js requires it to be wrapped in a `<Suspense>` boundary or it will throw a build error.

```tsx
// app/card/new/page.tsx
import { Suspense } from 'react'
import NewCardClient from './NewCardClient'

export default function NewCardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewCardClient />
    </Suspense>
  )
}
```

---

## Data Architecture

### localStorage Keys

| Key | Description |
|---|---|
| `srs_decks` | All deck and card data |
| `srs_progress` | SRS progress keyed by card ID |
| `srs_settings` | Global settings including daily new card counts |

### Deck/Card Schema (`srs_decks`)

```json
{
  "decks": [
    {
      "id": "uuid",
      "name": "CBT Theory",
      "newCardsPerDay": 20,
      "createdAt": "ISO date",
      "cards": [
        {
          "id": "uuid",
          "type": "basic",
          "front": "What is cognitive restructuring?",
          "back": "The process of identifying and challenging distorted thoughts",
          "createdAt": "ISO date"
        },
        {
          "id": "uuid",
          "type": "cloze",
          "text": "The {{amygdala}} is central to fear processing",
          "createdAt": "ISO date"
        },
        {
          "id": "uuid",
          "type": "mcq",
          "question": "Which therapy targets behavioral activation?",
          "options": ["CBT", "DBT", "BA", "ACT"],
          "answer": 2,
          "createdAt": "ISO date"
        }
      ]
    }
  ]
}
```

### SRS Progress Schema (`srs_progress`)

```json
{
  "card-uuid": {
    "interval": 1,
    "easinessFactor": 2.5,
    "repetitions": 0,
    "dueDate": "ISO date",
    "lastReviewed": "ISO date",
    "state": "new | learning | review"
  }
}
```

### Settings Schema (`srs_settings`)

```json
{
  "dailyNewCards": {
    "YYYY-MM-DD": {
      "deck-uuid": 3
    }
  }
}
```

This tracks how many new cards have been introduced per deck per day, so the `newCardsPerDay` limit is enforced correctly across sessions.

---

## SRS Algorithm — SM-2

- Quality rating: 0–5, surfaced to user as **Again / Hard / Good / Easy** buttons
- If quality < 3: reset interval to 1, repetitions to 0, reschedule soon
- If quality >= 3:
  - rep 0 → interval = 1
  - rep 1 → interval = 6
  - rep > 1 → interval = `prev_interval × EF`
  - `EF = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))`
  - EF floor = 1.3
- New cards per day: pulled from deck's `newCardsPerDay` setting, tracked via `srs_settings.dailyNewCards`
- **Undo**: store the last reviewed card's previous progress state in memory (not localStorage) so it can be restored if user hits Undo. One level of undo only.

---

## Pages & Routes

### `/` — Home / Deck List

- List all decks
- Show due card count per deck
- Buttons: Study, Browse, Edit Deck, Delete Deck
- Button: Create New Deck
- Button: Import JSON (uploads a full deck export)
- Button: Export All (downloads all decks as JSON)
- Button: Copy AI Prompt (see below)

### `/deck/[deckId]/study` — Study / Due Queue

- Shows cards due today (SRS due date <= today) + new cards up to daily limit
- Card rendered based on type (basic, cloze, mcq)
- Show answer / reveal interaction
- Again / Hard / Good / Easy rating buttons
- Undo button (restores previous card's SRS state)
- Progress indicator: "X cards remaining"
- When queue empty: "You're done for today" screen

### `/deck/[deckId]/browse` — Browse Mode

- Paginated list of all cards in deck
- Filter by type (basic / cloze / mcq)
- Edit and Delete per card
- Add new card button

### `/deck/[deckId]/edit` — Deck Settings

- Edit deck name
- Set new cards per day limit
- Delete deck (with confirmation)

### `/card/new?deckId=` — Add Card

- Select card type (basic / cloze / mcq)
- Form changes based on type:
  - **Basic**: Front field, Back field
  - **Cloze**: Single text field, hint text: "Wrap blanks in {{double curly braces}}"
  - **MCQ**: Question field, 2–6 option fields (add/remove), select correct answer

### `/card/[cardId]/edit` — Edit Card

- Same form as Add Card, pre-populated

---

## Card Type Rendering — Study Mode

### Basic

- Show front, user taps/clicks to reveal back
- Rate with Again / Hard / Good / Easy

### Cloze

- Parse `{{word}}` syntax, replace with `_____` on front
- Reveal full text on show answer
- Rate with Again / Hard / Good / Easy

### MCQ

- Show question and option buttons (A, B, C, D…)
- User selects an option
- Reveal correct answer with color feedback (green correct, red wrong)
- Rate with Again / Hard / Good / Easy (shown after answer revealed)

---

## Import / Export

### Export

- Button on home screen: "Export All"
- Downloads a single JSON file containing the full `srs_decks` schema
- Filename: `srs-export-YYYY-MM-DD.json`
- SRS progress is **not** included in export (it stays in localStorage)

### Import

- Button on home screen: "Import JSON"
- Accepts a `.json` file matching the deck schema
- On import: assign new UUIDs to all decks and cards to avoid ID collisions
- Merge into existing decks (do not overwrite all data)
- Show success/error toast via `sonner`

---

## "Copy AI Prompt" Button

- Visible on the home screen
- Copies the following prompt to clipboard:

```
You are helping me convert my notes into flashcard JSON for import into my SRS app.

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
[PASTE YOUR NOTES HERE]
```

---

## UI / UX Notes

- Mobile-first layout, usable on phone
- Clean minimal design — this is a study tool, not a marketing page
- Toast notifications via `sonner` for: import success/fail, export complete, card saved, undo triggered
- `<Toaster />` component mounted once in `app/layout.tsx`
- Confirmation dialog before any destructive action (delete deck, delete card)
- Keyboard shortcut support in study mode (optional stretch goal):
  - Space = show answer
  - 1/2/3/4 = Again / Hard / Good / Easy

---

## Out of Scope (v1)

- User accounts / sync
- Cloud backup
- Image or audio cards
- FSRS algorithm (SM-2 only for now)
- Review statistics or streaks
- Shared decks
