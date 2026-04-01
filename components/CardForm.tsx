"use client";

import { useState } from "react";
import type { Card, CardInput, CardType } from "@/lib/types";

interface Props {
  initialCard?: Card;
  onSave: (card: CardInput) => void;
  onCancel: () => void;
}

export default function CardForm({ initialCard, onSave, onCancel }: Props) {
  const [type, setType] = useState<CardType>(initialCard?.type ?? "basic");

  // Basic
  const [front, setFront] = useState(
    initialCard?.type === "basic" ? initialCard.front : ""
  );
  const [back, setBack] = useState(
    initialCard?.type === "basic" ? initialCard.back : ""
  );

  // Cloze
  const [clozeText, setClozeText] = useState(
    initialCard?.type === "cloze" ? initialCard.text : ""
  );

  // MCQ
  const [question, setQuestion] = useState(
    initialCard?.type === "mcq" ? initialCard.question : ""
  );
  const [options, setOptions] = useState<string[]>(
    initialCard?.type === "mcq" ? initialCard.options : ["", "", "", ""]
  );
  const [answer, setAnswer] = useState<number>(
    initialCard?.type === "mcq" ? initialCard.answer : 0
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (type === "basic") {
      onSave({ type: "basic", front: front.trim(), back: back.trim() });
    } else if (type === "cloze") {
      onSave({ type: "cloze", text: clozeText.trim() });
    } else {
      const filtered = options.filter((o) => o.trim());
      onSave({
        type: "mcq",
        question: question.trim(),
        options: filtered,
        answer,
      });
    }
  }

  function addOption() {
    if (options.length < 6) setOptions([...options, ""]);
  }

  function removeOption(i: number) {
    const next = options.filter((_, idx) => idx !== i);
    setOptions(next);
    if (answer >= next.length) setAnswer(next.length - 1);
  }

  function updateOption(i: number, val: string) {
    setOptions(options.map((o, idx) => (idx === i ? val : o)));
  }

  const tabClass = (t: CardType) =>
    `flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
      type === t
        ? "bg-indigo-600 text-white"
        : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Type selector */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
        <button type="button" className={tabClass("basic")} onClick={() => setType("basic")}>
          Basic
        </button>
        <button type="button" className={tabClass("cloze")} onClick={() => setType("cloze")}>
          Cloze
        </button>
        <button type="button" className={tabClass("mcq")} onClick={() => setType("mcq")}>
          MCQ
        </button>
      </div>

      {/* Basic fields */}
      {type === "basic" && (
        <>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Front
            </label>
            <textarea
              required
              value={front}
              onChange={(e) => setFront(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Back
            </label>
            <textarea
              required
              value={back}
              onChange={(e) => setBack(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </>
      )}

      {/* Cloze fields */}
      {type === "cloze" && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Text
          </label>
          <textarea
            required
            value={clozeText}
            onChange={(e) => setClozeText(e.target.value)}
            rows={4}
            placeholder="The {{amygdala}} is central to fear processing"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <p className="mt-1.5 text-xs text-gray-400">
            Wrap blanks in {`{{double curly braces}}`}
          </p>
        </div>
      )}

      {/* MCQ fields */}
      {type === "mcq" && (
        <>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Question
            </label>
            <textarea
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Options — select the correct answer
            </label>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="answer"
                  checked={answer === i}
                  onChange={() => setAnswer(i)}
                  className="accent-indigo-600"
                />
                <input
                  required
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {options.length < 6 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-1 text-sm text-indigo-600 hover:underline"
              >
                + Add option
              </button>
            )}
          </div>
        </>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Save Card
        </button>
      </div>
    </form>
  );
}
