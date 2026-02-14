import { ScrollView, View, Text, Pressable, useWindowDimensions } from "react-native";
import { Link, useRouter, useFocusEffect } from "expo-router";
import Animated, {
  FadeInDown,
  FadeIn,
  LinearTransition,
  FadeOut,
} from "react-native-reanimated";
import { SymbolView } from "expo-symbols";
import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { colors, spacing, radius, font } from "@/lib/theme";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import type { Task, StudySession } from "@/lib/types/database";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function formatDuration(minutes: number): string {
  if (minutes < 1) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

interface DashboardData {
  tasksDueToday: number;
  tasksCompleted: number;
  totalTasks: number;
  studyStreak: number;
  budgetSpent: number;
  weeklyBudget: number;
  weeklyStudyMinutes: number;
  todayStudyMinutes: number;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [displayName, setDisplayName] = useState("Student");
  const [data, setData] = useState<DashboardData>({
    tasksDueToday: 0,
    tasksCompleted: 0,
    totalTasks: 0,
    studyStreak: 0,
    budgetSpent: 0,
    weeklyBudget: 0,
    weeklyStudyMinutes: 0,
    todayStudyMinutes: 0,
  });
  const [recentSessions, setRecentSessions] = useState<StudySession[]>([]);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      loadData();
    }, [user])
  );

  async function loadData() {
    const today = getToday();
    const now = new Date();

    const { data: profile } = await supabase
      .from("studia_profiles")
      .select("display_name")
      .single();
    if (profile?.display_name) setDisplayName(profile.display_name);

    const { data: allTasks } = await supabase
      .from("studia_tasks")
      .select("*")
      .neq("status", "completed");
    const pendingTasks = allTasks ?? [];

    const dueToday = pendingTasks.filter(
      (t: any) => t.planned_date === today || t.deadline === today
    );
    setTodayTasks(dueToday.slice(0, 5) as Task[]);

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split("T")[0];

    const { data: completedTasks } = await supabase
      .from("studia_tasks")
      .select("id")
      .eq("status", "completed")
      .gte("updated_at", weekStart.toISOString());
    const completedCount = completedTasks?.length ?? 0;

    const { data: streakData } = await supabase
      .from("studia_streaks")
      .select("current_streak")
      .single();
    const currentStreak = streakData?.current_streak ?? 0;

    const { data: settingsData } = await supabase
      .from("studia_budget_settings")
      .select("weekly_budget")
      .single();
    const weeklyBudget = settingsData?.weekly_budget ?? 0;

    const { data: weekEntries } = await supabase
      .from("studia_budget_entries")
      .select("amount")
      .eq("entry_type", "expense")
      .gte("date", weekStartStr);
    const weekExpenses = (weekEntries ?? []).reduce(
      (sum: number, e: any) => sum + Number(e.amount),
      0
    );

    const { data: weekSessions } = await supabase
      .from("studia_study_sessions")
      .select("*")
      .gte("started_at", weekStart.toISOString())
      .order("started_at", { ascending: false });
    const sessions = (weekSessions ?? []) as StudySession[];
    const weeklyMins = sessions.reduce(
      (sum, s) => sum + (s.duration_minutes ?? 0),
      0
    );

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayMins = sessions
      .filter((s) => new Date(s.started_at) >= todayStart)
      .reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);

    setData({
      tasksDueToday: dueToday.length,
      tasksCompleted: completedCount,
      totalTasks: pendingTasks.length + completedCount,
      studyStreak: currentStreak,
      budgetSpent: weekExpenses,
      weeklyBudget,
      weeklyStudyMinutes: weeklyMins,
      todayStudyMinutes: todayMins,
    });

    const { data: recentData } = await supabase
      .from("studia_study_sessions")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(3);
    setRecentSessions((recentData ?? []) as StudySession[]);
  }

  const handleHaptic = () => {
    if (process.env.EXPO_OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  async function handleToggleTask(taskId: string) {
    if (process.env.EXPO_OS === "ios") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await supabase
      .from("studia_tasks")
      .update({ status: "completed" })
      .eq("id", taskId);
    setTodayTasks((prev) => prev.filter((t) => t.id !== taskId));
    setData((prev) => ({
      ...prev,
      tasksDueToday: Math.max(0, prev.tasksDueToday - 1),
      tasksCompleted: prev.tasksCompleted + 1,
    }));
  }

  const budgetRemaining = data.weeklyBudget - data.budgetSpent;
  const budgetPct =
    data.weeklyBudget > 0
      ? Math.min((data.budgetSpent / data.weeklyBudget) * 100, 100)
      : 0;
  const isOverBudget = budgetRemaining < 0;

  const studyGoalMinutes = 14 * 60;
  const studyPct = Math.min(
    (data.weeklyStudyMinutes / studyGoalMinutes) * 100,
    100
  );

  const priorityConfig: Record<
    string,
    { icon: string; color: string; bg: string }
  > = {
    high: {
      icon: "exclamationmark.circle.fill",
      color: colors.danger,
      bg: colors.dangerLight,
    },
    medium: {
      icon: "minus.circle.fill",
      color: colors.warning,
      bg: colors.warningLight,
    },
    low: {
      icon: "arrow.down.circle.fill",
      color: colors.primary,
      bg: colors.primaryLight,
    },
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Greeting ────────────────────────────────────────── */}
      <Animated.View
        entering={FadeInDown.delay(0).duration(400)}
        style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}
      >
        <Text
          style={{
            ...font.title1,
            color: colors.textPrimary,
            marginBottom: 2,
          }}
        >
          {getGreeting()}, {displayName}
        </Text>
        <Text
          style={{
            ...font.subhead,
            color: colors.textSecondary,
            marginBottom: spacing.xl,
          }}
        >
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </Animated.View>

      {/* ── Streak Banner ───────────────────────────────────── */}
      <Animated.View
        entering={FadeInDown.delay(50).duration(400)}
        style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#FF9F0A",
            borderRadius: radius.lg,
            borderCurve: "continuous",
            padding: spacing.lg,
            gap: spacing.md,
            boxShadow: "0 4px 16px rgba(255, 159, 10, 0.3)",
          }}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              borderCurve: "continuous",
              backgroundColor: "rgba(255,255,255,0.25)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SymbolView name="flame.fill" size={28} tintColor="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: "rgba(255,255,255,0.8)",
                marginBottom: 2,
              }}
            >
              Daily streak
            </Text>
            <Text
              selectable
              style={{
                fontSize: 28,
                fontWeight: "800",
                color: "#FFFFFF",
                fontVariant: ["tabular-nums"],
                lineHeight: 32,
              }}
            >
              {data.studyStreak} {data.studyStreak === 1 ? "day" : "days"}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.25)",
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: radius.full,
              borderCurve: "continuous",
            }}
          >
            <Text
              selectable
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: "#FFFFFF",
                fontVariant: ["tabular-nums"],
              }}
            >
              {data.todayStudyMinutes > 0
                ? formatDuration(data.todayStudyMinutes)
                : "0m"}{" "}
              today
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* ── Weekly Progress ──────────────────────────────────── */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(400)}
        style={{
          paddingHorizontal: spacing.lg,
          marginBottom: spacing.xl,
        }}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderCurve: "continuous",
            padding: spacing.lg,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <Text
            style={{
              ...font.footnote,
              fontWeight: "600",
              color: colors.textSecondary,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: spacing.lg,
            }}
          >
            This week
          </Text>

          {/* Study row */}
          <View style={{ marginBottom: spacing.lg }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: spacing.sm,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    borderCurve: "continuous",
                    backgroundColor: colors.primaryLight,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <SymbolView
                    name="book.fill"
                    size={14}
                    tintColor={colors.primary}
                  />
                </View>
                <Text
                  style={{
                    ...font.subhead,
                    fontWeight: "600",
                    color: colors.textPrimary,
                  }}
                >
                  Study
                </Text>
              </View>
              <Text
                selectable
                style={{
                  ...font.subhead,
                  fontWeight: "700",
                  color: colors.primary,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {formatDuration(data.weeklyStudyMinutes)}
              </Text>
            </View>
            <ProgressBar
              value={studyPct}
              color={colors.primary}
              trackColor={colors.primaryLight}
              height={8}
            />
          </View>

          {/* Budget row */}
          <View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: spacing.sm,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    borderCurve: "continuous",
                    backgroundColor: isOverBudget
                      ? colors.dangerLight
                      : colors.successLight,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <SymbolView
                    name="dollarsign.circle.fill"
                    size={14}
                    tintColor={isOverBudget ? colors.danger : colors.success}
                  />
                </View>
                <Text
                  style={{
                    ...font.subhead,
                    fontWeight: "600",
                    color: colors.textPrimary,
                  }}
                >
                  Budget
                </Text>
              </View>
              <Text
                selectable
                style={{
                  ...font.subhead,
                  fontWeight: "700",
                  color: isOverBudget ? colors.danger : colors.success,
                  fontVariant: ["tabular-nums"],
                }}
              >
                ${Math.abs(budgetRemaining).toFixed(0)}{" "}
                {isOverBudget ? "over" : "left"}
              </Text>
            </View>
            <ProgressBar
              value={budgetPct}
              color={
                isOverBudget
                  ? colors.danger
                  : budgetPct > 80
                    ? colors.warning
                    : colors.success
              }
              trackColor={colors.surfaceSecondary}
              height={8}
            />
          </View>
        </View>
      </Animated.View>

      {/* ── Today's Tasks ────────────────────────────────────── */}
      <Animated.View
        entering={FadeInDown.delay(150).duration(400)}
        style={{ paddingHorizontal: spacing.lg }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: spacing.md,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
            }}
          >
            <Text
              style={{
                ...font.title3,
                color: colors.textPrimary,
              }}
            >
              Today
            </Text>
            {data.tasksDueToday > 0 && (
              <View
                style={{
                  backgroundColor: colors.primary,
                  minWidth: 24,
                  height: 24,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: "#FFFFFF",
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {data.tasksDueToday}
                </Text>
              </View>
            )}
          </View>
          <Link href="/(home)/planner" asChild>
            <Pressable
              onPress={handleHaptic}
              hitSlop={8}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text
                style={{
                  ...font.subhead,
                  fontWeight: "600",
                  color: colors.primary,
                }}
              >
                See all
              </Text>
              <SymbolView
                name="chevron.right"
                size={12}
                tintColor={colors.primary}
              />
            </Pressable>
          </Link>
        </View>
      </Animated.View>

      {/* Task list or empty state */}
      <View style={{ paddingHorizontal: spacing.lg }}>
        {todayTasks.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                borderCurve: "continuous",
                padding: spacing.xl,
                alignItems: "center",
                marginBottom: spacing.xl,
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: colors.successLight,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: spacing.md,
                }}
              >
                <SymbolView
                  name="checkmark.circle.fill"
                  size={32}
                  tintColor={colors.success}
                />
              </View>
              <Text
                style={{
                  ...font.headline,
                  color: colors.textPrimary,
                  marginBottom: 4,
                }}
              >
                All caught up!
              </Text>
              <Text
                style={{
                  ...font.subhead,
                  color: colors.textSecondary,
                  textAlign: "center",
                }}
              >
                No tasks due today. Enjoy your day{"\n"}or get ahead on
                tomorrow's work.
              </Text>
            </View>
          </Animated.View>
        ) : (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              borderCurve: "continuous",
              overflow: "hidden",
              marginBottom: spacing.xl,
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            {todayTasks.map((task, index) => {
              const pc = priorityConfig[task.priority] ?? priorityConfig.low;
              const isLast = index === todayTasks.length - 1;

              return (
                <Animated.View
                  key={task.id}
                  entering={FadeInDown.delay(200 + index * 40).duration(350)}
                  exiting={FadeOut.duration(200)}
                  layout={LinearTransition.duration(250)}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: spacing.md + 2,
                      paddingHorizontal: spacing.lg,
                      borderBottomWidth: isLast ? 0 : 0.5,
                      borderBottomColor: colors.borderLight,
                    }}
                  >
                    {/* Complete button */}
                    <Pressable
                      onPress={() => handleToggleTask(task.id)}
                      hitSlop={8}
                      style={({ pressed }) => ({
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        borderWidth: 2.5,
                        borderColor: pc.color,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: spacing.md,
                        opacity: pressed ? 0.4 : 1,
                      })}
                    />

                    <View style={{ flex: 1, marginRight: spacing.sm }}>
                      <Text
                        style={{
                          ...font.subhead,
                          fontWeight: "500",
                          color: colors.textPrimary,
                        }}
                        numberOfLines={1}
                      >
                        {task.title}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: spacing.md,
                          marginTop: 3,
                        }}
                      >
                        {task.course && (
                          <Text
                            style={{
                              ...font.caption1,
                              color: colors.textTertiary,
                            }}
                          >
                            {task.course}
                          </Text>
                        )}
                        {task.estimated_hours != null && (
                          <Text
                            style={{
                              ...font.caption1,
                              color: colors.textTertiary,
                              fontVariant: ["tabular-nums"],
                            }}
                          >
                            {task.estimated_hours}h
                          </Text>
                        )}
                        {task.deadline && (
                          <Text
                            style={{
                              ...font.caption1,
                              color: colors.textTertiary,
                            }}
                          >
                            {new Date(task.deadline).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" }
                            )}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Priority pill */}
                    <View
                      style={{
                        backgroundColor: pc.bg,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                        borderCurve: "continuous",
                      }}
                    >
                      <SymbolView
                        name={pc.icon as any}
                        size={14}
                        tintColor={pc.color}
                      />
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        )}
      </View>

      {/* ── Quick Access Grid ────────────────────────────────── */}
      <Animated.View
        entering={FadeInDown.delay(300).duration(400)}
        style={{ paddingHorizontal: spacing.lg }}
      >
        <Text
          style={{
            ...font.title3,
            color: colors.textPrimary,
            marginBottom: spacing.md,
          }}
        >
          Quick access
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(340).duration(400)}
        style={{
          flexDirection: "row",
          gap: spacing.sm,
          paddingHorizontal: spacing.lg,
          marginBottom: spacing.xl,
        }}
      >
        {[
          {
            title: "Planner",
            icon: "calendar" as const,
            color: "#5856D6",
            gradient: "#EDEDFC",
            href: "/(home)/planner" as const,
          },
          {
            title: "AI Tutor",
            icon: "brain.head.profile" as const,
            color: "#AF52DE",
            gradient: "#F5EDFC",
            href: "/(home)/tutor" as const,
          },
          {
            title: "Wellness",
            icon: "heart.fill" as const,
            color: "#FF375F",
            gradient: "#FFEAEF",
            href: "/(home)/wellness" as const,
          },
        ].map((tool, index) => (
          <Animated.View
            key={tool.title}
            entering={FadeInDown.delay(360 + index * 40).duration(350)}
            style={{ flex: 1 }}
          >
            <Link href={tool.href} asChild>
              <Pressable
                onPress={handleHaptic}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                })}
              >
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: radius.lg,
                    borderCurve: "continuous",
                    paddingVertical: spacing.lg + 4,
                    alignItems: "center",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      borderCurve: "continuous",
                      backgroundColor: tool.gradient,
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: spacing.sm,
                    }}
                  >
                    <SymbolView
                      name={tool.icon}
                      size={22}
                      tintColor={tool.color}
                    />
                  </View>
                  <Text
                    style={{
                      ...font.footnote,
                      fontWeight: "600",
                      color: colors.textPrimary,
                    }}
                  >
                    {tool.title}
                  </Text>
                </View>
              </Pressable>
            </Link>
          </Animated.View>
        ))}
      </Animated.View>

      {/* ── Recent Activity ──────────────────────────────────── */}
      {recentSessions.length > 0 && (
        <Animated.View
          entering={FadeInDown.delay(450).duration(400)}
          style={{ paddingHorizontal: spacing.lg }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: spacing.md,
            }}
          >
            <Text
              style={{
                ...font.title3,
                color: colors.textPrimary,
              }}
            >
              Recent activity
            </Text>
            <Text
              selectable
              style={{
                ...font.footnote,
                fontWeight: "500",
                color: colors.textTertiary,
                fontVariant: ["tabular-nums"],
              }}
            >
              {data.tasksCompleted} done this week
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              borderCurve: "continuous",
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            {recentSessions.map((session, index) => {
              const isLast = index === recentSessions.length - 1;
              return (
                <Animated.View
                  key={session.id}
                  entering={FadeInDown.delay(480 + index * 40).duration(350)}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: spacing.md,
                      paddingHorizontal: spacing.lg,
                      borderBottomWidth: isLast ? 0 : 0.5,
                      borderBottomColor: colors.borderLight,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        borderCurve: "continuous",
                        backgroundColor: colors.primaryLight,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: spacing.md,
                      }}
                    >
                      <SymbolView
                        name="book.fill"
                        size={18}
                        tintColor={colors.primary}
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
                        {session.notes ?? "Study session"}
                      </Text>
                      <Text
                        style={{
                          ...font.caption1,
                          color: colors.textTertiary,
                          marginTop: 2,
                        }}
                      >
                        {formatRelativeDate(session.started_at)}
                      </Text>
                    </View>
                    {session.duration_minutes != null && (
                      <View
                        style={{
                          backgroundColor: colors.primaryLight,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 8,
                          borderCurve: "continuous",
                        }}
                      >
                        <Text
                          selectable
                          style={{
                            ...font.footnote,
                            fontWeight: "600",
                            color: colors.primary,
                            fontVariant: ["tabular-nums"],
                          }}
                        >
                          {formatDuration(session.duration_minutes)}
                        </Text>
                      </View>
                    )}
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>
      )}
    </ScrollView>
  );
}
