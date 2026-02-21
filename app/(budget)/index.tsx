import { useCallback } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { useFocusEffect, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { colors, spacing, radius, font, categoryColors } from "@/lib/theme";
import { useAuth } from "@/lib/auth-context";
import { useBudgetData } from "@/lib/features/budget/use-budget-data";
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

interface CategoryRowProps {
  category: BudgetCategory;
  value: number;
  totalSpent: number;
  isLast: boolean;
}

function CategoryRow({ category, value, totalSpent, isLast }: CategoryRowProps) {
  const pct = totalSpent > 0 ? (value / totalSpent) * 100 : 0;

  return (
    <View
      style={{
        paddingVertical: spacing.sm + 2,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: "#EEF2FF",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              borderCurve: "continuous",
              backgroundColor: `${categoryColors[category]}20`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SymbolView
              name={CATEGORY_ICONS[category] as any}
              size={15}
              tintColor={categoryColors[category]}
            />
          </View>
          <Text style={{ ...font.subhead, color: colors.textPrimary, fontWeight: "600" }}>
            {CATEGORY_LABELS[category]}
          </Text>
        </View>

        <Text
          selectable
          style={{
            ...font.subhead,
            color: colors.textPrimary,
            fontWeight: "700",
            fontVariant: ["tabular-nums"],
          }}
        >
          ${value.toFixed(2)}
        </Text>
      </View>

      <ProgressBar
        value={pct}
        color={categoryColors[category]}
        trackColor={`${categoryColors[category]}1A`}
        height={7}
      />
    </View>
  );
}

export default function BudgetScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    weeklyBudget,
    expenses,
    totalSpent,
    categoryTotals,
    activeCategories,
    loadData,
    removeExpense,
  } = useBudgetData(user?.id);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      loadData();
    }, [user?.id, loadData])
  );

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
          const ok = await removeExpense(id);
          if (!ok) {
            Alert.alert("Could not delete expense", "Please try again.");
          }
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
  const activeCats = activeCategories;

  return (
    <View style={{ flex: 1, backgroundColor: "#EEF2FF" }}>
      <LinearGradient
        colors={["#EEF2FF", "#F4FCFF", "#FFF5EA"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", inset: 0 }}
      />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: 124,
          paddingTop: spacing.sm,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(340)}>
          <LinearGradient
            colors={["#5B5AF8", "#327FF8", "#15B5FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: radius.xl,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.3)",
              padding: spacing.lg,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                position: "absolute",
                width: 160,
                height: 160,
                borderRadius: 80,
                right: -34,
                top: -58,
                backgroundColor: "rgba(255,255,255,0.14)",
              }}
            />

            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: spacing.lg,
              }}
            >
              <View>
                <Text style={{ ...font.caption1, color: "rgba(255,255,255,0.8)" }}>
                  Weekly Budget
                </Text>
                <Text
                  selectable
                  style={{
                    fontSize: 34,
                    fontWeight: "800",
                    color: "#FFFFFF",
                    fontVariant: ["tabular-nums"],
                    marginTop: 2,
                  }}
                >
                  ${weeklyBudget.toFixed(0)}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.18)",
                  borderRadius: radius.md,
                  borderCurve: "continuous",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  alignItems: "flex-end",
                }}
              >
                <Text style={{ ...font.caption2, color: "rgba(255,255,255,0.75)", textTransform: "uppercase" }}>
                  Remaining
                </Text>
                <Text
                  selectable
                  style={{
                    ...font.subhead,
                    color: "#FFFFFF",
                    fontWeight: "800",
                    marginTop: 2,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {isOverBudget ? "-" : ""}${Math.abs(remaining).toFixed(2)}
                </Text>
              </View>
            </View>

            <ProgressBar
              value={spentPercentage}
              color="#FFFFFF"
              trackColor="rgba(255,255,255,0.28)"
              height={9}
            />

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: spacing.sm,
              }}
            >
              <Text
                selectable
                style={{
                  ...font.caption1,
                  color: "rgba(255,255,255,0.82)",
                  fontVariant: ["tabular-nums"],
                }}
              >
                ${totalSpent.toFixed(2)} spent
              </Text>
              <Text
                style={{
                  ...font.caption1,
                  color: "rgba(255,255,255,0.82)",
                  fontVariant: ["tabular-nums"],
                }}
              >
                {spentPercentage.toFixed(0)}%
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {activeCats.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(80).duration(300)} style={{ marginTop: spacing.lg }}>
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: radius.lg,
                borderCurve: "continuous",
                borderWidth: 1,
                borderColor: "#E4EAFF",
                padding: spacing.lg,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: spacing.md,
                }}
              >
                <Text style={{ ...font.title3, color: colors.textPrimary, fontWeight: "700" }}>
                  Category Breakdown
                </Text>
                <View
                  style={{
                    backgroundColor: "#EDF4FF",
                    borderRadius: radius.full,
                    borderCurve: "continuous",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}
                >
                  <Text
                    style={{
                      ...font.footnote,
                      color: colors.primary,
                      fontWeight: "700",
                      fontVariant: ["tabular-nums"],
                    }}
                  >
                    {activeCats.length}
                  </Text>
                </View>
              </View>

              {(Object.keys(categoryTotals) as BudgetCategory[]).map((cat, index) => {
                const isLast = index === Object.keys(categoryTotals).length - 1;
                return (
                  <CategoryRow
                    key={cat}
                    category={cat}
                    value={categoryTotals[cat]}
                    totalSpent={totalSpent}
                    isLast={isLast}
                  />
                );
              })}
            </View>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(140).duration(300)} style={{ marginTop: spacing.lg }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: spacing.md,
            }}
          >
            <View>
              <Text style={{ ...font.title3, color: colors.textPrimary, fontWeight: "700" }}>
                Expenses
              </Text>
              <Text style={{ ...font.caption1, color: colors.textSecondary, marginTop: 2 }}>
                Track each transaction with category context
              </Text>
            </View>
          </View>

          {grouped.length === 0 ? <EmptyState icon="tray" title="No expenses yet" /> : null}

          {grouped.map((group, gi) => (
            <Animated.View
              key={group.label}
              entering={FadeInDown.delay(190 + gi * 55).duration(250)}
              layout={LinearTransition.duration(230)}
              style={{ marginTop: gi > 0 ? spacing.lg : 0 }}
            >
              <Text
                style={{
                  ...font.footnote,
                  color: colors.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: spacing.sm,
                  fontWeight: "700",
                }}
              >
                {group.label}
              </Text>

              <View
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: radius.lg,
                  borderCurve: "continuous",
                  borderWidth: 1,
                  borderColor: "#E7ECFF",
                  overflow: "hidden",
                }}
              >
                {group.entries.map((entry, ei) => {
                  const isLast = ei === group.entries.length - 1;
                  return (
                    <Animated.View
                      key={entry.id}
                      exiting={FadeOut.duration(200)}
                      layout={LinearTransition.duration(230)}
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
                            backgroundColor: `${categoryColors[entry.category]}20`,
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
                              fontWeight: "600",
                              color: colors.textPrimary,
                            }}
                            numberOfLines={1}
                          >
                            {entry.description ?? CATEGORY_LABELS[entry.category]}
                          </Text>
                          <Text style={{ ...font.caption1, color: colors.textSecondary, marginTop: 2 }}>
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
                          accessibilityRole="button"
                          accessibilityLabel="Delete expense"
                          style={({ pressed }) => ({
                            opacity: pressed ? 0.45 : 1,
                            padding: 4,
                          })}
                        >
                          <SymbolView name="trash" size={16} tintColor={colors.textTertiary} />
                        </Pressable>

                        {!isLast ? (
                          <View
                            style={{
                              position: "absolute",
                              bottom: 0,
                              left: 68,
                              right: 0,
                              height: 1,
                              backgroundColor: "#EEF2FF",
                            }}
                          />
                        ) : null}
                      </View>
                    </Animated.View>
                  );
                })}
              </View>
            </Animated.View>
          ))}
        </Animated.View>
      </ScrollView>

      <Pressable
        onPress={() => {
          if (process.env.EXPO_OS === "ios") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          router.push("/(budget)/add-expense");
        }}
        accessibilityRole="button"
        accessibilityLabel="Add expense"
        style={({ pressed }) => ({
          position: "absolute",
          bottom: 100,
          right: spacing.lg,
          opacity: pressed ? 0.82 : 1,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        })}
      >
        <LinearGradient
          colors={["#655EFF", "#2C84F6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 58,
            height: 58,
            borderRadius: 29,
            borderCurve: "continuous",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.45)",
          }}
        >
          <SymbolView name="plus" size={24} tintColor="#FFFFFF" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}
