import { useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  LinearTransition,
} from "react-native-reanimated";
import { useFocusEffect } from "expo-router";
import { SymbolView } from "expo-symbols";
import * as Haptics from "expo-haptics";
import Svg, { Circle } from "react-native-svg";

import { colors, spacing, radius, font } from "@/lib/theme";
import { supabase } from "@/lib/supabase";
import { useTimer } from "@/lib/hooks/use-timer";
import type { StudySession } from "@/lib/types/database";

const CIRCLE_SIZE = 240;
const STROKE_WIDTH = 10;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function StudyScreen() {
  const timer = useTimer();
  const [recentSessions, setRecentSessions] = useState<StudySession[]>([]);
  const [weeklyMinutes, setWeeklyMinutes] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    const { data: allSessions } = await supabase
      .from("studia_study_sessions")
      .select("*")
      .order("started_at", { ascending: false });

    const sessions = (allSessions ?? []) as StudySession[];
    setRecentSessions(sessions.slice(0, 5));

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const thisWeek = sessions.filter(
      (s) => new Date(s.started_at) >= weekStart
    );
    const totalMins = thisWeek.reduce(
      (sum, s) => sum + (s.duration_minutes ?? 0),
      0
    );
    setWeeklyMinutes(totalMins);
  }

  const minutes = Math.floor(timer.secondsRemaining / 60);
  const seconds = timer.secondsRemaining % 60;
  const timeDisplay = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const totalSeconds =
    timer.phase === "focus"
      ? timer.focusDuration * 60
      : timer.phase === "break"
        ? timer.breakDuration * 60
        : timer.focusDuration * 60;

  const progress =
    totalSeconds > 0 ? 1 - timer.secondsRemaining / totalSeconds : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const phaseLabel =
    timer.phase === "focus"
      ? "Focus"
      : timer.phase === "break"
        ? "Break"
        : "Ready";

  const phaseColor =
    timer.phase === "focus"
      ? colors.primary
      : timer.phase === "break"
        ? colors.success
        : colors.textTertiary;

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
    return `${h}h ${m}m`;
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
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* ── Timer Ring ────────────────────────────────────────── */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={{ alignItems: "center", paddingTop: spacing.lg, marginBottom: spacing.xl }}
      >
        {/* Phase pill */}
        <View
          style={{
            backgroundColor: phaseColor + "18",
            borderRadius: radius.full,
            paddingVertical: 6,
            paddingHorizontal: 18,
            marginBottom: spacing.xl,
          }}
        >
          <Text
            style={{
              ...font.footnote,
              fontWeight: "700",
              color: phaseColor,
              textTransform: "uppercase",
              letterSpacing: 1.5,
            }}
          >
            {phaseLabel}
          </Text>
        </View>

        {/* Circle */}
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
              stroke={colors.borderLight}
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
              fontSize: 56,
              fontWeight: "200",
              color: colors.textPrimary,
              fontVariant: ["tabular-nums"],
              letterSpacing: 2,
            }}
          >
            {timeDisplay}
          </Text>
        </View>
      </Animated.View>

      {/* ── Controls ──────────────────────────────────────────── */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(300)}
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: spacing.lg,
          marginBottom: spacing.xxl,
        }}
      >
        <Pressable
          onPress={handleReset}
          style={({ pressed }) => ({
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: colors.surface,
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <SymbolView
            name="arrow.counterclockwise"
            size={22}
            tintColor={colors.textSecondary}
          />
        </Pressable>

        <Pressable
          onPress={handleStartPause}
          style={({ pressed }) => ({
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: phaseColor,
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 6px 20px ${phaseColor}40`,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <SymbolView
            name={timer.isRunning ? "pause.fill" : "play.fill"}
            size={28}
            tintColor="#FFFFFF"
          />
        </Pressable>

        <Pressable
          onPress={handleSkip}
          style={({ pressed }) => ({
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: colors.surface,
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <SymbolView
            name="forward.fill"
            size={22}
            tintColor={colors.textSecondary}
          />
        </Pressable>
      </Animated.View>

      {/* ── Stats Row ─────────────────────────────────────────── */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(300)}
        style={{
          flexDirection: "row",
          gap: spacing.sm,
          paddingHorizontal: spacing.lg,
          marginBottom: spacing.xl,
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderCurve: "continuous",
            paddingVertical: spacing.lg,
            alignItems: "center",
            gap: 4,
          }}
        >
          <SymbolView name="flame.fill" size={22} tintColor={colors.secondary} />
          <Text
            selectable
            style={{
              ...font.title2,
              color: colors.textPrimary,
              fontVariant: ["tabular-nums"],
            }}
          >
            {timer.sessionsCompleted}
          </Text>
          <Text style={{ ...font.caption1, color: colors.textSecondary }}>
            Sessions
          </Text>
        </View>

        <View
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderCurve: "continuous",
            paddingVertical: spacing.lg,
            alignItems: "center",
            gap: 4,
          }}
        >
          <SymbolView name="chart.bar.fill" size={22} tintColor={colors.primary} />
          <Text
            selectable
            style={{
              ...font.title2,
              color: colors.textPrimary,
              fontVariant: ["tabular-nums"],
            }}
          >
            {formatDuration(weeklyMinutes)}
          </Text>
          <Text style={{ ...font.caption1, color: colors.textSecondary }}>
            This Week
          </Text>
        </View>
      </Animated.View>

      {/* ── Recent Sessions ───────────────────────────────────── */}
      {recentSessions.length > 0 && (
        <Animated.View
          entering={FadeInDown.delay(300).duration(300)}
          style={{ paddingHorizontal: spacing.lg }}
        >
          <Text
            style={{
              ...font.title3,
              color: colors.textPrimary,
              marginBottom: spacing.md,
            }}
          >
            Recent Sessions
          </Text>

          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              borderCurve: "continuous",
              overflow: "hidden",
            }}
          >
            {recentSessions.map((session, index) => {
              const isLast = index === recentSessions.length - 1;
              return (
                <Animated.View
                  key={session.id}
                  entering={FadeInDown.delay(350 + index * 50).duration(250)}
                  layout={LinearTransition.duration(250)}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: spacing.md,
                      paddingHorizontal: spacing.lg,
                      gap: spacing.md,
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
                        {formatSessionDate(session.started_at)} at{" "}
                        {formatSessionTime(session.started_at)}
                      </Text>
                    </View>
                    <Text
                      selectable
                      style={{
                        ...font.subhead,
                        fontWeight: "600",
                        color: colors.primary,
                        fontVariant: ["tabular-nums"],
                      }}
                    >
                      {session.duration_minutes ?? 0}m
                    </Text>
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
      )}
    </ScrollView>
  );
}
