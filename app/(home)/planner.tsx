import { ScrollView, View, Text, Pressable } from "react-native";
import { useFocusEffect } from "expo-router";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { SymbolView } from "expo-symbols";
import * as Haptics from "expo-haptics";
import { useCallback, useState, useRef } from "react";
import { Badge, ProgressBar } from "@/components/ui";
import { colors, spacing, radius, font } from "@/lib/theme";
import { useAuth } from "@/lib/auth-context";
import { listTasksForUser, listWellnessHistory } from "@/lib/data/studia-api";
import type { WellnessMode } from "@/lib/types/database";
import { getLocalISODate } from "@/lib/utils/date";
import { generatePlan, type DayPlan } from "@/lib/utils/planner-engine";

export default function PlannerScreen() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<DayPlan[]>([]);
  const [activeMode, setActiveMode] = useState<WellnessMode>("normal");
  const [selectedDay, setSelectedDay] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      (async () => {
        try {
          const [tasks, wellnessLogs] = await Promise.all([
            listTasksForUser(user.id),
            listWellnessHistory(user.id, 1),
          ]);

          const today = getLocalISODate();
          const latestWellness = wellnessLogs[0];
          const plannerMode: WellnessMode =
            latestWellness && latestWellness.date === today
              ? latestWellness.mode
              : "normal";

          const generated = generatePlan(tasks, plannerMode);
          setPlan(generated);
          setActiveMode(plannerMode);
        } catch {
          setPlan([]);
          setActiveMode("normal");
        }
        setSelectedDay(0);
      })();
    }, [user?.id])
  );

  const handleSelectDay = (index: number) => {
    if (process.env.EXPO_OS === "ios") {
      Haptics.selectionAsync();
    }
    setSelectedDay(index);
  };

  const currentDay = plan[selectedDay];

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.delay(0).duration(400)}>
        <Text
          style={{
            ...font.subhead,
            color: colors.textSecondary,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            marginBottom: spacing.lg,
          }}
        >
          Auto-generated plan based on your priorities and deadlines
        </Text>
      </Animated.View>

      {activeMode === "light" && (
        <Animated.View entering={FadeInDown.delay(30).duration(380)}>
          <View
            style={{
              marginHorizontal: spacing.lg,
              marginBottom: spacing.md,
              backgroundColor: "#FFF4E7",
              borderRadius: radius.md,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: "#FFD6A6",
              padding: spacing.md,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
            }}
          >
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                borderCurve: "continuous",
                backgroundColor: "#FFE7CC",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SymbolView name="moon.fill" size={16} tintColor="#E58A1F" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  ...font.footnote,
                  color: "#A35F00",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                }}
              >
                Light Mode Active
              </Text>
              <Text
                style={{
                  ...font.caption1,
                  color: "#8B6A3B",
                  marginTop: 2,
                }}
              >
                Planner is prioritizing essential tasks for recovery.
              </Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* ── Day Selector ──────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(60).duration(400)}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            gap: spacing.sm,
          }}
          style={{ marginBottom: spacing.xl }}
        >
          {plan.map((day, index) => {
            const isSelected = index === selectedDay;
            const hasOverflow = day.totalHours > day.maxHours;
            const load =
              day.maxHours > 0 ? day.totalHours / day.maxHours : 0;

            return (
              <Pressable
                key={day.date}
                onPress={() => handleSelectDay(index)}
              >
                <View
                  style={{
                    width: 76,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.sm,
                    borderRadius: radius.lg,
                    borderCurve: "continuous",
                    backgroundColor: isSelected
                      ? colors.primary
                      : colors.surface,
                    alignItems: "center",
                    boxShadow: isSelected
                      ? `0 4px 16px ${colors.primary}40`
                      : "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  <Text
                    style={{
                      ...font.caption1,
                      fontWeight: "600",
                      color: isSelected
                        ? "rgba(255,255,255,0.8)"
                        : colors.textTertiary,
                      marginBottom: 4,
                    }}
                  >
                    {day.label}
                  </Text>
                  <Text
                    style={{
                      ...font.title2,
                      color: isSelected ? "#FFFFFF" : colors.textPrimary,
                      fontVariant: ["tabular-nums"],
                    }}
                  >
                    {day.tasks.length}
                  </Text>
                  <Text
                    style={{
                      ...font.caption2,
                      color: isSelected
                        ? "rgba(255,255,255,0.7)"
                        : colors.textTertiary,
                      marginTop: 2,
                    }}
                  >
                    {day.tasks.length === 1 ? "task" : "tasks"}
                  </Text>
                  <View
                    style={{
                      width: 36,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: isSelected
                        ? "rgba(255,255,255,0.3)"
                        : colors.borderLight,
                      marginTop: spacing.sm,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        height: "100%",
                        width: `${Math.min(load * 100, 100)}%`,
                        backgroundColor: hasOverflow
                          ? colors.danger
                          : isSelected
                            ? "#FFFFFF"
                            : colors.primary,
                        borderRadius: 2,
                      }}
                    />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* ── Day Content ───────────────────────────────────────── */}
      {currentDay && (
        <View style={{ paddingHorizontal: spacing.lg }}>
          <Animated.View
            entering={FadeIn.duration(300)}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: spacing.md,
            }}
          >
            <Text style={{ ...font.title3, color: colors.textPrimary }}>
              {currentDay.label}
            </Text>
            <Text
              selectable
              style={{
                ...font.footnote,
                fontWeight: "500",
                color: colors.textSecondary,
                fontVariant: ["tabular-nums"],
              }}
            >
              {currentDay.totalHours.toFixed(1)}h / {currentDay.maxHours}h
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeIn.duration(300)}
            style={{ marginBottom: spacing.lg }}
          >
            <ProgressBar
              value={
                currentDay.maxHours > 0
                  ? Math.min(
                      (currentDay.totalHours / currentDay.maxHours) * 100,
                      100
                    )
                  : 0
              }
              color={
                currentDay.totalHours > currentDay.maxHours
                  ? colors.danger
                  : colors.primary
              }
              height={8}
            />
          </Animated.View>

          {currentDay.tasks.length === 0 ? (
            <Animated.View entering={FadeIn.duration(300)}>
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
                  name="checkmark.circle"
                  size={40}
                  tintColor={colors.success}
                />
                <Text
                  style={{
                    ...font.headline,
                    color: colors.textPrimary,
                    marginTop: spacing.md,
                  }}
                >
                  All clear!
                </Text>
                <Text
                  style={{
                    ...font.subhead,
                    color: colors.textSecondary,
                    marginTop: 4,
                  }}
                >
                  No tasks planned for this day
                </Text>
              </View>
            </Animated.View>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {currentDay.tasks.map((task, index) => {
                const statusConfig: Record<
                  string,
                  { icon: string; color: string }
                > = {
                  pending: { icon: "circle", color: colors.textTertiary },
                  in_progress: {
                    icon: "circle.lefthalf.filled",
                    color: colors.primary,
                  },
                  completed: {
                    icon: "checkmark.circle.fill",
                    color: colors.success,
                  },
                };
                const sc =
                  statusConfig[task.status] ?? statusConfig.pending;

                return (
                  <Animated.View
                    key={task.id}
                    entering={FadeInDown.delay(index * 50).duration(400)}
                  >
                    <View
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: radius.md,
                        borderCurve: "continuous",
                        padding: spacing.lg,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "flex-start",
                        }}
                      >
                        <SymbolView
                          name={sc.icon as any}
                          size={20}
                          tintColor={sc.color}
                          style={{ marginRight: spacing.md, marginTop: 2 }}
                        />
                        <View style={{ flex: 1 }}>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: 4,
                            }}
                          >
                            <Text
                              style={{
                                ...font.subhead,
                                fontWeight: "600",
                                color: colors.textPrimary,
                                flex: 1,
                                marginRight: spacing.sm,
                              }}
                              numberOfLines={2}
                            >
                              {task.title}
                            </Text>
                            <Badge priority={task.priority} />
                          </View>
                          {task.description && (
                            <Text
                              style={{
                                ...font.footnote,
                                color: colors.textSecondary,
                                marginBottom: spacing.sm,
                              }}
                              numberOfLines={2}
                            >
                              {task.description}
                            </Text>
                          )}
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: spacing.md,
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
                                selectable
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
                                Due{" "}
                                {new Date(
                                  task.deadline
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          )}

          {currentDay.totalHours > currentDay.maxHours && (
            <Animated.View
              entering={FadeInDown.delay(
                currentDay.tasks.length * 50 + 100
              ).duration(400)}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.dangerLight,
                  padding: spacing.md,
                  borderRadius: radius.md,
                  borderCurve: "continuous",
                  marginTop: spacing.md,
                  gap: spacing.sm,
                }}
              >
                <SymbolView
                  name="exclamationmark.triangle.fill"
                  size={16}
                  tintColor={colors.danger}
                />
                <Text
                  style={{
                    ...font.footnote,
                    color: colors.danger,
                    fontWeight: "500",
                    flex: 1,
                  }}
                >
                  This day is overloaded by{" "}
                  {(currentDay.totalHours - currentDay.maxHours).toFixed(1)}
                  h. Consider moving tasks.
                </Text>
              </View>
            </Animated.View>
          )}
        </View>
      )}
    </ScrollView>
  );
}
