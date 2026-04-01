"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getDecks, saveDecks, getProgress, getTodayKey, getSettings } from "@/lib/storage";
import { isDue } from "@/lib/sm2";
import { AI_PROMPT } from "@/lib/ai-prompt";
import { seedIfEmpty } from "@/lib/seed";
import type { Deck, DecksData } from "@/lib/types";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function HomeClient() {
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [dueCounts, setDueCounts] = useState<Record<string, number>>({});
  const [newDeckName, setNewDeckName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showImportForm, setShowImportForm] = useState(false);
  const [importText, setImportText] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    seedIfEmpty();
    loadDecks();
  }, []);

  function loadDecks() {
    const data = getDecks();
    setDecks(data.decks);

    const progress = getProgress();
    const settings = getSettings();
    const today = getTodayKey();
    const counts: Record<string, number> = {};

    for (const deck of data.decks) {
      let due = 0;
      for (const card of deck.cards) {
        const p = progress[card.id];
        if (!p) {
          // New card — count it as due if below daily limit
          const introduced = settings.dailyNewCards[today]?.[deck.id] ?? 0;
          if (introduced < deck.newCardsPerDay) due++;
        } else if (isDue(p)) {
          due++;
        }
      }
      counts[deck.id] = due;
    }
    setDueCounts(counts);
  }

  function createDeck(e: React.FormEvent) {
    e.preventDefault();
    const name = newDeckName.trim();
    if (!name) return;
    const data = getDecks();
    const newDeck: Deck = {
      id: crypto.randomUUID(),
      name,
      newCardsPerDay: 20,
      createdAt: new Date().toISOString(),
      cards: [],
    };
    data.decks.push(newDeck);
    saveDecks(data);
    setNewDeckName("");
    setShowCreateForm(false);
    loadDecks();
    toast.success("Deck created");
  }

  function deleteDeck(deckId: string) {
    const data = getDecks();
    data.decks = data.decks.filter((d) => d.id !== deckId);
    saveDecks(data);
    setDeleteTarget(null);
    loadDecks();
    toast.success("Deck deleted");
  }

  function exportAll() {
    const data = getDecks();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `srs-export-${getTodayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export complete");
  }

  function processImport(importedData: unknown) {
    const imported = importedData as DecksData;
    if (!imported || !Array.isArray(imported.decks)) throw new Error("Invalid format");

    const existing = getDecks();
    const existingIds = new Set(existing.decks.map((d) => d.id));

    for (const deck of imported.decks) {
      // Reassign UUIDs to avoid collisions
      const newDeckId = crypto.randomUUID();
      const renamedCards = deck.cards.map((c) => ({
        ...c,
        id: crypto.randomUUID(),
      }));
      existing.decks.push({
        ...deck,
        id: newDeckId,
        cards: renamedCards,
      });
      void existingIds; // suppress lint
    }

    saveDecks(existing);
    loadDecks();
    toast.success(`Imported ${imported.decks.length} deck(s)`);
  }

  function handleTextImport() {
    try {
      if (!importText.trim()) throw new Error("Empty text");
      const parsed = JSON.parse(importText);
      processImport(parsed);
      setImportText("");
      setShowImportForm(false);
    } catch {
      toast.error("Import failed — invalid JSON format");
    }
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        processImport(parsed);
        setShowImportForm(false);
      } catch {
        toast.error("Import failed — invalid JSON format");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function copyAiPrompt() {
    navigator.clipboard.writeText(AI_PROMPT).then(() => {
      toast.success("AI prompt copied to clipboard");
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">FlashSRS</h1>
        <div className="flex gap-2">
          <button
            onClick={copyAiPrompt}
            className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100"
          >
            Copy AI Prompt
          </button>
          <button
            onClick={() => setShowImportForm(!showImportForm)}
            className={`rounded-xl border px-3 py-2 text-xs font-medium hover:bg-gray-100 ${
              showImportForm
                ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                : "border-gray-200 text-gray-600"
            }`}
          >
            Import
          </button>
          <button
            onClick={exportAll}
            className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100"
          >
            Export
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      </div>

      {/* Import form */}
      {showImportForm && (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Paste JSON data
          </label>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='{"decks": [...]}'
            className="mb-3 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 min-h-[120px] resize-y"
          />
          <div className="flex gap-2 items-center justify-between">
            <button
              onClick={() => setShowImportForm(false)}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => importRef.current?.click()}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 flex flex-row items-center gap-1.5 hover:bg-gray-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" x2="12" y1="3" y2="15"/>
                </svg>
                Upload File
              </button>
              <button
                onClick={handleTextImport}
                disabled={!importText.trim()}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Import Text
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deck list */}
      {decks.length === 0 && !showCreateForm && (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center text-gray-400">
          <p className="text-4xl">🃏</p>
          <p className="mt-3 font-medium">No decks yet</p>
          <p className="mt-1 text-sm">Create a deck to get started</p>
        </div>
      )}

      <div className="space-y-3">
        {decks.map((deck) => {
          const due = dueCounts[deck.id] ?? 0;
          return (
            <div
              key={deck.id}
              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{deck.name}</h2>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {deck.cards.length} cards
                    {due > 0 && (
                      <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                        {due} due
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      router.push(`/deck/${deck.id}/edit`)
                    }
                    className="rounded-lg px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(deck.id)}
                    className="rounded-lg px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => router.push(`/deck/${deck.id}/study`)}
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Study {due > 0 ? `(${due} due)` : ""}
                </button>
                <button
                  onClick={() => router.push(`/deck/${deck.id}/browse`)}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Browse
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create deck */}
      {showCreateForm ? (
        <form
          onSubmit={createDeck}
          className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Deck name
          </label>
          <input
            autoFocus
            value={newDeckName}
            onChange={(e) => setNewDeckName(e.target.value)}
            placeholder="e.g. CBT Theory"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Create
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full rounded-2xl border-2 border-dashed border-indigo-200 py-4 text-sm font-medium text-indigo-500 hover:border-indigo-400 hover:bg-indigo-50"
        >
          + New Deck
        </button>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete deck?"
          description="This will permanently delete the deck and all its cards. This cannot be undone."
          onConfirm={() => deleteDeck(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
