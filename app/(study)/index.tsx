import { useCallback, useEffect, useRef } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  LinearTransition,
} from "react-native-reanimated";
import { useFocusEffect } from "expo-router";
import { SymbolView } from "expo-symbols";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Svg, { Circle } from "react-native-svg";

import { colors, spacing, radius, font } from "@/lib/theme";
import { useAuth } from "@/lib/auth-context";
import {
  createStudySession,
  syncStreakForStudySession,
} from "@/lib/data/studia-api";
import { useStudyData } from "@/lib/features/study/use-study-data";
import { useTimer } from "@/lib/hooks/use-timer";

const CIRCLE_SIZE = 246;
const STROKE_WIDTH = 11;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const BG_COLORS = ["#EEF2FF", "#F3FDFF", "#FFF6EC"] as const;

interface MetricCardProps {
  icon: string;
  iconTint: string;
  iconBg: string;
  label: string;
  value: string;
}

function MetricCard({ icon, iconTint, iconBg, label, value }: MetricCardProps) {
  return (
    <View
      style={{
        flex: 1,
        borderRadius: radius.md,
        borderCurve: "continuous",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E6EBFF",
        padding: spacing.md,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          borderCurve: "continuous",
          backgroundColor: iconBg,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.sm,
        }}
      >
        <SymbolView name={icon as any} size={16} tintColor={iconTint} />
      </View>

      <Text
        selectable
        style={{
          ...font.title3,
          color: colors.textPrimary,
          fontWeight: "700",
          fontVariant: ["tabular-nums"],
        }}
      >
        {value}
      </Text>
      <Text style={{ ...font.caption1, color: colors.textSecondary, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

interface ActionButtonProps {
  icon: string;
  onPress: () => void;
  tint: string;
  bg: string;
  large?: boolean;
}

function ActionButton({ icon, onPress, tint, bg, large }: ActionButtonProps) {
  const size = large ? 74 : 54;
  const radiusSize = size / 2;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: radiusSize,
        borderCurve: "continuous",
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: `${tint}33`,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.75 : 1,
        transform: [{ scale: pressed ? 0.96 : 1 }],
      })}
    >
      <SymbolView name={icon as any} size={large ? 30 : 22} tintColor={tint} />
    </Pressable>
  );
}

export default function StudyScreen() {
  const timer = useTimer();
  const { user } = useAuth();
  const { recentSessions, weeklyMinutes, loadData } = useStudyData(user?.id);
  const syncedSessionsRef = useRef<number | null>(null);
  const latestSessionsRef = useRef(timer.sessionsCompleted);
  const isSyncingSessionsRef = useRef(false);

  latestSessionsRef.current = timer.sessionsCompleted;

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      loadData();
    }, [user?.id, loadData])
  );

  const syncCompletedSessions = useCallback(async () => {
    if (!user?.id || isSyncingSessionsRef.current) return;

    if (syncedSessionsRef.current === null) {
      syncedSessionsRef.current = latestSessionsRef.current;
      return;
    }

    const unsyncedSessions = latestSessionsRef.current - syncedSessionsRef.current;
    if (unsyncedSessions <= 0) return;

    isSyncingSessionsRef.current = true;
    let persistedCount = 0;

    try {
      for (let index = 0; index < unsyncedSessions; index += 1) {
        const completedAt = new Date();
        const durationMinutes = Math.max(1, timer.focusDuration);
        const startedAt = new Date(
          completedAt.getTime() - durationMinutes * 60 * 1000
        );

        await createStudySession(user.id, {
          started_at: startedAt.toISOString(),
          ended_at: completedAt.toISOString(),
          duration_minutes: durationMinutes,
          notes: "Focus session",
        });
        persistedCount += 1;

        try {
          await syncStreakForStudySession(user.id, completedAt);
        } catch {
          // Session is already stored; streak can recover on next completion.
        }
      }
    } catch {
      // Keep timer UX responsive; failed sync retries on next completion.
    } finally {
      if (syncedSessionsRef.current !== null) {
        syncedSessionsRef.current += persistedCount;
      }
      isSyncingSessionsRef.current = false;

      if (persistedCount > 0) {
        await loadData();
      }

      if (
        persistedCount > 0 &&
        (syncedSessionsRef.current ?? latestSessionsRef.current) <
          latestSessionsRef.current
      ) {
        void syncCompletedSessions();
      }
    }
  }, [loadData, timer.focusDuration, user?.id]);

  useEffect(() => {
    if (!user?.id) {
      syncedSessionsRef.current = latestSessionsRef.current;
      return;
    }

    if (syncedSessionsRef.current === null) {
      syncedSessionsRef.current = latestSessionsRef.current;
      return;
    }

    void syncCompletedSessions();
  }, [syncCompletedSessions, timer.sessionsCompleted, user?.id]);

  const minutes = Math.floor(timer.secondsRemaining / 60);
  const seconds = timer.secondsRemaining % 60;
  const timeDisplay = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const totalSeconds =
    timer.phase === "focus"
      ? timer.focusDuration * 60
      : timer.phase === "break"
        ? timer.breakDuration * 60
        : timer.focusDuration * 60;

  const progressRaw = totalSeconds > 0 ? 1 - timer.secondsRemaining / totalSeconds : 0;
  const progress = Math.max(0, Math.min(1, progressRaw));
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const phaseLabel =
    timer.phase === "focus"
      ? "Focus"
      : timer.phase === "break"
        ? "Break"
        : "Ready";

  const phaseColor =
    timer.phase === "focus"
      ? "#5664FF"
      : timer.phase === "break"
        ? "#2FBF72"
        : "#6F79A8";

  function handleStartPause() {
    if (process.env.EXPO_OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (timer.isRunning) {
      timer.pause();
    } else {
      timer.start();
    }
  }

  function handleReset() {
    if (process.env.EXPO_OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    timer.reset();
  }

  function handleSkip() {
    if (process.env.EXPO_OS === "ios") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (timer.phase === "focus") {
      timer.skipToBreak();
    } else {
      timer.skipToFocus();
    }
  }

  function formatDuration(mins: number): string {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  function formatSessionTime(isoString: string): string {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function formatSessionDate(isoString: string): string {
    const d = new Date(isoString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#EDF3FF" }}>
      <LinearGradient
        colors={BG_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", inset: 0 }}
      />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: 110,
          paddingTop: spacing.sm,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(360)}>
          <LinearGradient
            colors={["#5A5AFF", "#2E82F7", "#1AB1F0"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: radius.xl,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.32)",
              padding: spacing.lg,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                position: "absolute",
                right: -32,
                top: -56,
                width: 164,
                height: 164,
                borderRadius: 82,
                backgroundColor: "rgba(255,255,255,0.15)",
              }}
            />

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: spacing.md,
              }}
            >
              <View>
                <Text style={{ ...font.title2, color: "#FFFFFF", fontWeight: "800" }}>
                  Focus Studio
                </Text>
                <Text style={{ ...font.caption1, color: "rgba(255,255,255,0.82)", marginTop: 2 }}>
                  Deep-work timer with controlled breaks
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  borderRadius: radius.full,
                  borderCurve: "continuous",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text
                  style={{
                    ...font.footnote,
                    color: "#FFFFFF",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                  }}
                >
                  {phaseLabel}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <View
                style={{
                  flex: 1,
                  borderRadius: radius.md,
                  borderCurve: "continuous",
                  backgroundColor: "rgba(255,255,255,0.16)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.24)",
                  padding: spacing.sm + 2,
                }}
              >
                <Text style={{ ...font.caption2, color: "rgba(255,255,255,0.76)", textTransform: "uppercase" }}>
                  Focus Length
                </Text>
                <Text
                  selectable
                  style={{
                    ...font.subhead,
                    color: "#FFFFFF",
                    fontWeight: "700",
                    fontVariant: ["tabular-nums"],
                    marginTop: 2,
                  }}
                >
                  {timer.focusDuration} min
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  borderRadius: radius.md,
                  borderCurve: "continuous",
                  backgroundColor: "rgba(255,255,255,0.16)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.24)",
                  padding: spacing.sm + 2,
                }}
              >
                <Text style={{ ...font.caption2, color: "rgba(255,255,255,0.76)", textTransform: "uppercase" }}>
                  Break Length
                </Text>
                <Text
                  selectable
                  style={{
                    ...font.subhead,
                    color: "#FFFFFF",
                    fontWeight: "700",
                    fontVariant: ["tabular-nums"],
                    marginTop: 2,
                  }}
                >
                  {timer.breakDuration} min
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(70).duration(320)}
          style={{ alignItems: "center", marginTop: spacing.lg }}
        >
          <View
            style={{
              width: CIRCLE_SIZE + 26,
              height: CIRCLE_SIZE + 26,
              borderRadius: (CIRCLE_SIZE + 26) / 2,
              borderCurve: "continuous",
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#E7ECFF",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: CIRCLE_SIZE,
                height: CIRCLE_SIZE,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Svg
                width={CIRCLE_SIZE}
                height={CIRCLE_SIZE}
                style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}
              >
                <Circle
                  cx={CIRCLE_SIZE / 2}
                  cy={CIRCLE_SIZE / 2}
                  r={RADIUS}
                  stroke="#E8EDFF"
                  strokeWidth={STROKE_WIDTH}
                  fill="none"
                />
                <Circle
                  cx={CIRCLE_SIZE / 2}
                  cy={CIRCLE_SIZE / 2}
                  r={RADIUS}
                  stroke={phaseColor}
                  strokeWidth={STROKE_WIDTH}
                  fill="none"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </Svg>

              <Text
                selectable
                style={{
                  fontSize: 52,
                  fontWeight: "300",
                  color: colors.textPrimary,
                  fontVariant: ["tabular-nums"],
                  letterSpacing: 1.6,
                }}
              >
                {timeDisplay}
              </Text>
              <Text
                style={{
                  ...font.caption1,
                  color: colors.textSecondary,
                  marginTop: 2,
                  textTransform: "uppercase",
                  letterSpacing: 0.9,
                }}
              >
                {phaseLabel} Mode
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(120).duration(320)}
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: spacing.lg,
            marginTop: spacing.lg,
            marginBottom: spacing.xl,
          }}
        >
          <ActionButton
            icon="arrow.counterclockwise"
            onPress={handleReset}
            tint="#6471A4"
            bg="#EEF3FF"
          />
          <ActionButton
            icon={timer.isRunning ? "pause.fill" : "play.fill"}
            onPress={handleStartPause}
            tint="#FFFFFF"
            bg={phaseColor}
            large
          />
          <ActionButton
            icon="forward.fill"
            onPress={handleSkip}
            tint="#6471A4"
            bg="#EEF3FF"
          />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(170).duration(320)}
          style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg }}
        >
          <MetricCard
            icon="flame.fill"
            iconTint={colors.secondary}
            iconBg="#FFE8EF"
            label="Sessions"
            value={`${timer.sessionsCompleted}`}
          />
          <MetricCard
            icon="chart.bar.fill"
            iconTint={colors.primary}
            iconBg="#ECE8FF"
            label="This Week"
            value={formatDuration(weeklyMinutes)}
          />
        </Animated.View>

        {recentSessions.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(220).duration(320)}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: spacing.md,
              }}
            >
              <View>
                <Text style={{ ...font.title3, color: colors.textPrimary, fontWeight: "700" }}>
                  Recent Sessions
                </Text>
                <Text style={{ ...font.caption1, color: colors.textSecondary, marginTop: 2 }}>
                  Keep your rhythm with consistent deep work
                </Text>
              </View>
            </View>

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
                const rowTint = index % 2 === 0 ? "#EEF3FF" : "#EAFBF0";
                const iconTint = index % 2 === 0 ? colors.primary : colors.success;

                return (
                  <Animated.View
                    key={session.id}
                    entering={FadeInDown.delay(250 + index * 45).duration(250)}
                    layout={LinearTransition.duration(220)}
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
                          backgroundColor: rowTint,
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: spacing.md,
                        }}
                      >
                        <SymbolView
                          name="book.fill"
                          size={17}
                          tintColor={iconTint}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            ...font.subhead,
                            color: colors.textPrimary,
                            fontWeight: "600",
                          }}
                          numberOfLines={1}
                        >
                          {session.notes ?? "Study session"}
                        </Text>
                        <Text
                          style={{ ...font.caption1, color: colors.textSecondary, marginTop: 2 }}
                        >
                          {formatSessionDate(session.started_at)} at {formatSessionTime(session.started_at)}
                        </Text>
                      </View>

                      <View
                        style={{
                          backgroundColor: rowTint,
                          borderRadius: radius.sm,
                          borderCurve: "continuous",
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                        }}
                      >
                        <Text
                          selectable
                          style={{
                            ...font.footnote,
                            color: iconTint,
                            fontWeight: "700",
                            fontVariant: ["tabular-nums"],
                          }}
                        >
                          {session.duration_minutes ?? 0}m
                        </Text>
                      </View>

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
        ) : null}
      </ScrollView>
    </View>
  );
}
