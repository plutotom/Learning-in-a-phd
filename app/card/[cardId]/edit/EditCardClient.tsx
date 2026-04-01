"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getDecks, saveDecks } from "@/lib/storage";
import type { Card, CardInput } from "@/lib/types";
import CardForm from "@/components/CardForm";
import Link from "next/link";

export default function EditCardClient() {
  const { cardId } = useParams<{ cardId: string }>();
  const searchParams = useSearchParams();
  const deckId = searchParams.get("deckId") ?? "";
  const router = useRouter();
  const [card, setCard] = useState<Card | null>(null);

  useEffect(() => {
    const data = getDecks();
    for (const deck of data.decks) {
      const c = deck.cards.find((c) => c.id === cardId);
      if (c) { setCard(c); return; }
    }
    router.push("/");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId]);

  function handleSave(partial: CardInput) {
    if (!card) return;
    const data = getDecks();
    for (const deck of data.decks) {
      const idx = deck.cards.findIndex((c) => c.id === cardId);
      if (idx !== -1) {
        deck.cards[idx] = {
          ...partial,
          id: card.id,
          createdAt: card.createdAt,
        } as Card;
        saveDecks(data);
        toast.success("Card updated");
        router.push(deckId ? `/deck/${deckId}/browse` : "/");
        return;
      }
    }
    toast.error("Card not found");
  }

  if (!card) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href={deckId ? `/deck/${deckId}/browse` : "/"}
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          ←
        </Link>
        <h1 className="text-xl font-bold">Edit Card</h1>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <CardForm
          initialCard={card}
          onSave={handleSave}
          onCancel={() => router.push(deckId ? `/deck/${deckId}/browse` : "/")}
        />
      </div>
    </div>
  );
}
