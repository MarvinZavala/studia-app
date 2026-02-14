import { useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { useFocusEffect, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import * as Haptics from "expo-haptics";

import { ProgressBar } from "@/components/ui/progress-bar";
import { colors, spacing, radius, font, categoryColors } from "@/lib/theme";
import { supabase } from "@/lib/supabase";
import type { BudgetEntry, BudgetCategory } from "@/lib/types/database";

const CATEGORY_ICONS: Record<BudgetCategory, string> = {
  food: "fork.knife",
  school: "book.closed.fill",
  transport: "bus.fill",
  entertainment: "gamecontroller.fill",
  other: "archivebox.fill",
};

const CATEGORY_LABELS: Record<BudgetCategory, string> = {
  food: "Food",
  school: "School",
  transport: "Transport",
  entertainment: "Entertainment",
  other: "Other",
};

interface GroupedExpenses {
  label: string;
  entries: BudgetEntry[];
}

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function groupByDay(entries: BudgetEntry[]): GroupedExpenses[] {
  const groups: Record<string, BudgetEntry[]> = {};
  for (const entry of entries) {
    const dateKey = entry.date.slice(0, 10);
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(entry);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, items]) => ({
      label: getDateLabel(dateKey),
      entries: items.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    }));
}

export default function BudgetScreen() {
  const router = useRouter();
  const [weeklyBudget, setWeeklyBudget] = useState(100);
  const [expenses, setExpenses] = useState<BudgetEntry[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [categoryTotals, setCategoryTotals] = useState<
    Record<BudgetCategory, number>
  >({
    food: 0,
    school: 0,
    transport: 0,
    entertainment: 0,
    other: 0,
  });

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    const { data: settingsRows } = await supabase
      .from("studia_budget_settings")
      .select("weekly_budget")
      .single();
    if (settingsRows) setWeeklyBudget(settingsRows.weekly_budget);

    const { data: allEntries } = await supabase
      .from("studia_budget_entries")
      .select("*")
      .eq("entry_type", "expense")
      .order("date", { ascending: false });
    const expenseEntries = (allEntries ?? []) as BudgetEntry[];

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const thisWeekExpenses = expenseEntries.filter(
      (e) => new Date(e.date) >= weekStart
    );

    setExpenses(expenseEntries);

    const spent = thisWeekExpenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0
    );
    setTotalSpent(spent);

    const cats: Record<BudgetCategory, number> = {
      food: 0,
      school: 0,
      transport: 0,
      entertainment: 0,
      other: 0,
    };
    for (const e of thisWeekExpenses) {
      cats[e.category] += Number(e.amount);
    }
    setCategoryTotals(cats);
  }

  async function handleDeleteExpense(id: string) {
    if (process.env.EXPO_OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert("Delete Expense", "Remove this expense?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await supabase.from("studia_budget_entries").delete().eq("id", id);
          loadData();
        },
      },
    ]);
  }

  const remaining = weeklyBudget - totalSpent;
  const spentPercentage =
    weeklyBudget > 0 ? Math.min((totalSpent / weeklyBudget) * 100, 100) : 0;
  const isOverBudget = remaining < 0;

  const barColor = isOverBudget
    ? colors.danger
    : spentPercentage > 80
      ? colors.warning
      : colors.primary;

  const grouped = groupByDay(expenses);

  const activeCats = (
    Object.keys(categoryTotals) as BudgetCategory[]
  ).filter((cat) => categoryTotals[cat] > 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: 120,
        }}
      >
        {/* ── Budget Hero ─────────────────────────────────────── */}
        <Animated.View entering={FadeIn.duration(400)}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              borderCurve: "continuous",
              padding: spacing.lg,
              marginTop: spacing.lg,
              marginBottom: spacing.lg,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: spacing.lg,
              }}
            >
              <View>
                <Text
                  style={{
                    ...font.footnote,
                    color: colors.textSecondary,
                    marginBottom: 4,
                  }}
                >
                  Weekly Budget
                </Text>
                <Text
                  selectable
                  style={{
                    fontSize: 34,
                    fontWeight: "700",
                    color: colors.textPrimary,
                    fontVariant: ["tabular-nums"],
                    letterSpacing: 0.4,
                  }}
                >
                  ${weeklyBudget.toFixed(0)}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text
                  style={{
                    ...font.footnote,
                    color: colors.textSecondary,
                    marginBottom: 4,
                  }}
                >
                  Remaining
                </Text>
                <Text
                  selectable
                  style={{
                    ...font.title1,
                    color: isOverBudget ? colors.danger : colors.success,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {isOverBudget ? "-" : ""}${Math.abs(remaining).toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={{ marginBottom: spacing.sm }}>
              <ProgressBar
                value={spentPercentage}
                color={barColor}
                trackColor={colors.surfaceSecondary}
                height={10}
              />
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  ...font.caption1,
                  color: colors.textTertiary,
                  fontVariant: ["tabular-nums"],
                }}
              >
                ${totalSpent.toFixed(2)} spent
              </Text>
              <Text
                style={{
                  ...font.caption1,
                  color: colors.textTertiary,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {spentPercentage.toFixed(0)}%
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Category Breakdown ──────────────────────────────── */}
        {activeCats.length > 0 && (
          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                borderCurve: "continuous",
                padding: spacing.lg,
                marginBottom: spacing.lg,
              }}
            >
              <Text
                style={{
                  ...font.headline,
                  color: colors.textPrimary,
                  marginBottom: spacing.md,
                }}
              >
                Categories
              </Text>

              {/* Stacked bar */}
              <View
                style={{
                  flexDirection: "row",
                  height: 10,
                  borderRadius: 5,
                  overflow: "hidden",
                  backgroundColor: colors.surfaceSecondary,
                  marginBottom: spacing.lg,
                }}
              >
                {activeCats.map((cat) => {
                  const pct =
                    totalSpent > 0
                      ? (categoryTotals[cat] / totalSpent) * 100
                      : 0;
                  return (
                    <View
                      key={cat}
                      style={{
                        width: `${pct}%`,
                        backgroundColor: categoryColors[cat],
                        height: "100%",
                      }}
                    />
                  );
                })}
              </View>

              {(Object.keys(categoryTotals) as BudgetCategory[]).map(
                (cat, index) => {
                  const isLast =
                    index ===
                    Object.keys(categoryTotals).length - 1;
                  return (
                    <View
                      key={cat}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingVertical: spacing.sm + 2,
                        borderBottomWidth: isLast ? 0 : 0.5,
                        borderBottomColor: colors.borderLight,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: spacing.md,
                        }}
                      >
                        <View
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            borderCurve: "continuous",
                            backgroundColor: categoryColors[cat] + "20",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <SymbolView
                            name={CATEGORY_ICONS[cat] as any}
                            size={14}
                            tintColor={categoryColors[cat]}
                          />
                        </View>
                        <Text
                          style={{
                            ...font.subhead,
                            fontWeight: "500",
                            color: colors.textPrimary,
                          }}
                        >
                          {CATEGORY_LABELS[cat]}
                        </Text>
                      </View>
                      <Text
                        selectable
                        style={{
                          ...font.subhead,
                          fontWeight: "600",
                          color: colors.textPrimary,
                          fontVariant: ["tabular-nums"],
                        }}
                      >
                        ${categoryTotals[cat].toFixed(2)}
                      </Text>
                    </View>
                  );
                }
              )}
            </View>
          </Animated.View>
        )}

        {/* ── Expenses ────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(200).duration(300)}>
          <Text
            style={{
              ...font.title3,
              color: colors.textPrimary,
              marginBottom: spacing.md,
            }}
          >
            Expenses
          </Text>

          {grouped.length === 0 && (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                borderCurve: "continuous",
                alignItems: "center",
                paddingVertical: spacing.xxl,
              }}
            >
              <SymbolView
                name="tray"
                size={40}
                tintColor={colors.textTertiary}
              />
              <Text
                style={{
                  ...font.subhead,
                  color: colors.textSecondary,
                  marginTop: spacing.md,
                }}
              >
                No expenses yet
              </Text>
            </View>
          )}

          {grouped.map((group, gi) => (
            <Animated.View
              key={group.label}
              entering={FadeInDown.delay(250 + gi * 60).duration(250)}
              layout={LinearTransition.duration(250)}
            >
              <Text
                style={{
                  ...font.footnote,
                  fontWeight: "600",
                  color: colors.textSecondary,
                  textTransform: "uppercase",
                  marginBottom: spacing.sm,
                  marginTop: gi > 0 ? spacing.lg : 0,
                }}
              >
                {group.label}
              </Text>

              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radius.md,
                  borderCurve: "continuous",
                  overflow: "hidden",
                }}
              >
                {group.entries.map((entry, ei) => {
                  const isLast = ei === group.entries.length - 1;
                  return (
                    <Animated.View
                      key={entry.id}
                      exiting={FadeOut.duration(200)}
                      layout={LinearTransition.duration(250)}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: spacing.md,
                          paddingHorizontal: spacing.lg,
                        }}
                      >
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            borderCurve: "continuous",
                            backgroundColor:
                              categoryColors[entry.category] + "20",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: spacing.md,
                          }}
                        >
                          <SymbolView
                            name={CATEGORY_ICONS[entry.category] as any}
                            size={18}
                            tintColor={categoryColors[entry.category]}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              ...font.subhead,
                              fontWeight: "500",
                              color: colors.textPrimary,
                            }}
                            numberOfLines={1}
                          >
                            {entry.description ??
                              CATEGORY_LABELS[entry.category]}
                          </Text>
                          <Text
                            style={{
                              ...font.caption1,
                              color: colors.textTertiary,
                              marginTop: 2,
                            }}
                          >
                            {CATEGORY_LABELS[entry.category]}
                          </Text>
                        </View>
                        <Text
                          selectable
                          style={{
                            ...font.headline,
                            color: colors.textPrimary,
                            fontVariant: ["tabular-nums"],
                            marginRight: spacing.sm,
                          }}
                        >
                          -${Number(entry.amount).toFixed(2)}
                        </Text>
                        <Pressable
                          onPress={() => handleDeleteExpense(entry.id)}
                          hitSlop={8}
                          style={({ pressed }) => ({
                            opacity: pressed ? 0.5 : 1,
                            padding: 4,
                          })}
                        >
                          <SymbolView
                            name="trash"
                            size={16}
                            tintColor={colors.textTertiary}
                          />
                        </Pressable>
                        {!isLast && (
                          <View
                            style={{
                              position: "absolute",
                              bottom: 0,
                              left: 68,
                              right: 0,
                              height: 0.5,
                              backgroundColor: colors.borderLight,
                            }}
                          />
                        )}
                      </View>
                    </Animated.View>
                  );
                })}
              </View>
            </Animated.View>
          ))}
        </Animated.View>
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => {
          if (process.env.EXPO_OS === "ios") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          router.push("/(budget)/add-expense");
        }}
        style={({ pressed }) => ({
          position: "absolute",
          bottom: 100,
          right: spacing.lg,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 6px 20px ${colors.primary}50`,
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        })}
      >
        <SymbolView name="plus" size={24} tintColor="#FFFFFF" />
      </Pressable>
    </View>
  );
}
