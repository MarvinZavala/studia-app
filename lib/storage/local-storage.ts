import "expo-sqlite/localStorage/install";
import { randomUUID } from "expo-crypto";
import type {
  Task,
  StudySession,
  Flashcard,
  QuizQuestion,
  WellnessLog,
  BudgetEntry,
  BudgetSettings,
  Streak,
} from "@/lib/types/database";

export const LOCAL_USER_ID = "local-user";

type WithId = { id: string };

class LocalDB<T extends WithId> {
  constructor(private key: string) {}

  private readAll(): T[] {
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? (JSON.parse(raw) as T[]) : [];
    } catch {
      console.error(`[LocalDB] Failed to parse key "${this.key}"`);
      return [];
    }
  }

  private writeAll(items: T[]): void {
    localStorage.setItem(this.key, JSON.stringify(items));
  }

  getAll(): T[] {
    return this.readAll();
  }

  getById(id: string): T | null {
    return this.readAll().find((item) => item.id === id) ?? null;
  }

  create(
    data: Omit<T, "id" | "created_at" | "user_id" | "updated_at">,
    overrides?: Partial<T>,
  ): T {
    const now = new Date().toISOString();
    const item = {
      ...data,
      id: randomUUID(),
      user_id: LOCAL_USER_ID,
      created_at: now,
      updated_at: now,
      ...overrides,
    } as unknown as T;

    const items = this.readAll();
    items.push(item);
    this.writeAll(items);
    return item;
  }

  update(id: string, updates: Partial<T>): T | null {
    const items = this.readAll();
    const idx = items.findIndex((item) => item.id === id);
    if (idx === -1) return null;

    const updated = {
      ...items[idx],
      ...updates,
      id,
      updated_at: new Date().toISOString(),
    } as T;

    items[idx] = updated;
    this.writeAll(items);
    return updated;
  }

  delete(id: string): boolean {
    const items = this.readAll();
    const filtered = items.filter((item) => item.id !== id);
    if (filtered.length === items.length) return false;
    this.writeAll(filtered);
    return true;
  }

  query(filter: (item: T) => boolean): T[] {
    return this.readAll().filter(filter);
  }

  replaceAll(items: T[]): void {
    this.writeAll(items);
  }

  clear(): void {
    localStorage.removeItem(this.key);
  }
}

export const tasksDB = new LocalDB<Task>("studentos_tasks");
export const studySessionsDB = new LocalDB<StudySession>(
  "studentos_study_sessions",
);
export const flashcardsDB = new LocalDB<Flashcard>("studentos_flashcards");
export const quizQuestionsDB = new LocalDB<QuizQuestion>(
  "studentos_quiz_questions",
);
export const wellnessLogsDB = new LocalDB<WellnessLog>(
  "studentos_wellness_logs",
);
export const budgetEntriesDB = new LocalDB<BudgetEntry>(
  "studentos_budget_entries",
);
export const budgetSettingsDB = new LocalDB<BudgetSettings>(
  "studentos_budget_settings",
);
export const streaksDB = new LocalDB<Streak>("studentos_streaks");

export { LocalDB };
