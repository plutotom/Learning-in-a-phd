"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  getDecks,
  getProgress,
  saveProgress,
  getDailyNewCount,
  incrementDailyNewCount,
} from "@/lib/storage";
import {
  applyRating,
  createInitialProgress,
  isDue,
  RATING_LABELS,
  type Rating,
} from "@/lib/sm2";
import type { Card, CardProgress, ClozeCard } from "@/lib/types";
import Link from "next/link";

// Parses cloze text into segments: { text, blank }[]
function parseCloze(text: string): { text: string; isBlank: boolean }[] {
  const parts = text.split(/\{\{([^}]+)\}\}/g);
  return parts.map((part, i) => ({ text: part, isBlank: i % 2 === 1 }));
}

function ClozeDisplay({
  card,
  revealed,
}: {
  card: ClozeCard;
  revealed: boolean;
}) {
  const parts = parseCloze(card.text);
  return (
    <p className="text-lg leading-relaxed">
      {parts.map((p, i) =>
        p.isBlank ? (
          <span
            key={i}
            className={`inline-block min-w-[60px] rounded px-1 font-semibold ${
              revealed
                ? "bg-green-100 text-green-800"
                : "bg-gray-200 text-transparent"
            }`}
          >
            {p.text}
          </span>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </p>
  );
}

export default function StudyPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const router = useRouter();

  const [queue, setQueue] = useState<Card[]>([]);
  const [current, setCurrent] = useState<Card | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [deckName, setDeckName] = useState("");

  // Undo state stored in memory only
  const undoRef = useRef<{ card: Card; progress: CardProgress } | null>(null);

  useEffect(() => {
    buildQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === " " && !revealed && current) {
        e.preventDefault();
        if (current.type !== "mcq") setRevealed(true);
      }
      if (revealed) {
        if (e.key === "1") rate(0);
        if (e.key === "2") rate(1);
        if (e.key === "3") rate(2);
        if (e.key === "4") rate(3);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, current]);

  function buildQueue() {
    const data = getDecks();
    const deck = data.decks.find((d) => d.id === deckId);
    if (!deck) { router.push("/"); return; }
    setDeckName(deck.name);

    const progress = getProgress();
    const dailyNew = getDailyNewCount(deckId);
    let newIntroduced = dailyNew;
    const q: Card[] = [];

    for (const card of deck.cards) {
      const p = progress[card.id];
      if (!p) {
        if (newIntroduced < deck.newCardsPerDay) {
          q.push(card);
          newIntroduced++;
        }
      } else if (isDue(p)) {
        q.push(card);
      }
    }

    // Shuffle
    q.sort(() => Math.random() - 0.5);

    setQueue(q);
    setRemaining(q.length);
    if (q.length > 0) {
      setCurrent(q[0]);
    } else {
      setDone(true);
    }
  }

  function rate(rating: Rating) {
    if (!current) return;

    const progress = getProgress();
    const prev = progress[current.id];

    // Save undo snapshot
    if (prev) {
      undoRef.current = { card: current, progress: { ...prev } };
    }

    const next = applyRating(
      prev ?? createInitialProgress(),
      rating
    );

    // If this was a new card, increment daily counter
    if (!prev) {
      incrementDailyNewCount(deckId);
    }

    progress[current.id] = next;
    saveProgress(progress);

    if (rating === 0) {
      // "Again" — put card back at the end of the session queue
      const rest = queue.slice(1);
      const requeuedQueue = [...rest, current];
      setQueue(requeuedQueue);
      setRemaining(requeuedQueue.length);
      setRevealed(false);
      setSelectedOption(null);
      setCurrent(requeuedQueue[0] ?? null);
      if (requeuedQueue.length === 0) setDone(true);
    } else {
      advanceQueue();
    }
  }

  function advanceQueue() {
    const nextQueue = queue.slice(1);
    setQueue(nextQueue);
    setRemaining(nextQueue.length);
    setRevealed(false);
    setSelectedOption(null);

    if (nextQueue.length === 0) {
      setDone(true);
      setCurrent(null);
    } else {
      setCurrent(nextQueue[0]);
    }
  }

  function undo() {
    if (!undoRef.current) return;
    const { card, progress: prevProgress } = undoRef.current;

    const progress = getProgress();
    progress[card.id] = prevProgress;
    saveProgress(progress);
    undoRef.current = null;

    // Put card back at front
    const newQueue = [card, ...queue];
    setQueue(newQueue);
    setRemaining(newQueue.length);
    setCurrent(card);
    setRevealed(false);
    setSelectedOption(null);
    setDone(false);
    toast.success("Undo — card restored");
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-5xl">🎉</p>
        <h2 className="mt-4 text-2xl font-bold">You&apos;re done for today!</h2>
        <p className="mt-2 text-gray-500">All cards reviewed for {deckName}.</p>
        {undoRef.current && (
          <button
            onClick={undo}
            className="mt-4 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Undo last rating
          </button>
        )}
        <Link
          href="/"
          className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Back to home
        </Link>
      </div>
    );
  }

  if (!current) return null;

  const ratingColors: Record<Rating, string> = {
    0: "bg-red-500 hover:bg-red-600 text-white",
    1: "bg-orange-400 hover:bg-orange-500 text-white",
    2: "bg-green-500 hover:bg-green-600 text-white",
    3: "bg-blue-500 hover:bg-blue-600 text-white",
  };

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-800">
          ← {deckName}
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{remaining} remaining</span>
          {undoRef.current && (
            <button
              onClick={undo}
              className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Undo
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{
            width: `${Math.max(0, 100 - (remaining / (remaining + 1)) * 100)}%`,
          }}
        />
      </div>

      {/* Card */}
      <div className="min-h-[280px] rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        {current.type === "basic" && (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                Front
              </p>
              <p className="text-lg font-medium">{current.front}</p>
            </div>
            {revealed && (
              <div className="border-t border-gray-100 pt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                  Back
                </p>
                <p className="text-lg">{current.back}</p>
              </div>
            )}
          </div>
        )}

        {current.type === "cloze" && (
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
              Fill in the blank
            </p>
            <ClozeDisplay card={current} revealed={revealed} />
          </div>
        )}

        {current.type === "mcq" && (
          <div className="space-y-4">
            <p className="text-lg font-medium">{current.question}</p>
            <div className="space-y-2">
              {current.options.map((opt, i) => {
                let cls =
                  "w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ";
                if (!revealed) {
                  cls +=
                    selectedOption === i
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 hover:bg-gray-50";
                } else {
                  if (i === current.answer) {
                    cls += "border-green-400 bg-green-50 text-green-800";
                  } else if (selectedOption === i) {
                    cls += "border-red-300 bg-red-50 text-red-700";
                  } else {
                    cls += "border-gray-100 text-gray-400";
                  }
                }
                return (
                  <button
                    key={i}
                    className={cls}
                    disabled={revealed}
                    onClick={() => {
                      setSelectedOption(i);
                      setRevealed(true);
                    }}
                  >
                    <span className="mr-2 font-bold">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {current.type !== "mcq" && !revealed && (
        <button
          onClick={() => setRevealed(true)}
          className="w-full rounded-xl bg-gray-800 py-3.5 text-sm font-medium text-white hover:bg-gray-900"
        >
          Show answer <span className="ml-2 text-gray-400 text-xs">[Space]</span>
        </button>
      )}

      {revealed && (
        <div className="grid grid-cols-4 gap-2">
          {([0, 1, 2, 3] as Rating[]).map((r) => (
            <button
              key={r}
              onClick={() => rate(r)}
              className={`rounded-xl py-3 text-sm font-medium ${ratingColors[r]}`}
            >
              <div>{RATING_LABELS[r]}</div>
              <div className="text-xs opacity-70">[{r + 1}]</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
