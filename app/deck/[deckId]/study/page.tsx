"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

/** Permutation mapping display index → original option index (Fisher–Yates). */
function shuffleOptionOrder(length: number): number[] {
  const order = Array.from({ length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [current, setCurrent] = useState<Card | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [deckName, setDeckName] = useState("");
  const [earlyReview, setEarlyReview] = useState(false);

  const mcqDisplayOrder = useMemo(() => {
    if (!current || current.type !== "mcq" || current.options.length === 0) {
      return [] as number[];
    }
    return shuffleOptionOrder(current.options.length);
  }, [
    currentIndex,
    current?.id,
    current?.type,
    current?.type === "mcq" ? current.options.length : 0,
  ]);

  // Undo state stored in memory only
  const undoRef = useRef<{ card: Card; progress: CardProgress } | null>(null);

  useEffect(() => {
    buildQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" && queue.length > 1 && currentIndex > 0) {
        e.preventDefault();
        const i = currentIndex - 1;
        setCurrentIndex(i);
        setCurrent(queue[i]);
        setRevealed(false);
        setSelectedOption(null);
        return;
      }
      if (
        e.key === "ArrowRight" &&
        queue.length > 1 &&
        currentIndex < queue.length - 1
      ) {
        e.preventDefault();
        const i = currentIndex + 1;
        setCurrentIndex(i);
        setCurrent(queue[i]);
        setRevealed(false);
        setSelectedOption(null);
        return;
      }
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
  }, [revealed, current, currentIndex, queue]);

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

    if (q.length > 0) {
      // Normal SRS session — shuffle due cards
      q.sort(() => Math.random() - 0.5);
      setEarlyReview(false);
    } else {
      // Nothing due — fall back to all cards sorted by next due date
      // so the user can keep studying without being hard-blocked
      const all = [...deck.cards].sort((a, b) => {
        const pa = progress[a.id];
        const pb = progress[b.id];
        const ta = pa ? new Date(pa.dueDate).getTime() : 0;
        const tb = pb ? new Date(pb.dueDate).getTime() : 0;
        return ta - tb;
      });
      q.push(...all);
      setEarlyReview(true);
    }

    setQueue(q);
    setRemaining(q.length);
    setCurrentIndex(0);
    setCurrent(q[0] ?? null);
    setDone(false);
  }

  function goToQueueIndex(i: number) {
    if (i < 0 || i >= queue.length) return;
    setCurrentIndex(i);
    setCurrent(queue[i]);
    setRevealed(false);
    setSelectedOption(null);
  }

  function goPrevCard() {
    goToQueueIndex(currentIndex - 1);
  }

  function goNextCard() {
    goToQueueIndex(currentIndex + 1);
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
      const before = queue.slice(0, currentIndex);
      const after = queue.slice(currentIndex + 1);
      const requeuedQueue = [...before, ...after, current];
      setQueue(requeuedQueue);
      setRemaining(requeuedQueue.length);
      setRevealed(false);
      setSelectedOption(null);
      const nextCard = requeuedQueue[currentIndex] ?? null;
      setCurrent(nextCard);
      if (!nextCard) setDone(true);
    } else {
      const newQueue = queue.filter((_, i) => i !== currentIndex);
      setQueue(newQueue);
      setRemaining(newQueue.length);
      setRevealed(false);
      setSelectedOption(null);

      if (newQueue.length === 0) {
        setDone(true);
        setCurrent(null);
      } else {
        const idx = Math.min(currentIndex, newQueue.length - 1);
        setCurrentIndex(idx);
        setCurrent(newQueue[idx]);
      }
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
    setCurrentIndex(0);
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
        <h2 className="mt-4 text-2xl font-bold">
          {earlyReview ? "Session complete!" : "You're done for today!"}
        </h2>
        <p className="mt-2 text-gray-500">
          {earlyReview
            ? "All cards reviewed."
            : "All due cards reviewed for " + deckName + "."}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          {undoRef.current && (
            <button
              onClick={undo}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Undo last rating
            </button>
          )}
          <button
            onClick={buildQueue}
            className="rounded-xl border border-indigo-200 px-5 py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
          >
            Study again
          </button>
          <Link
            href="/"
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const mcqCorrectDisplayIndex =
    current.type === "mcq" && mcqDisplayOrder.length === current.options.length
      ? mcqDisplayOrder.indexOf(current.answer)
      : -1;

  const ratingColors: Record<Rating, string> = {
    0: "bg-red-500 hover:bg-red-600 text-white",
    1: "bg-orange-400 hover:bg-orange-500 text-white",
    2: "bg-green-500 hover:bg-green-600 text-white",
    3: "bg-blue-500 hover:bg-blue-600 text-white",
  };

  return (
    <div className="space-y-4">
      {/* Early review banner */}
      {earlyReview && (
        <div className="rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
          No cards due yet — reviewing early. Ratings still count.
        </div>
      )}
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-800">
          ← {deckName}
        </Link>
        <div className="flex items-center gap-3">
          {queue.length > 1 && (
            <span className="text-sm text-gray-400">
              {currentIndex + 1} / {queue.length}
            </span>
          )}
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

      {/* Card + side navigation (multi-card sessions only) */}
      <div className="flex items-stretch gap-2 sm:gap-3">
        {queue.length > 1 ? (
          <button
            type="button"
            onClick={goPrevCard}
            disabled={currentIndex <= 0}
            aria-label="Previous card in session"
            title="Previous card (←)"
            className="flex w-10 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-gray-500 sm:w-11"
          >
            <svg
              className="h-7 w-7"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        ) : null}
        <div className="min-h-[280px] min-w-0 flex-1 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
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
              {mcqDisplayOrder.map((originalIndex, displayIndex) => {
                const opt = current.options[originalIndex];
                let cls =
                  "w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ";
                if (!revealed) {
                  cls +=
                    selectedOption === displayIndex
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 hover:bg-gray-50";
                } else {
                  if (displayIndex === mcqCorrectDisplayIndex) {
                    cls += "border-green-400 bg-green-50 text-green-800";
                  } else if (selectedOption === displayIndex) {
                    cls += "border-red-300 bg-red-50 text-red-700";
                  } else {
                    cls += "border-gray-100 text-gray-400";
                  }
                }
                return (
                  <button
                    key={originalIndex}
                    className={cls}
                    disabled={revealed}
                    onClick={() => {
                      setSelectedOption(displayIndex);
                      setRevealed(true);
                    }}
                  >
                    <span className="mr-2 font-bold">
                      {String.fromCharCode(65 + displayIndex)}.
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        </div>
        {queue.length > 1 ? (
          <button
            type="button"
            onClick={goNextCard}
            disabled={currentIndex >= queue.length - 1}
            aria-label="Next card in session"
            title="Next card (→)"
            className="flex w-10 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-gray-500 sm:w-11"
          >
            <svg
              className="h-7 w-7"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        ) : null}
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
