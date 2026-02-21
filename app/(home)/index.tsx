import { useCallback } from "react";
import { ScrollView, View, Text, Pressable, Alert } from "react-native";
import { Link, useFocusEffect } from "expo-router";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { SymbolView } from "expo-symbols";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { ProgressBar } from "@/components/ui/progress-bar";
import { colors, spacing, radius, font } from "@/lib/theme";
import { useAuth } from "@/lib/auth-context";
import { useDashboardData } from "@/lib/features/dashboard/use-dashboard-data";
import {
  formatDuration,
  formatRelativeDate,
  getGreeting,
} from "@/lib/features/dashboard/formatters";

const SCREEN_BG = ["#EEF3FF", "#F5FBFF", "#FFF8EF"] as const;

type DashboardHref =
  | "/(home)/planner"
  | "/(home)/tutor"
  | "/(home)/wellness"
  | "/(study)"
  | "/(inbox)"
  | "/(budget)"
  | "/(settings)";

const priorityConfig: Record<
  string,
  {
    icon: string;
    color: string;
    bg: string;
  }
> = {
  high: {
    icon: "exclamationmark.circle.fill",
    color: colors.danger,
    bg: "#FFE8E8",
  },
  medium: {
    icon: "minus.circle.fill",
    color: colors.warning,
    bg: "#FFF1DE",
  },
  low: {
    icon: "arrow.down.circle.fill",
    color: colors.primary,
    bg: "#ECE8FF",
  },
};

interface HeroPillProps {
  icon: string;
  label: string;
  value: string;
}

interface ActionPillProps {
  label: string;
  icon: string;
  href: DashboardHref;
  onPress: () => void;
}

function ActionPill({ label, icon, href, onPress }: ActionPillProps) {
  return (
    <Link href={href} asChild>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Open ${label}`}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          paddingHorizontal: spacing.md,
          paddingVertical: 10,
          minHeight: 44,
          borderRadius: radius.full,
          borderCurve: "continuous",
          backgroundColor: "#FFFFFF",
          borderWidth: 1,
          borderColor: "#E3E9FF",
          opacity: pressed ? 0.72 : 1,
        })}
      >
        <SymbolView name={icon as any} size={13} tintColor={colors.primary} />
        <Text style={{ ...font.caption1, color: colors.primary, fontWeight: "700" }}>
          {label}
        </Text>
      </Pressable>
    </Link>
  );
}

function HeroPill({ icon, label, value }: HeroPillProps) {
  return (
    <View
      style={{
        flex: 1,
        borderRadius: radius.md,
        borderCurve: "continuous",
        backgroundColor: "rgba(255,255,255,0.17)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.24)",
        paddingVertical: spacing.sm + 2,
        paddingHorizontal: spacing.sm,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <SymbolView name={icon as any} size={13} tintColor="rgba(255,255,255,0.92)" />
        <Text
          style={{
            ...font.caption2,
            color: "rgba(255,255,255,0.78)",
            textTransform: "uppercase",
            letterSpacing: 0.7,
          }}
        >
          {label}
        </Text>
      </View>
      <Text
        selectable
        style={{
          ...font.subhead,
          color: "#FFFFFF",
          fontWeight: "700",
          marginTop: 4,
          fontVariant: ["tabular-nums"],
        }}
      >
        {value}
      </Text>
    </View>
  );
}

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: DashboardHref;
  onActionPress?: () => void;
}

function SectionHeading({
  title,
  subtitle,
  actionLabel,
  actionHref,
  onActionPress,
}: SectionHeadingProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: spacing.md,
      }}
    >
      <View style={{ flex: 1, marginRight: spacing.sm }}>
        <Text style={{ ...font.title3, color: colors.textPrimary, fontWeight: "700" }}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              ...font.caption1,
              color: colors.textSecondary,
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {actionLabel && actionHref ? (
        <Link href={actionHref} asChild>
          <Pressable
            onPress={onActionPress}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            hitSlop={8}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              opacity: pressed ? 0.65 : 1,
            })}
          >
            <Text
              style={{
                ...font.subhead,
                color: colors.primary,
                fontWeight: "600",
              }}
            >
              {actionLabel}
            </Text>
            <SymbolView name="chevron.right" size={12} tintColor={colors.primary} />
          </Pressable>
        </Link>
      ) : null}
    </View>
  );
}

interface ToolCardProps {
  title: string;
  subtitle: string;
  cta: string;
  icon: string;
  colors: readonly [string, string];
  href: DashboardHref;
  onPress: () => void;
}

function ToolCard({
  title,
  subtitle,
  cta,
  icon,
  colors: cardColors,
  href,
  onPress,
}: ToolCardProps) {
  return (
    <Link href={href} asChild>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Open ${title}`}
        style={({ pressed }) => ({
          width: 246,
          opacity: pressed ? 0.78 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        <LinearGradient
          colors={cardColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            minHeight: 156,
            borderRadius: radius.lg,
            borderCurve: "continuous",
            padding: spacing.lg,
            justifyContent: "space-between",
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.26)",
          }}
        >
          <View
            style={{
              position: "absolute",
              width: 120,
              height: 120,
              borderRadius: 60,
              right: -25,
              top: -30,
              backgroundColor: "rgba(255,255,255,0.13)",
            }}
          />
          <View
            style={{
              position: "absolute",
              width: 90,
              height: 90,
              borderRadius: 45,
              right: 36,
              bottom: -48,
              backgroundColor: "rgba(255,255,255,0.08)",
            }}
          />
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              borderCurve: "continuous",
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SymbolView name={icon as any} size={18} tintColor="#FFFFFF" />
          </View>
          <View>
            <Text
              style={{
                ...font.caption1,
                color: "rgba(255,255,255,0.82)",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {subtitle}
            </Text>
            <Text style={{ ...font.headline, color: "#FFFFFF", fontWeight: "700", marginTop: 2 }}>
              {title}
            </Text>
            <View
              style={{
                alignSelf: "flex-start",
                marginTop: spacing.sm,
                borderRadius: radius.full,
                borderCurve: "continuous",
                paddingHorizontal: 10,
                paddingVertical: 4,
                backgroundColor: "rgba(255,255,255,0.18)",
              }}
            >
              <Text style={{ ...font.caption2, color: "#FFFFFF", fontWeight: "700" }}>{cta}</Text>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Link>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { displayName, data, recentSessions, todayTasks, loadData, completeTask } =
    useDashboardData(user?.id);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      loadData();
    }, [user, loadData])
  );

  const handleHaptic = () => {
    if (process.env.EXPO_OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  async function handleToggleTask(taskId: string) {
    if (process.env.EXPO_OS === "ios") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const ok = await completeTask(taskId);
    if (!ok) {
      Alert.alert("Could not update task", "Please try again.");
    }
  }

  const budgetRemaining = data.weeklyBudget - data.budgetSpent;
  const budgetPct =
    data.weeklyBudget > 0
      ? Math.min((data.budgetSpent / data.weeklyBudget) * 100, 100)
      : 0;
  const isOverBudget = budgetRemaining < 0;

  const studyGoalMinutes = 14 * 60;
  const studyPct = Math.min((data.weeklyStudyMinutes / studyGoalMinutes) * 100, 100);

  const todayFocusValue = data.todayStudyMinutes > 0 ? formatDuration(data.todayStudyMinutes) : "0m";
  const pendingTasks = Math.max(0, data.totalTasks - data.tasksCompleted);

  return (
    <View style={{ flex: 1, backgroundColor: "#EFF3FF" }}>
      <LinearGradient
        colors={SCREEN_BG}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", inset: 0 }}
      />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: 128,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(340)}>
          <Text
            style={{
              ...font.subhead,
              color: colors.textSecondary,
              marginBottom: 4,
            }}
          >
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Text>
          <Text style={{ ...font.title1, color: colors.textPrimary, fontWeight: "800" }}>
            {getGreeting()}, {displayName}
          </Text>
          <Text style={{ ...font.caption1, color: colors.textSecondary, marginTop: 2 }}>
            Stay intentional. Build momentum with clear priorities.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(55).duration(360)} style={{ marginTop: spacing.md }}>
          <LinearGradient
            colors={["#5D5CFF", "#2E86F6", "#13B4E6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: radius.xl,
              borderCurve: "continuous",
              padding: spacing.lg,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.3)",
              overflow: "hidden",
            }}
          >
            <View
              style={{
                position: "absolute",
                width: 170,
                height: 170,
                right: -35,
                top: -60,
                borderRadius: 85,
                backgroundColor: "rgba(255,255,255,0.14)",
              }}
            />

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View>
                <Text style={{ ...font.caption1, color: "rgba(255,255,255,0.82)" }}>
                  Focus Momentum
                </Text>
                <Text
                  selectable
                  style={{
                    ...font.title2,
                    color: "#FFFFFF",
                    fontWeight: "800",
                    marginTop: 2,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {data.studyStreak} day streak
                </Text>
              </View>

              <Link href="/(study)" asChild>
                <Pressable
                  onPress={handleHaptic}
                  accessibilityRole="button"
                  accessibilityLabel="Open Study"
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    borderRadius: radius.full,
                    borderCurve: "continuous",
                    minHeight: 44,
                    justifyContent: "center",
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                  })}
                >
                  <Text style={{ ...font.footnote, color: "#FFFFFF", fontWeight: "700" }}>
                    Open Study
                  </Text>
                </Pressable>
              </Link>
            </View>

            <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
              <HeroPill icon="clock.fill" label="Focus Today" value={todayFocusValue} />
              <HeroPill icon="calendar.badge.clock" label="Due Today" value={`${data.tasksDueToday}`} />
              <HeroPill icon="tray.full.fill" label="Open Tasks" value={`${pendingTasks}`} />
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(78).duration(320)} style={{ marginTop: spacing.md }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            <ActionPill label="Inbox" icon="tray.fill" href="/(inbox)" onPress={handleHaptic} />
            <ActionPill label="Budget" icon="creditcard.fill" href="/(budget)" onPress={handleHaptic} />
            <ActionPill label="Study" icon="timer" href="/(study)" onPress={handleHaptic} />
            <ActionPill label="Settings" icon="gearshape.fill" href="/(settings)" onPress={handleHaptic} />
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(95).duration(360)} style={{ marginTop: spacing.lg }}>
          <SectionHeading
            title="Today Priorities"
            subtitle={
              todayTasks.length > 0
                ? "Execute your most important tasks first"
                : "No urgent items detected for today"
            }
            actionLabel="Planner"
            actionHref="/(home)/planner"
            onActionPress={handleHaptic}
          />

          {todayTasks.length === 0 ? (
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: radius.lg,
                borderCurve: "continuous",
                borderWidth: 1,
                borderColor: "#DAF4E8",
                paddingVertical: spacing.xl,
                paddingHorizontal: spacing.lg,
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: 31,
                  borderCurve: "continuous",
                  backgroundColor: "#E8FBEF",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: spacing.md,
                }}
              >
                <SymbolView name="checkmark.seal.fill" size={30} tintColor={colors.success} />
              </View>
              <Text style={{ ...font.headline, color: colors.textPrimary, marginBottom: 4 }}>
                All caught up
              </Text>
              <Text style={{ ...font.subhead, color: colors.textSecondary, textAlign: "center" }}>
                You can invest this window in revision or planning tomorrow.
              </Text>
            </View>
          ) : (
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: radius.lg,
                borderCurve: "continuous",
                borderWidth: 1,
                borderColor: "#E3E9FF",
                overflow: "hidden",
              }}
            >
              {todayTasks.map((task, index) => {
                const pc = priorityConfig[task.priority] ?? priorityConfig.low;
                const isLast = index === todayTasks.length - 1;

                return (
                  <Animated.View
                    key={task.id}
                    entering={FadeInDown.delay(160 + index * 45).duration(330)}
                    exiting={FadeOut.duration(160)}
                    layout={LinearTransition.duration(220)}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: spacing.md,
                        paddingHorizontal: spacing.lg,
                        borderBottomWidth: isLast ? 0 : 1,
                        borderBottomColor: "#EDF2FF",
                      }}
                    >
                      <Pressable
                        onPress={() => handleToggleTask(task.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Complete task: ${task.title}`}
                        hitSlop={10}
                        style={({ pressed }) => ({
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          borderWidth: 2.5,
                          borderColor: pc.color,
                          marginRight: spacing.md,
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: pressed ? 0.55 : 1,
                        })}
                      />

                      <View style={{ flex: 1, marginRight: spacing.sm }}>
                        <Text
                          style={{
                            ...font.subhead,
                            color: colors.textPrimary,
                            fontWeight: "600",
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
                          {task.course ? (
                            <Text style={{ ...font.caption1, color: colors.textSecondary }}>
                              {task.course}
                            </Text>
                          ) : null}
                          {task.estimated_hours != null ? (
                            <Text
                              style={{
                                ...font.caption1,
                                color: colors.textSecondary,
                                fontVariant: ["tabular-nums"],
                              }}
                            >
                              {task.estimated_hours}h
                            </Text>
                          ) : null}
                          {task.deadline ? (
                            <Text style={{ ...font.caption1, color: colors.textSecondary }}>
                              {new Date(task.deadline).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      <View
                        style={{
                          backgroundColor: pc.bg,
                          borderRadius: radius.sm,
                          borderCurve: "continuous",
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <SymbolView name={pc.icon as any} size={13} tintColor={pc.color} />
                        <Text
                          style={{
                            ...font.caption2,
                            color: pc.color,
                            fontWeight: "700",
                            textTransform: "uppercase",
                          }}
                        >
                          {task.priority}
                        </Text>
                      </View>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).duration(350)} style={{ marginTop: spacing.lg }}>
          <SectionHeading title="Weekly Pulse" subtitle="Progress against your study and budget targets" />

          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: radius.lg,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: "#E3E9FF",
              padding: spacing.lg,
              gap: spacing.lg,
            }}
          >
            <View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: spacing.sm,
                }}
              >
                <Text style={{ ...font.subhead, color: colors.textPrimary, fontWeight: "600" }}>
                  Study Goal
                </Text>
                <Text
                  selectable
                  style={{
                    ...font.subhead,
                    color: colors.primary,
                    fontWeight: "700",
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {formatDuration(data.weeklyStudyMinutes)} / {formatDuration(studyGoalMinutes)}
                </Text>
              </View>
              <ProgressBar
                value={studyPct}
                color={colors.primary}
                trackColor="#ECE8FF"
                height={9}
              />
            </View>

            <View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: spacing.sm,
                }}
              >
                <Text style={{ ...font.subhead, color: colors.textPrimary, fontWeight: "600" }}>
                  Weekly Budget
                </Text>
                <Text
                  selectable
                  style={{
                    ...font.subhead,
                    color: isOverBudget ? colors.danger : colors.success,
                    fontWeight: "700",
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  ${data.budgetSpent.toFixed(0)} / ${data.weeklyBudget.toFixed(0)}
                </Text>
              </View>
              <ProgressBar
                value={budgetPct}
                color={isOverBudget ? colors.danger : colors.success}
                trackColor={isOverBudget ? "#FFE8E8" : "#E8FBEF"}
                height={9}
              />
              <Text
                style={{
                  ...font.caption1,
                  color: isOverBudget ? colors.danger : colors.textSecondary,
                  marginTop: spacing.xs,
                }}
              >
                {isOverBudget
                  ? `You are $${Math.abs(budgetRemaining).toFixed(0)} over this week.`
                  : `$${Math.abs(budgetRemaining).toFixed(0)} available for the rest of the week.`}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).duration(360)} style={{ marginTop: spacing.lg }}>
          <SectionHeading title="Command Deck" subtitle="Your most-used flows in one place" />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            {[
              {
                title: "Planner",
                subtitle: "Organize",
                cta: "Open Plan",
                icon: "calendar",
                colors: ["#6B6AF9", "#8A7BFF"] as const,
                href: "/(home)/planner" as const,
              },
              {
                title: "AI Tutor",
                subtitle: "Deep Study",
                cta: "Build Pack",
                icon: "brain.head.profile",
                colors: ["#C157F7", "#E56CDA"] as const,
                href: "/(home)/tutor" as const,
              },
              {
                title: "Wellness",
                subtitle: "Recovery",
                cta: "Check In",
                icon: "heart.fill",
                colors: ["#FF5A7E", "#FF8C6B"] as const,
                href: "/(home)/wellness" as const,
              },
            ].map((tool, index) => (
              <Animated.View
                key={tool.title}
                entering={FadeInDown.delay(205 + index * 45).duration(340)}
              >
                <ToolCard
                  title={tool.title}
                  subtitle={tool.subtitle}
                  cta={tool.cta}
                  icon={tool.icon}
                  colors={tool.colors}
                  href={tool.href}
                  onPress={handleHaptic}
                />
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>

        {recentSessions.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(240).duration(360)} style={{ marginTop: spacing.lg }}>
            <SectionHeading
              title="Recent Sessions"
              subtitle="Your latest deep-work blocks"
            />

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
              {recentSessions.map((session, index) => {
                const isLast = index === recentSessions.length - 1;
                return (
                  <Animated.View
                    key={session.id}
                    entering={FadeInDown.delay(310 + index * 45).duration(320)}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: spacing.md,
                        paddingHorizontal: spacing.lg,
                        borderBottomWidth: isLast ? 0 : 1,
                        borderBottomColor: "#EEF2FF",
                      }}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          borderCurve: "continuous",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: spacing.md,
                          backgroundColor: index % 2 === 0 ? "#ECE8FF" : "#E8FBEF",
                        }}
                      >
                        <SymbolView
                          name={index % 2 === 0 ? "book.fill" : "brain"}
                          size={17}
                          tintColor={index % 2 === 0 ? colors.primary : colors.success}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={{ ...font.subhead, color: colors.textPrimary, fontWeight: "600" }}
                          numberOfLines={1}
                        >
                          {session.notes ?? "Study session"}
                        </Text>
                        <Text style={{ ...font.caption1, color: colors.textSecondary, marginTop: 2 }}>
                          {formatRelativeDate(session.started_at)}
                        </Text>
                      </View>

                      {session.duration_minutes != null ? (
                        <View
                          style={{
                            borderRadius: radius.sm,
                            borderCurve: "continuous",
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            backgroundColor: "#EDF4FF",
                          }}
                        >
                          <Text
                            selectable
                            style={{
                              ...font.footnote,
                              color: "#2975F0",
                              fontWeight: "700",
                              fontVariant: ["tabular-nums"],
                            }}
                          >
                            {formatDuration(session.duration_minutes)}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>
    </View>
  );
}
