import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
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

// Generic hook for any studia table
function useStudiaTable<T extends { id: string }>(table: string) {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async (orderBy?: string, ascending = false) => {
    if (!user) return [];
    setLoading(true);
    let query = supabase.from(table).select("*");
    if (orderBy) query = query.order(orderBy, { ascending });
    const { data: rows, error } = await query;
    if (error) { console.error(`[${table}] fetch error:`, error.message); setLoading(false); return []; }
    setData((rows ?? []) as T[]);
    setLoading(false);
    return (rows ?? []) as T[];
  }, [user, table]);

  const create = useCallback(async (record: Partial<T>) => {
    if (!user) return null;
    const { data: row, error } = await supabase
      .from(table)
      .insert({ ...record, user_id: user.id })
      .select()
      .single();
    if (error) { console.error(`[${table}] insert error:`, error.message); return null; }
    return row as T;
  }, [user, table]);

  const update = useCallback(async (id: string, updates: Partial<T>) => {
    if (!user) return null;
    const { data: row, error } = await supabase
      .from(table)
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) { console.error(`[${table}] update error:`, error.message); return null; }
    return row as T;
  }, [user, table]);

  const remove = useCallback(async (id: string) => {
    if (!user) return false;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) { console.error(`[${table}] delete error:`, error.message); return false; }
    return true;
  }, [user, table]);

  return { data, loading, fetchAll, create, update, remove, setData };
}

// Specific typed hooks
export function useTasks() { return useStudiaTable<Task>("studia_tasks"); }
export function useStudySessions() { return useStudiaTable<StudySession>("studia_study_sessions"); }
export function useFlashcards() { return useStudiaTable<Flashcard>("studia_flashcards"); }
export function useQuizQuestions() { return useStudiaTable<QuizQuestion>("studia_quiz_questions"); }
export function useWellnessLogs() { return useStudiaTable<WellnessLog>("studia_wellness_logs"); }
export function useBudgetEntries() { return useStudiaTable<BudgetEntry>("studia_budget_entries"); }

// Singleton hooks (one row per user)
export function useBudgetSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<BudgetSettings | null>(null);

  const fetch = useCallback(async () => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("studia_budget_settings")
      .select("*")
      .single();
    if (error && error.code !== "PGRST116") console.error("[budget_settings]", error.message);
    setSettings(data as BudgetSettings | null);
    return data as BudgetSettings | null;
  }, [user]);

  const updateBudget = useCallback(async (weeklyBudget: number) => {
    if (!user) return;
    await supabase
      .from("studia_budget_settings")
      .update({ weekly_budget: weeklyBudget, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
    setSettings((prev) => prev ? { ...prev, weekly_budget: weeklyBudget } : prev);
  }, [user]);

  return { settings, fetch, updateBudget };
}

export function useStreak() {
  const { user } = useAuth();
  const [streak, setStreak] = useState<Streak | null>(null);

  const fetch = useCallback(async () => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("studia_streaks")
      .select("*")
      .single();
    if (error && error.code !== "PGRST116") console.error("[streaks]", error.message);
    setStreak(data as Streak | null);
    return data as Streak | null;
  }, [user]);

  const updateStreak = useCallback(async (current: number, longest: number) => {
    if (!user) return;
    await supabase
      .from("studia_streaks")
      .update({
        current_streak: current,
        longest_streak: longest,
        last_active: new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);
    setStreak((prev) => prev ? { ...prev, current_streak: current, longest_streak: longest } : prev);
  }, [user]);

  return { streak, fetch, updateStreak };
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);

  const fetch = useCallback(async () => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("studia_profiles")
      .select("*")
      .single();
    if (error) console.error("[profile]", error.message);
    setProfile(data);
    return data;
  }, [user]);

  return { profile, fetch };
}
