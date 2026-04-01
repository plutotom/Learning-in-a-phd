"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getDecks, saveDecks } from "@/lib/storage";
import type { Card, CardInput } from "@/lib/types";
import CardForm from "@/components/CardForm";
import Link from "next/link";

export default function NewCardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deckId = searchParams.get("deckId") ?? "";

  function handleSave(partial: CardInput) {
    const data = getDecks();
    const deck = data.decks.find((d) => d.id === deckId);
    if (!deck) { toast.error("Deck not found"); return; }

    const card: Card = {
      ...partial,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    } as Card;

    deck.cards.push(card);
    saveDecks(data);
    toast.success("Card saved");
    router.push(`/deck/${deckId}/browse`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href={deckId ? `/deck/${deckId}/browse` : "/"}
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          ←
        </Link>
        <h1 className="text-xl font-bold">New Card</h1>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <CardForm
          onSave={handleSave}
          onCancel={() => router.push(deckId ? `/deck/${deckId}/browse` : "/")}
        />
      </div>
    </div>
  );
}
