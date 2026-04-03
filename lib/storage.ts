import type { DecksData, ProgressData, SettingsData } from "./types";

const KEYS = {
  decks: "srs_decks",
  progress: "srs_progress",
  settings: "srs_settings",
} as const;

// --- Decks ---

export function getDecks(): DecksData {
  if (typeof window === "undefined") return { decks: [], folders: [] };
  try {
    const raw = localStorage.getItem(KEYS.decks);
    if (!raw) return { decks: [], folders: [] };
    const parsed = JSON.parse(raw);
    return { decks: parsed.decks ?? [], folders: parsed.folders ?? [] };
  } catch {
    return { decks: [], folders: [] };
  }
}

export function saveDecks(data: DecksData): void {
  localStorage.setItem(KEYS.decks, JSON.stringify(data));
}

// --- Progress ---

export function getProgress(): ProgressData {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEYS.progress);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveProgress(data: ProgressData): void {
  localStorage.setItem(KEYS.progress, JSON.stringify(data));
}

// --- Settings ---

export function getSettings(): SettingsData {
  if (typeof window === "undefined") return { dailyNewCards: {} };
  try {
    const raw = localStorage.getItem(KEYS.settings);
    return raw ? JSON.parse(raw) : { dailyNewCards: {} };
  } catch {
    return { dailyNewCards: {} };
  }
}

export function saveSettings(data: SettingsData): void {
  localStorage.setItem(KEYS.settings, JSON.stringify(data));
}

// --- Daily new card helpers ---

export function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getDailyNewCount(deckId: string): number {
  const settings = getSettings();
  const today = getTodayKey();
  return settings.dailyNewCards[today]?.[deckId] ?? 0;
}

export function incrementDailyNewCount(deckId: string): void {
  const settings = getSettings();
  const today = getTodayKey();
  if (!settings.dailyNewCards[today]) settings.dailyNewCards[today] = {};
  settings.dailyNewCards[today][deckId] =
    (settings.dailyNewCards[today][deckId] ?? 0) + 1;
  saveSettings(settings);
}
