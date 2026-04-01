"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { getDecks, saveDecks } from "@/lib/storage";
import type { Card, CardType, Deck } from "@/lib/types";
import ConfirmDialog from "@/components/ConfirmDialog";

const PAGE_SIZE = 20;

function cardSummary(card: Card): string {
  if (card.type === "basic") return card.front;
  if (card.type === "cloze") return card.text;
  return card.question;
}

const TYPE_LABELS: Record<CardType, string> = {
  basic: "Basic",
  cloze: "Cloze",
  mcq: "MCQ",
};

const TYPE_COLORS: Record<CardType, string> = {
  basic: "bg-blue-100 text-blue-700",
  cloze: "bg-purple-100 text-purple-700",
  mcq: "bg-amber-100 text-amber-700",
};

export default function BrowsePage() {
  const { deckId } = useParams<{ deckId: string }>();
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [filter, setFilter] = useState<CardType | "all">("all");
  const [page, setPage] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    loadDeck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  function loadDeck() {
    const data = getDecks();
    const d = data.decks.find((d) => d.id === deckId);
    if (!d) { router.push("/"); return; }
    setDeck(d);
    setPage(0);
  }

  function deleteCard(cardId: string) {
    const data = getDecks();
    const d = data.decks.find((d) => d.id === deckId);
    if (!d) return;
    d.cards = d.cards.filter((c) => c.id !== cardId);
    saveDecks(data);
    setDeleteTarget(null);
    loadDeck();
    toast.success("Card deleted");
  }

  if (!deck) return null;

  const filtered =
    filter === "all" ? deck.cards : deck.cards.filter((c) => c.type === filter);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-800">
            ←
          </Link>
          <h1 className="text-xl font-bold">{deck.name}</h1>
          <span className="text-sm text-gray-400">({deck.cards.length})</span>
        </div>
        <Link
          href={`/card/new?deckId=${deckId}`}
          className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Add card
        </Link>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "basic", "cloze", "mcq"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setFilter(t); setPage(0); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === t
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t === "all" ? "All" : TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Card list */}
      {paginated.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <p>No cards yet.</p>
          <Link
            href={`/card/new?deckId=${deckId}`}
            className="mt-3 inline-block text-sm text-indigo-600 hover:underline"
          >
            Add your first card
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {paginated.map((card) => (
            <div
              key={card.id}
              className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[card.type]}`}
              >
                {TYPE_LABELS[card.type]}
              </span>
              <p className="flex-1 truncate text-sm text-gray-700">
                {cardSummary(card)}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/card/${card.id}/edit?deckId=${deckId}`)}
                  className="text-xs text-gray-400 hover:text-indigo-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteTarget(card.id)}
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            ←
          </button>
          <span className="text-sm text-gray-500">
            {page + 1} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            →
          </button>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete card?"
          description="This card will be permanently removed from the deck."
          onConfirm={() => deleteCard(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
