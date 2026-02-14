export type Priority = "high" | "medium" | "low";
export type TaskStatus = "pending" | "in_progress" | "completed";
export type WellnessMode = "normal" | "light";
export type EntryType = "income" | "expense";
export type BudgetCategory = "food" | "school" | "transport" | "entertainment" | "other";

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  priority: Priority;
  estimated_hours: number | null;
  status: TaskStatus;
  course: string | null;
  planned_date: string | null;
  source_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  task_id: string | null;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
}

export interface Flashcard {
  id: string;
  user_id: string;
  topic: string;
  question: string;
  answer: string;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  user_id: string;
  topic: string;
  question: string;
  options: string[];
  correct_index: number;
  created_at: string;
}

export interface WellnessLog {
  id: string;
  user_id: string;
  date: string;
  stress: number;
  sleep_hours: number;
  energy: number;
  score: number;
  mode: WellnessMode;
  created_at: string;
}

export interface BudgetEntry {
  id: string;
  user_id: string;
  amount: number;
  category: BudgetCategory;
  description: string | null;
  entry_type: EntryType;
  date: string;
  created_at: string;
}

export interface BudgetSettings {
  id: string;
  user_id: string;
  weekly_budget: number;
  updated_at: string;
}

export interface Streak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_active: string | null;
  updated_at: string;
}
