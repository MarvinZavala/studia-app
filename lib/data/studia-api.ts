import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getLocalISODate } from "@/lib/utils/date";
import type {
  BudgetCategory,
  BudgetEntry,
  BudgetSettings,
  Priority,
  StudySession,
  Streak,
  Task,
  WellnessLog,
  WellnessMode,
} from "@/lib/types/database";

const TASK_COLUMNS =
  "id,user_id,title,description,deadline,priority,estimated_hours,status,course,planned_date,source_text,created_at,updated_at";
const STUDY_SESSION_COLUMNS =
  "id,user_id,task_id,started_at,ended_at,duration_minutes,notes,created_at";
const WELLNESS_LOG_COLUMNS =
  "id,user_id,date,stress,sleep_hours,energy,score,mode,created_at";
const BUDGET_ENTRY_COLUMNS =
  "id,user_id,amount,category,description,entry_type,date,created_at";
const STREAK_COLUMNS =
  "id,user_id,current_streak,longest_streak,last_active,updated_at";
const BUDGET_SETTINGS_COLUMNS = "id,user_id,weekly_budget,updated_at";

function toError(error: PostgrestError | null, fallback: string): Error {
  if (!error) return new Error(fallback);
  return new Error(error.message || fallback);
}

export interface CreateBudgetExpenseInput {
  amount: number;
  category: BudgetCategory;
  description: string | null;
  date: string;
}

export interface CreateParsedTaskInput {
  title: string;
  deadline: string | null;
  priority: Priority;
  estimated_hours: number;
  course: string | null;
}

export interface CreateWellnessLogInput {
  date: string;
  stress: number;
  sleep_hours: number;
  energy: number;
  score: number;
  mode: WellnessMode;
}

export interface CreateStudySessionInput {
  started_at: string;
  ended_at: string | null;
  duration_minutes: number;
  notes?: string | null;
  task_id?: string | null;
}

export async function getProfileDisplayName(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("studia_profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw toError(error, "Could not load profile");
  return data?.display_name ?? null;
}

export async function updateProfileDisplayName(
  userId: string,
  displayName: string
): Promise<void> {
  const { error } = await supabase
    .from("studia_profiles")
    .update({ display_name: displayName })
    .eq("id", userId);

  if (error) throw toError(error, "Could not update display name");
}

export async function getBudgetSettings(
  userId: string
): Promise<BudgetSettings | null> {
  const { data, error } = await supabase
    .from("studia_budget_settings")
    .select(BUDGET_SETTINGS_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw toError(error, "Could not load budget settings");
  return (data as BudgetSettings | null) ?? null;
}

export async function upsertWeeklyBudget(
  userId: string,
  weeklyBudget: number
): Promise<void> {
  const { error } = await supabase
    .from("studia_budget_settings")
    .upsert({ user_id: userId, weekly_budget: weeklyBudget });

  if (error) throw toError(error, "Could not save weekly budget");
}

export async function listTasksForUser(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("studia_tasks")
    .select(TASK_COLUMNS)
    .eq("user_id", userId);

  if (error) throw toError(error, "Could not load tasks");
  return (data as Task[]) ?? [];
}

export async function listIncompleteTasksForUser(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("studia_tasks")
    .select(TASK_COLUMNS)
    .eq("user_id", userId)
    .neq("status", "completed");

  if (error) throw toError(error, "Could not load active tasks");
  return (data as Task[]) ?? [];
}

export async function countCompletedTasksSince(
  userId: string,
  sinceIso: string
): Promise<number> {
  const { data, error } = await supabase
    .from("studia_tasks")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "completed")
    .gte("updated_at", sinceIso);

  if (error) throw toError(error, "Could not load completed tasks");
  return data?.length ?? 0;
}

export async function countCompletedTasks(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("studia_tasks")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "completed");

  if (error) throw toError(error, "Could not load completed tasks");
  return data?.length ?? 0;
}

export async function markTaskCompleted(
  userId: string,
  taskId: string
): Promise<void> {
  const { error } = await supabase
    .from("studia_tasks")
    .update({ status: "completed" })
    .eq("id", taskId)
    .eq("user_id", userId);

  if (error) throw toError(error, "Could not complete task");
}

export async function clearCompletedTasks(userId: string): Promise<void> {
  const { error } = await supabase
    .from("studia_tasks")
    .delete()
    .eq("user_id", userId)
    .eq("status", "completed");

  if (error) throw toError(error, "Could not clear completed tasks");
}

export async function createTasksFromInbox(
  userId: string,
  tasks: CreateParsedTaskInput[],
  sourceText: string
): Promise<void> {
  const rows = tasks.map((task) => ({
    user_id: userId,
    title: task.title,
    description: null,
    deadline: task.deadline,
    priority: task.priority,
    estimated_hours: task.estimated_hours,
    status: "pending" as const,
    course: task.course,
    planned_date: null,
    source_text: sourceText,
  }));

  const { error } = await supabase.from("studia_tasks").insert(rows);
  if (error) throw toError(error, "Could not add tasks to planner");
}

export async function listStudySessionsForUser(
  userId: string
): Promise<StudySession[]> {
  const { data, error } = await supabase
    .from("studia_study_sessions")
    .select(STUDY_SESSION_COLUMNS)
    .eq("user_id", userId)
    .order("started_at", { ascending: false });

  if (error) throw toError(error, "Could not load study sessions");
  return (data as StudySession[]) ?? [];
}

export async function listStudySessionsSince(
  userId: string,
  sinceIso: string
): Promise<StudySession[]> {
  const { data, error } = await supabase
    .from("studia_study_sessions")
    .select(STUDY_SESSION_COLUMNS)
    .eq("user_id", userId)
    .gte("started_at", sinceIso)
    .order("started_at", { ascending: false });

  if (error) throw toError(error, "Could not load weekly sessions");
  return (data as StudySession[]) ?? [];
}

export async function listRecentStudySessions(
  userId: string,
  limit = 3
): Promise<StudySession[]> {
  const { data, error } = await supabase
    .from("studia_study_sessions")
    .select(STUDY_SESSION_COLUMNS)
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) throw toError(error, "Could not load recent sessions");
  return (data as StudySession[]) ?? [];
}

export async function createStudySession(
  userId: string,
  input: CreateStudySessionInput
): Promise<void> {
  const { error } = await supabase.from("studia_study_sessions").insert({
    user_id: userId,
    task_id: input.task_id ?? null,
    started_at: input.started_at,
    ended_at: input.ended_at,
    duration_minutes: input.duration_minutes,
    notes: input.notes ?? null,
  });

  if (error) throw toError(error, "Could not save study session");
}

export async function listWellnessHistory(
  userId: string,
  limit = 7
): Promise<WellnessLog[]> {
  const { data, error } = await supabase
    .from("studia_wellness_logs")
    .select(WELLNESS_LOG_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw toError(error, "Could not load wellness history");
  return (data as WellnessLog[]) ?? [];
}

export async function createWellnessLog(
  userId: string,
  input: CreateWellnessLogInput
): Promise<void> {
  const { error } = await supabase.from("studia_wellness_logs").insert({
    user_id: userId,
    date: input.date,
    stress: input.stress,
    sleep_hours: input.sleep_hours,
    energy: input.energy,
    score: input.score,
    mode: input.mode,
  });

  if (error) throw toError(error, "Could not save wellness check-in");
}

export async function getStreak(userId: string): Promise<Streak | null> {
  const { data, error } = await supabase
    .from("studia_streaks")
    .select(STREAK_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw toError(error, "Could not load streak");
  return (data as Streak | null) ?? null;
}

export async function syncStreakForStudySession(
  userId: string,
  completedAt = new Date()
): Promise<void> {
  const today = getLocalISODate(completedAt);
  const yesterdayDate = new Date(completedAt);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = getLocalISODate(yesterdayDate);

  const existing = await getStreak(userId);

  if (!existing) {
    const { error } = await supabase.from("studia_streaks").insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_active: today,
    });
    if (error) throw toError(error, "Could not initialize streak");
    return;
  }

  if (existing.last_active === today) return;

  const nextCurrent =
    existing.last_active === yesterday ? existing.current_streak + 1 : 1;
  const nextLongest = Math.max(existing.longest_streak, nextCurrent);

  const { error } = await supabase
    .from("studia_streaks")
    .update({
      current_streak: nextCurrent,
      longest_streak: nextLongest,
      last_active: today,
    })
    .eq("user_id", userId);

  if (error) throw toError(error, "Could not update streak");
}

export async function resetCurrentStreak(userId: string): Promise<void> {
  const { error } = await supabase
    .from("studia_streaks")
    .update({ current_streak: 0 })
    .eq("user_id", userId);

  if (error) throw toError(error, "Could not reset streak");
}

export async function listExpenseEntriesForUser(
  userId: string
): Promise<BudgetEntry[]> {
  const { data, error } = await supabase
    .from("studia_budget_entries")
    .select(BUDGET_ENTRY_COLUMNS)
    .eq("user_id", userId)
    .eq("entry_type", "expense")
    .order("date", { ascending: false });

  if (error) throw toError(error, "Could not load expenses");
  return (data as BudgetEntry[]) ?? [];
}

export async function listExpenseAmountsSince(
  userId: string,
  sinceDate: string
): Promise<number[]> {
  const { data, error } = await supabase
    .from("studia_budget_entries")
    .select("amount")
    .eq("user_id", userId)
    .eq("entry_type", "expense")
    .gte("date", sinceDate);

  if (error) throw toError(error, "Could not load expenses");
  return (data ?? []).map((entry) => Number(entry.amount) || 0);
}

export async function createBudgetExpense(
  userId: string,
  input: CreateBudgetExpenseInput
): Promise<void> {
  const { error } = await supabase.from("studia_budget_entries").insert({
    user_id: userId,
    amount: input.amount,
    category: input.category,
    description: input.description,
    entry_type: "expense",
    date: input.date,
  });

  if (error) throw toError(error, "Could not save expense");
}

export async function deleteBudgetExpense(
  userId: string,
  entryId: string
): Promise<void> {
  const { error } = await supabase
    .from("studia_budget_entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", userId);

  if (error) throw toError(error, "Could not delete expense");
}
