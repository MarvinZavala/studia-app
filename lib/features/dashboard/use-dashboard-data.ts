import { useCallback, useState } from "react";
import {
  countCompletedTasksSince,
  getBudgetSettings,
  getProfileDisplayName,
  getStreak,
  listExpenseAmountsSince,
  listIncompleteTasksForUser,
  listRecentStudySessions,
  listStudySessionsSince,
  markTaskCompleted,
} from "@/lib/data/studia-api";
import { getLocalISODate, getStartOfWeek } from "@/lib/utils/date";
import type { Task, StudySession } from "@/lib/types/database";

export interface DashboardData {
  tasksDueToday: number;
  tasksCompleted: number;
  totalTasks: number;
  studyStreak: number;
  budgetSpent: number;
  weeklyBudget: number;
  weeklyStudyMinutes: number;
  todayStudyMinutes: number;
}

const EMPTY_DASHBOARD_DATA: DashboardData = {
  tasksDueToday: 0,
  tasksCompleted: 0,
  totalTasks: 0,
  studyStreak: 0,
  budgetSpent: 0,
  weeklyBudget: 0,
  weeklyStudyMinutes: 0,
  todayStudyMinutes: 0,
};

export function useDashboardData(userId?: string) {
  const [displayName, setDisplayName] = useState("Student");
  const [data, setData] = useState<DashboardData>(EMPTY_DASHBOARD_DATA);
  const [recentSessions, setRecentSessions] = useState<StudySession[]>([]);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);

  const resetState = useCallback(() => {
    setDisplayName("Student");
    setData(EMPTY_DASHBOARD_DATA);
    setRecentSessions([]);
    setTodayTasks([]);
  }, []);

  const loadData = useCallback(async () => {
    if (!userId) {
      resetState();
      return;
    }

    const today = getLocalISODate();
    const now = new Date();
    const weekStart = getStartOfWeek(now);
    const weekStartStr = getLocalISODate(weekStart);

    try {
      const [
        profileName,
        pendingTasks,
        completedCount,
        streak,
        settings,
        weekExpenseAmounts,
        sessions,
        recentData,
      ] = await Promise.all([
        getProfileDisplayName(userId),
        listIncompleteTasksForUser(userId),
        countCompletedTasksSince(userId, weekStart.toISOString()),
        getStreak(userId),
        getBudgetSettings(userId),
        listExpenseAmountsSince(userId, weekStartStr),
        listStudySessionsSince(userId, weekStart.toISOString()),
        listRecentStudySessions(userId, 3),
      ]);

      setDisplayName(profileName ?? "Student");

      const dueToday = pendingTasks.filter(
        (task) => task.planned_date === today || task.deadline === today
      );
      setTodayTasks(dueToday.slice(0, 5));

      const weekExpenses = weekExpenseAmounts.reduce(
        (sum, amount) => sum + amount,
        0
      );
      const weeklyMins = sessions.reduce(
        (sum, session) => sum + (session.duration_minutes ?? 0),
        0
      );

      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayMins = sessions
        .filter((session) => new Date(session.started_at) >= todayStart)
        .reduce((sum, session) => sum + (session.duration_minutes ?? 0), 0);

      setData({
        tasksDueToday: dueToday.length,
        tasksCompleted: completedCount,
        totalTasks: pendingTasks.length + completedCount,
        studyStreak: streak?.current_streak ?? 0,
        budgetSpent: weekExpenses,
        weeklyBudget: settings?.weekly_budget ?? 0,
        weeklyStudyMinutes: weeklyMins,
        todayStudyMinutes: todayMins,
      });
      setRecentSessions(recentData);
    } catch {
      resetState();
    }
  }, [userId, resetState]);

  const completeTask = useCallback(
    async (taskId: string): Promise<boolean> => {
      if (!userId) return false;

      try {
        await markTaskCompleted(userId, taskId);
      } catch {
        return false;
      }

      setTodayTasks((prev) => prev.filter((task) => task.id !== taskId));
      setData((prev) => ({
        ...prev,
        tasksDueToday: Math.max(0, prev.tasksDueToday - 1),
        tasksCompleted: prev.tasksCompleted + 1,
      }));
      return true;
    },
    [userId]
  );

  return {
    displayName,
    data,
    recentSessions,
    todayTasks,
    loadData,
    completeTask,
  };
}
