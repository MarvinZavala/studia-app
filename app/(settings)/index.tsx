import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  Pressable,
  TextInput,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useFocusEffect } from "expo-router";
import { SymbolView } from "expo-symbols";
import * as Haptics from "expo-haptics";
import Slider from "@react-native-community/slider";

import { colors, spacing, radius, font } from "@/lib/theme";
import { useTimerStore } from "@/lib/stores/timer-store";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

const APP_VERSION = "1.0.0";

// ─── Grouped Cell ───────────────────────────────────────────────
function Cell({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  onPress,
  isDestructive,
  isFirst,
  isLast,
}: {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  value?: string;
  onPress?: () => void;
  isDestructive?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: pressed && onPress ? colors.surfaceSecondary : colors.surface,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderTopLeftRadius: isFirst ? radius.md : 0,
        borderTopRightRadius: isFirst ? radius.md : 0,
        borderBottomLeftRadius: isLast ? radius.md : 0,
        borderBottomRightRadius: isLast ? radius.md : 0,
        borderCurve: "continuous",
      })}
    >
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 7,
          borderCurve: "continuous",
          backgroundColor: iconBg,
          alignItems: "center",
          justifyContent: "center",
          marginRight: spacing.md,
        }}
      >
        <SymbolView name={icon as any} size={16} tintColor={iconColor} />
      </View>
      <Text
        style={{
          ...font.body,
          flex: 1,
          color: isDestructive ? colors.danger : colors.textPrimary,
        }}
      >
        {label}
      </Text>
      {value && (
        <Text
          selectable
          style={{
            ...font.body,
            color: colors.textSecondary,
            fontVariant: ["tabular-nums"],
            marginRight: onPress ? spacing.xs : 0,
          }}
        >
          {value}
        </Text>
      )}
      {onPress && !isDestructive && (
        <SymbolView name="chevron.right" size={14} tintColor={colors.textTertiary} />
      )}
      {!isLast && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 62,
            right: 0,
            height: 0.5,
            backgroundColor: colors.separator,
          }}
        />
      )}
    </Pressable>
  );
}

// ─── Section Header ─────────────────────────────────────────────
function SectionLabel({ title, delay }: { title: string; delay: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(300)}>
      <Text
        style={{
          ...font.footnote,
          color: colors.textSecondary,
          textTransform: "uppercase",
          marginBottom: spacing.sm,
          marginLeft: spacing.lg,
          marginTop: spacing.xl,
        }}
      >
        {title}
      </Text>
    </Animated.View>
  );
}

export default function SettingsScreen() {
  const timerStore = useTimerStore();
  const { user, signOut } = useAuth();
  const [displayName, setDisplayName] = useState("Student");
  const [userEmail, setUserEmail] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [studyHoursPerDay, setStudyHoursPerDay] = useState(4);
  const [weeklyBudget, setWeeklyBudget] = useState(100);

  const [totalStudyHours, setTotalStudyHours] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [memberSince, setMemberSince] = useState("");

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [user])
  );

  async function loadProfile() {
    if (!user) return;
    setUserEmail(user.email ?? "");
    setMemberSince(
      new Date(user.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    );

    const { data: profile } = await supabase
      .from("studia_profiles")
      .select("display_name")
      .maybeSingle();
    if (profile?.display_name) setDisplayName(profile.display_name);

    try {
      const stored = localStorage.getItem("studentos_study_hours");
      if (stored) setStudyHoursPerDay(parseFloat(stored));
    } catch {}

    const { data: budgetSettings } = await supabase
      .from("studia_budget_settings")
      .select("weekly_budget")
      .maybeSingle();
    if (budgetSettings) setWeeklyBudget(budgetSettings.weekly_budget);

    const { data: sessions } = await supabase
      .from("studia_study_sessions")
      .select("duration_minutes");
    const totalMins = (sessions ?? []).reduce(
      (sum: number, s: any) => sum + (s.duration_minutes ?? 0),
      0
    );
    setTotalStudyHours(Math.round(totalMins / 60));

    const { data: tasks } = await supabase
      .from("studia_tasks")
      .select("id")
      .eq("status", "completed");
    setTotalTasks(tasks?.length ?? 0);

    const { data: streak } = await supabase
      .from("studia_streaks")
      .select("current_streak, longest_streak")
      .maybeSingle();
    setCurrentStreak(streak?.current_streak ?? 0);
    setLongestStreak(streak?.longest_streak ?? 0);
  }

  function handleStudyHoursChange(value: number) {
    const rounded = Math.round(value * 2) / 2;
    setStudyHoursPerDay(rounded);
    localStorage.setItem("studentos_study_hours", String(rounded));
  }

  async function handleWeeklyBudgetChange(value: number) {
    const rounded = Math.round(value / 5) * 5;
    setWeeklyBudget(rounded);
    await supabase
      .from("studia_budget_settings")
      .upsert({ user_id: user?.id, weekly_budget: rounded });
  }

  function handleStartEditName() {
    if (process.env.EXPO_OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditNameValue(displayName);
    setIsEditingName(true);
  }

  async function handleSaveName() {
    const trimmed = editNameValue.trim();
    if (!trimmed) return;
    if (process.env.EXPO_OS === "ios") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setDisplayName(trimmed);
    setIsEditingName(false);
    await supabase
      .from("studia_profiles")
      .update({ display_name: trimmed })
      .eq("id", user?.id);
  }

  function handleResetStreak() {
    if (process.env.EXPO_OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert(
      "Reset Streak",
      "This will reset your current study streak to 0. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await supabase
              .from("studia_streaks")
              .update({ current_streak: 0 })
              .eq("user_id", user?.id);
            setCurrentStreak(0);
          },
        },
      ]
    );
  }

  function handleClearCompletedTasks() {
    if (process.env.EXPO_OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert(
      "Clear Completed Tasks",
      "Remove all completed tasks from your planner? Active tasks will not be affected.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await supabase
              .from("studia_tasks")
              .delete()
              .eq("user_id", user?.id)
              .eq("status", "completed");
            setTotalTasks(0);
            if (process.env.EXPO_OS === "ios") {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
            }
          },
        },
      ]
    );
  }

  function handleSignOut() {
    if (process.env.EXPO_OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => signOut(),
      },
    ]);
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Profile Card ──────────────────────────────────────── */}
      <Animated.View entering={FadeIn.duration(400)}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderCurve: "continuous",
            padding: spacing.lg,
            marginTop: spacing.lg,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.lg,
          }}
        >
          {/* Avatar */}
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 26,
                fontWeight: "700",
                color: "#FFFFFF",
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            {isEditingName ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                }}
              >
                <TextInput
                  value={editNameValue}
                  onChangeText={setEditNameValue}
                  autoFocus
                  style={{
                    ...font.title3,
                    color: colors.textPrimary,
                    backgroundColor: colors.surfaceSecondary,
                    borderRadius: radius.sm,
                    borderCurve: "continuous",
                    paddingVertical: 6,
                    paddingHorizontal: spacing.md,
                    flex: 1,
                  }}
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                />
                <Pressable
                  onPress={handleSaveName}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.6 : 1,
                    backgroundColor: colors.primary,
                    borderRadius: 8,
                    borderCurve: "continuous",
                    padding: 8,
                  })}
                >
                  <SymbolView name="checkmark" size={14} tintColor="#FFFFFF" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={handleStartEditName}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Text
                  style={{
                    ...font.title3,
                    color: colors.textPrimary,
                  }}
                >
                  {displayName}
                </Text>
                <SymbolView
                  name="pencil.circle.fill"
                  size={18}
                  tintColor={colors.textTertiary}
                />
              </Pressable>
            )}
            <Text
              style={{
                ...font.subhead,
                color: colors.textSecondary,
                marginTop: 2,
              }}
            >
              {userEmail}
            </Text>
            <Text
              style={{
                ...font.caption1,
                color: colors.textTertiary,
                marginTop: 2,
              }}
            >
              Member since {memberSince}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* ── Stats Row ─────────────────────────────────────────── */}
      <Animated.View
        entering={FadeInDown.delay(50).duration(300)}
        style={{
          flexDirection: "row",
          gap: spacing.sm,
          marginTop: spacing.lg,
        }}
      >
        {[
          { label: "Studied", value: `${totalStudyHours}h`, icon: "book.fill", iconColor: colors.primary, bg: colors.primaryLight },
          { label: "Done", value: String(totalTasks), icon: "checkmark.circle.fill", iconColor: colors.success, bg: colors.successLight },
          { label: "Streak", value: String(currentStreak), icon: "flame.fill", iconColor: colors.warning, bg: colors.warningLight },
          { label: "Best", value: String(longestStreak), icon: "trophy.fill", iconColor: "#AF52DE", bg: "#F5EDFC" },
        ].map((stat, i) => (
          <View
            key={stat.label}
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              borderCurve: "continuous",
              paddingVertical: spacing.md,
              alignItems: "center",
              gap: 6,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                borderCurve: "continuous",
                backgroundColor: stat.bg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SymbolView name={stat.icon as any} size={16} tintColor={stat.iconColor} />
            </View>
            <Text
              selectable
              style={{
                ...font.headline,
                fontWeight: "700",
                color: colors.textPrimary,
                fontVariant: ["tabular-nums"],
              }}
            >
              {stat.value}
            </Text>
            <Text style={{ ...font.caption2, color: colors.textTertiary }}>
              {stat.label}
            </Text>
          </View>
        ))}
      </Animated.View>

      {/* ── Focus Timer ───────────────────────────────────────── */}
      <SectionLabel title="Focus Timer" delay={100} />
      <Animated.View entering={FadeInDown.delay(100).duration(300)}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderCurve: "continuous",
            padding: spacing.lg,
          }}
        >
          {/* Focus Duration */}
          <View style={{ marginBottom: spacing.lg }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: spacing.sm,
              }}
            >
              <Text style={{ ...font.subhead, color: colors.textPrimary }}>
                Focus Duration
              </Text>
              <Text
                selectable
                style={{
                  ...font.subhead,
                  fontWeight: "600",
                  color: colors.primary,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {timerStore.focusDuration} min
              </Text>
            </View>
            <Slider
              minimumValue={5}
              maximumValue={60}
              step={5}
              value={timerStore.focusDuration}
              onValueChange={(v) => timerStore.setFocusDuration(v)}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.borderLight}
              thumbTintColor={colors.primary}
            />
          </View>

          {/* Break Duration */}
          <View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: spacing.sm,
              }}
            >
              <Text style={{ ...font.subhead, color: colors.textPrimary }}>
                Break Duration
              </Text>
              <Text
                selectable
                style={{
                  ...font.subhead,
                  fontWeight: "600",
                  color: colors.success,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {timerStore.breakDuration} min
              </Text>
            </View>
            <Slider
              minimumValue={1}
              maximumValue={30}
              step={1}
              value={timerStore.breakDuration}
              onValueChange={(v) => timerStore.setBreakDuration(v)}
              minimumTrackTintColor={colors.success}
              maximumTrackTintColor={colors.borderLight}
              thumbTintColor={colors.success}
            />
          </View>
        </View>
      </Animated.View>

      {/* ── Goals ─────────────────────────────────────────────── */}
      <SectionLabel title="Goals" delay={150} />
      <Animated.View entering={FadeInDown.delay(150).duration(300)}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderCurve: "continuous",
            padding: spacing.lg,
          }}
        >
          {/* Daily study goal */}
          <View style={{ marginBottom: spacing.lg }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: spacing.sm,
              }}
            >
              <Text style={{ ...font.subhead, color: colors.textPrimary }}>
                Daily Study Goal
              </Text>
              <Text
                selectable
                style={{
                  ...font.subhead,
                  fontWeight: "600",
                  color: colors.warning,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {studyHoursPerDay.toFixed(1)} hrs
              </Text>
            </View>
            <Slider
              minimumValue={1}
              maximumValue={12}
              step={0.5}
              value={studyHoursPerDay}
              onValueChange={handleStudyHoursChange}
              minimumTrackTintColor={colors.warning}
              maximumTrackTintColor={colors.borderLight}
              thumbTintColor={colors.warning}
            />
          </View>

          {/* Weekly budget */}
          <View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: spacing.sm,
              }}
            >
              <Text style={{ ...font.subhead, color: colors.textPrimary }}>
                Weekly Budget
              </Text>
              <Text
                selectable
                style={{
                  ...font.subhead,
                  fontWeight: "600",
                  color: colors.success,
                  fontVariant: ["tabular-nums"],
                }}
              >
                ${weeklyBudget}
              </Text>
            </View>
            <Slider
              minimumValue={20}
              maximumValue={500}
              step={5}
              value={weeklyBudget}
              onValueChange={handleWeeklyBudgetChange}
              minimumTrackTintColor={colors.success}
              maximumTrackTintColor={colors.borderLight}
              thumbTintColor={colors.success}
            />
          </View>
        </View>
      </Animated.View>

      {/* ── Data ──────────────────────────────────────────────── */}
      <SectionLabel title="Data" delay={200} />
      <Animated.View entering={FadeInDown.delay(200).duration(300)}>
        <View style={{ borderRadius: radius.md, borderCurve: "continuous", overflow: "hidden" }}>
          <Cell
            icon="arrow.counterclockwise"
            iconColor="#FFFFFF"
            iconBg={colors.warning}
            label="Reset Study Streak"
            value={`${currentStreak}d`}
            onPress={handleResetStreak}
            isFirst
          />
          <Cell
            icon="trash"
            iconColor="#FFFFFF"
            iconBg={colors.textSecondary}
            label="Clear Completed Tasks"
            value={`${totalTasks} tasks`}
            onPress={handleClearCompletedTasks}
            isLast
          />
        </View>
      </Animated.View>

      {/* ── Account ───────────────────────────────────────────── */}
      <SectionLabel title="Account" delay={250} />
      <Animated.View entering={FadeInDown.delay(250).duration(300)}>
        <View style={{ borderRadius: radius.md, borderCurve: "continuous", overflow: "hidden" }}>
          <Cell
            icon="envelope.fill"
            iconColor="#FFFFFF"
            iconBg={colors.primary}
            label="Email"
            value={userEmail}
            isFirst
          />
          <Cell
            icon="rectangle.portrait.and.arrow.right"
            iconColor="#FFFFFF"
            iconBg={colors.danger}
            label="Sign Out"
            onPress={handleSignOut}
            isDestructive
            isLast
          />
        </View>
      </Animated.View>

      {/* ── Footer ────────────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(300).duration(300)}>
        <View
          style={{
            alignItems: "center",
            paddingVertical: spacing.xxl,
          }}
        >
          <Text
            style={{
              ...font.footnote,
              color: colors.textTertiary,
              fontWeight: "500",
            }}
          >
            Studia
          </Text>
          <Text
            selectable
            style={{
              ...font.caption1,
              color: colors.textTertiary,
              marginTop: 4,
              fontVariant: ["tabular-nums"],
            }}
          >
            Version {APP_VERSION}
          </Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
}
