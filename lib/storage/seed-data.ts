import "expo-sqlite/localStorage/install";
import { randomUUID } from "expo-crypto";
import type {
  Task,
  StudySession,
  WellnessLog,
  BudgetEntry,
  BudgetSettings,
  Streak,
} from "@/lib/types/database";
import {
  tasksDB,
  studySessionsDB,
  wellnessLogsDB,
  budgetEntriesDB,
  budgetSettingsDB,
  streaksDB,
  LOCAL_USER_ID,
} from "./local-storage";

const uid = () => randomUUID();

function daysFromNow(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().slice(0, 10);
}

function datetimeFromNow(daysOffset: number, hour = 9, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const SEED_FLAG_KEY = "studentos_seeded";

function buildTasks(): Task[] {
  const now = new Date().toISOString();
  return [
    {
      id: uid(),
      user_id: LOCAL_USER_ID,
      title: "Read Chapter 5 \u2014 Intro to Algorithms",
      description: "Cover sorting algorithms: merge sort, quicksort, and heap sort.",
      deadline: daysFromNow(3),
      priority: "high",
      estimated_hours: 3,
      status: "in_progress",
      course: "CS 201",
      planned_date: daysFromNow(0),
      source_text: null,
      created_at: datetimeFromNow(-2),
      updated_at: now,
    },
    {
      id: uid(),
      user_id: LOCAL_USER_ID,
      title: "Submit lab report \u2014 Organic Chemistry",
      description: "Write up observations from last week's esterification experiment.",
      deadline: daysFromNow(1),
      priority: "high",
      estimated_hours: 2,
      status: "pending",
      course: "CHEM 241",
      planned_date: daysFromNow(0),
      source_text: null,
      created_at: datetimeFromNow(-4),
      updated_at: now,
    },
    {
      id: uid(),
      user_id: LOCAL_USER_ID,
      title: "Practice calculus problem set 7",
      description: "Integration by parts, 20 problems.",
      deadline: daysFromNow(5),
      priority: "medium",
      estimated_hours: 1.5,
      status: "pending",
      course: "MATH 152",
      planned_date: daysFromNow(2),
      source_text: null,
      created_at: datetimeFromNow(-1),
      updated_at: now,
    },
    {
      id: uid(),
      user_id: LOCAL_USER_ID,
      title: "Group project slides \u2014 History of Jazz",
      description: "Prepare 8 slides covering bebop era (1940-1960).",
      deadline: daysFromNow(7),
      priority: "medium",
      estimated_hours: 2,
      status: "pending",
      course: "MUS 110",
      planned_date: daysFromNow(4),
      source_text: null,
      created_at: datetimeFromNow(-3),
      updated_at: now,
    },
    {
      id: uid(),
      user_id: LOCAL_USER_ID,
      title: "Review lecture notes \u2014 Microeconomics",
      description: null,
      deadline: null,
      priority: "low",
      estimated_hours: 1,
      status: "pending",
      course: "ECON 101",
      planned_date: daysFromNow(1),
      source_text: null,
      created_at: datetimeFromNow(-1),
      updated_at: now,
    },
    {
      id: uid(),
      user_id: LOCAL_USER_ID,
      title: "Write thesis outline",
      description: "Draft 1-page outline for senior thesis proposal on renewable energy policy.",
      deadline: daysFromNow(14),
      priority: "low",
      estimated_hours: 4,
      status: "completed",
      course: "ENVS 490",
      planned_date: daysFromNow(-1),
      source_text: null,
      created_at: datetimeFromNow(-7),
      updated_at: datetimeFromNow(-1),
    },
  ];
}

function buildStudySessions(): StudySession[] {
  return [
    {
      id: uid(),
      user_id: LOCAL_USER_ID,
      task_id: null,
      started_at: datetimeFromNow(-2, 14, 0),
      ended_at: datetimeFromNow(-2, 15, 30),
      duration_minutes: 90,
      notes: "Covered merge sort and quicksort analysis.",
      created_at: datetimeFromNow(-2, 14, 0),
    },
    {
      id: uid(),
      user_id: LOCAL_USER_ID,
      task_id: null,
      started_at: datetimeFromNow(-1, 10, 0),
      ended_at: datetimeFromNow(-1, 11, 15),
      duration_minutes: 75,
      notes: "Finished esterification write-up draft.",
      created_at: datetimeFromNow(-1, 10, 0),
    },
    {
      id: uid(),
      user_id: LOCAL_USER_ID,
      task_id: null,
      started_at: datetimeFromNow(0, 9, 0),
      ended_at: datetimeFromNow(0, 10, 0),
      duration_minutes: 60,
      notes: "Morning study session \u2014 calculus warm-up problems.",
      created_at: datetimeFromNow(0, 9, 0),
    },
    {
      id: uid(),
      user_id: LOCAL_USER_ID,
      task_id: null,
      started_at: datetimeFromNow(-3, 16, 0),
      ended_at: datetimeFromNow(-3, 17, 45),
      duration_minutes: 105,
      notes: "Thesis outline brainstorm and research.",
      created_at: datetimeFromNow(-3, 16, 0),
    },
  ];
}

function buildWellnessLogs(): WellnessLog[] {
  return [
    {
      id: uid(),
      user_id: LOCAL_USER_ID,
      date: daysFromNow(-1),
      stress: 4,
      sleep_hours: 7.5,
      energy: 7,
      score: 75,
      mode: "normal",
      created_at: datetimeFromNow(-1, 8, 0),
    },
    {
      id: uid(),
      user_id: LOCAL_USER_ID,
      date: daysFromNow(0),
      stress: 3,
      sleep_hours: 8,
      energy: 8,
      score: 82,
      mode: "normal",
      created_at: datetimeFromNow(0, 8, 0),
    },
  ];
}

function buildBudgetEntries(): BudgetEntry[] {
  return [
    {
      id: uid(),
      user_id: LOCAL_USER_ID,
      amount: 250,
      category: "other",
      description: "Weekly allowance",
      entry_type: "income",
      date: daysFromNow(-6),
      created_at: datetimeFromNow(-6),
    },
    {
      id: uid(),
      user_id: LOCAL_USER_ID,
      amount: 12.5,
      category: "food",
      description: "Lunch at campus cafe",
      entry_type: "expense",
      date: daysFromNow(-5),
      created_at: datetimeFromNow(-5),
    },
    {
      id: uid(),
      user_id: LOCAL_USER_ID,
      amount: 45,
      category: "school",
      description: "Textbook \u2014 Algorithms (used)",
      entry_type: "expense",
      date: daysFromNow(-4),
      created_at: datetimeFromNow(-4),
    },
    {
      id: uid(),
      user_id: LOCAL_USER_ID,
      amount: 8.0,
      category: "transport",
      description: "Bus pass reload",
      entry_type: "expense",
      date: daysFromNow(-3),
      created_at: datetimeFromNow(-3),
    },
    {
      id: uid(),
      user_id: LOCAL_USER_ID,
      amount: 15,
      category: "entertainment",
      description: "Movie night with friends",
      entry_type: "expense",
      date: daysFromNow(-2),
      created_at: datetimeFromNow(-2),
    },
    {
      id: uid(),
      user_id: LOCAL_USER_ID,
      amount: 9.75,
      category: "food",
      description: "Coffee and bagel",
      entry_type: "expense",
      date: daysFromNow(-1),
      created_at: datetimeFromNow(-1),
    },
  ];
}

function buildBudgetSettings(): BudgetSettings[] {
  return [
    {
      id: uid(),
      user_id: LOCAL_USER_ID,
      weekly_budget: 100,
      updated_at: new Date().toISOString(),
    },
  ];
}

function buildStreaks(): Streak[] {
  return [
    {
      id: uid(),
      user_id: LOCAL_USER_ID,
      current_streak: 5,
      longest_streak: 12,
      last_active: daysFromNow(0),
      updated_at: new Date().toISOString(),
    },
  ];
}

export function seedDemoData(force = false): void {
  if (!force && localStorage.getItem(SEED_FLAG_KEY)) {
    return;
  }

  tasksDB.replaceAll(buildTasks());
  studySessionsDB.replaceAll(buildStudySessions());
  wellnessLogsDB.replaceAll(buildWellnessLogs());
  budgetEntriesDB.replaceAll(buildBudgetEntries());
  budgetSettingsDB.replaceAll(buildBudgetSettings());
  streaksDB.replaceAll(buildStreaks());

  localStorage.setItem(SEED_FLAG_KEY, new Date().toISOString());
}

export function clearAllData(): void {
  tasksDB.clear();
  studySessionsDB.clear();
  wellnessLogsDB.clear();
  budgetEntriesDB.clear();
  budgetSettingsDB.clear();
  streaksDB.clear();

  localStorage.removeItem(SEED_FLAG_KEY);
}
