"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { getDecks, saveDecks } from "@/lib/storage";
import type { Deck } from "@/lib/types";
import ConfirmDialog from "@/components/ConfirmDialog";
import Link from "next/link";

export default function EditDeckPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [name, setName] = useState("");
  const [newCardsPerDay, setNewCardsPerDay] = useState(20);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    const data = getDecks();
    const d = data.decks.find((d) => d.id === deckId);
    if (!d) { router.push("/"); return; }
    setDeck(d);
    setName(d.name);
    setNewCardsPerDay(d.newCardsPerDay);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const data = getDecks();
    const d = data.decks.find((d) => d.id === deckId);
    if (!d) return;
    d.name = name.trim();
    d.newCardsPerDay = newCardsPerDay;
    saveDecks(data);
    toast.success("Deck updated");
    router.push("/");
  }

  function handleDelete() {
    const data = getDecks();
    data.decks = data.decks.filter((d) => d.id !== deckId);
    saveDecks(data);
    toast.success("Deck deleted");
    router.push("/");
  }

  if (!deck) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-800">
          ←
        </Link>
        <h1 className="text-xl font-bold">Edit Deck</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Deck name
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            New cards per day
          </label>
          <input
            type="number"
            min={1}
            max={200}
            value={newCardsPerDay}
            onChange={(e) => setNewCardsPerDay(Number(e.target.value))}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Save changes
        </button>
      </form>

      <div className="rounded-2xl border border-red-100 bg-white p-5">
        <h2 className="text-sm font-semibold text-red-600">Danger zone</h2>
        <p className="mt-1 text-sm text-gray-500">
          Permanently delete this deck and all its cards.
        </p>
        <button
          onClick={() => setShowDelete(true)}
          className="mt-3 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50"
        >
          Delete deck
        </button>
      </div>

      {showDelete && (
        <ConfirmDialog
          title="Delete deck?"
          description={`This will permanently delete "${deck.name}" and all its cards.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  );
}
