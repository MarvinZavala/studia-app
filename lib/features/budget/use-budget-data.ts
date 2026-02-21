import { useCallback, useMemo, useState } from "react";
import type { BudgetCategory, BudgetEntry } from "@/lib/types/database";
import {
  deleteBudgetExpense,
  getBudgetSettings,
  listExpenseEntriesForUser,
} from "@/lib/data/studia-api";

interface CategoryTotals {
  food: number;
  school: number;
  transport: number;
  entertainment: number;
  other: number;
}

const EMPTY_CATEGORY_TOTALS: CategoryTotals = {
  food: 0,
  school: 0,
  transport: 0,
  entertainment: 0,
  other: 0,
};

export function useBudgetData(userId?: string) {
  const [weeklyBudget, setWeeklyBudget] = useState(100);
  const [expenses, setExpenses] = useState<BudgetEntry[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [categoryTotals, setCategoryTotals] =
    useState<CategoryTotals>(EMPTY_CATEGORY_TOTALS);

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      const [settings, expenseEntries] = await Promise.all([
        getBudgetSettings(userId),
        listExpenseEntriesForUser(userId),
      ]);

      if (settings) setWeeklyBudget(settings.weekly_budget);
      setExpenses(expenseEntries);

      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const thisWeekExpenses = expenseEntries.filter(
        (entry) => new Date(entry.date) >= weekStart
      );

      const spent = thisWeekExpenses.reduce(
        (sum, entry) => sum + Number(entry.amount),
        0
      );
      setTotalSpent(spent);

      const totals: CategoryTotals = { ...EMPTY_CATEGORY_TOTALS };
      for (const entry of thisWeekExpenses) {
        totals[entry.category] += Number(entry.amount);
      }
      setCategoryTotals(totals);
    } catch {
      setExpenses([]);
      setTotalSpent(0);
      setCategoryTotals(EMPTY_CATEGORY_TOTALS);
    }
  }, [userId]);

  const removeExpense = useCallback(
    async (entryId: string): Promise<boolean> => {
      if (!userId) return false;
      try {
        await deleteBudgetExpense(userId, entryId);
        await loadData();
        return true;
      } catch {
        return false;
      }
    },
    [loadData, userId]
  );

  const activeCategories = useMemo(
    () =>
      (Object.keys(categoryTotals) as BudgetCategory[]).filter(
        (category) => categoryTotals[category] > 0
      ),
    [categoryTotals]
  );

  return {
    weeklyBudget,
    expenses,
    totalSpent,
    categoryTotals,
    activeCategories,
    loadData,
    removeExpense,
  };
}
