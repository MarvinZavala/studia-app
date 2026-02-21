import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  Pressable,
  TextInput,
  Platform,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useFocusEffect } from "expo-router";
import { SymbolView } from "expo-symbols";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Slider from "@react-native-community/slider";

import { colors, spacing, radius, font } from "@/lib/theme";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useTimerStore } from "@/lib/stores/timer-store";
import { useAuth } from "@/lib/auth-context";
import { SectionLabel } from "@/components/settings/section-label";
import { SettingCell } from "@/components/settings/setting-cell";
import {
  clearCompletedTasks,
  countCompletedTasks,
  getBudgetSettings,
  getProfileDisplayName,
  getStreak,
  listStudySessionsForUser,
  resetCurrentStreak,
  updateProfileDisplayName,
  upsertWeeklyBudget,
} from "@/lib/data/studia-api";

const APP_VERSION = "1.0.0";

const settingsFonts = {
  heading: Platform.select({
    ios: "AvenirNext-DemiBold",
    android: "sans-serif-medium",
    default: undefined,
  }),
  body: Platform.select({
    ios: "AvenirNext-Regular",
    android: "sans-serif",
    default: undefined,
  }),
};

interface StatTileProps {
  label: string;
  value: string;
  icon: string;
  iconColor: string;
  iconBg: string;
}

function StatTile({ label, value, icon, iconColor, iconBg }: StatTileProps) {
  return (
    <View
      style={{
        width: "48.4%",
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: colors.borderLight,
        padding: spacing.md,
        gap: 6,
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
        }}
      >
        <SymbolView name={icon as any} size={16} tintColor={iconColor} />
      </View>
      <Text
        selectable
        style={{
          ...font.title3,
          color: colors.textPrimary,
          fontVariant: ["tabular-nums"],
          fontFamily: settingsFonts.heading,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          ...font.caption1,
          color: colors.textSecondary,
          fontFamily: settingsFonts.body,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

interface SliderPanelProps {
  title: string;
  subtitle: string;
  icon: string;
  tint: string;
  valueLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onValueChange: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
}

function SliderPanel({
  title,
  subtitle,
  icon,
  tint,
  valueLabel,
  min,
  max,
  step,
  value,
  onValueChange,
  onSlidingComplete,
}: SliderPanelProps) {
  return (
    <View style={{ paddingVertical: spacing.md + 2 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: spacing.sm,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              borderCurve: "continuous",
              backgroundColor: `${tint}22`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SymbolView name={icon as any} size={16} tintColor={tint} />
          </View>
          <View>
            <Text
              style={{
                ...font.subhead,
                color: colors.textPrimary,
                fontWeight: "600",
                fontFamily: settingsFonts.heading,
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                ...font.caption1,
                color: colors.textSecondary,
                fontFamily: settingsFonts.body,
              }}
            >
              {subtitle}
            </Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: `${tint}22`,
            borderRadius: radius.full,
            borderCurve: "continuous",
            paddingHorizontal: 12,
            paddingVertical: 6,
          }}
        >
          <Text
            selectable
            style={{
              ...font.footnote,
              color: tint,
              fontWeight: "700",
              fontVariant: ["tabular-nums"],
            }}
          >
            {valueLabel}
          </Text>
        </View>
      </View>

      <Slider
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onValueChange}
        onSlidingComplete={onSlidingComplete}
        minimumTrackTintColor={tint}
        maximumTrackTintColor={colors.borderLight}
        thumbTintColor={tint}
      />
    </View>
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
  const [savedWeeklyBudget, setSavedWeeklyBudget] = useState(100);

  const [totalStudyHours, setTotalStudyHours] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [memberSince, setMemberSince] = useState("");

  const momentumScore = useMemo(() => {
    const raw = currentStreak * 8 + totalStudyHours * 1.5 + totalTasks * 3;
    return Math.min(100, Math.max(12, Math.round(raw)));
  }, [currentStreak, totalStudyHours, totalTasks]);

  const momentumTone =
    momentumScore >= 75
      ? colors.success
      : momentumScore >= 45
        ? colors.warning
        : colors.secondary;

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

    try {
      const stored = localStorage.getItem("studentos_study_hours");
      if (stored) setStudyHoursPerDay(parseFloat(stored));
    } catch {
      // ignore local settings parse issues
    }

    try {
      const [name, budgetSettings, sessions, completedTasks, streak] =
        await Promise.all([
          getProfileDisplayName(user.id),
          getBudgetSettings(user.id),
          listStudySessionsForUser(user.id),
          countCompletedTasks(user.id),
          getStreak(user.id),
        ]);

      if (name) setDisplayName(name);
      if (budgetSettings) {
        setWeeklyBudget(budgetSettings.weekly_budget);
        setSavedWeeklyBudget(budgetSettings.weekly_budget);
      }

      const totalMins = sessions.reduce(
        (sum, session) => sum + (session.duration_minutes ?? 0),
        0
      );

      setTotalStudyHours(Math.round(totalMins / 60));
      setTotalTasks(completedTasks);
      setCurrentStreak(streak?.current_streak ?? 0);
      setLongestStreak(streak?.longest_streak ?? 0);
    } catch {
      setTotalStudyHours(0);
      setTotalTasks(0);
      setCurrentStreak(0);
      setLongestStreak(0);
    }
  }

  function handleStudyHoursPreview(value: number) {
    const rounded = Math.round(value * 2) / 2;
    setStudyHoursPerDay(rounded);
  }

  function handleStudyHoursCommit(value: number) {
    const rounded = Math.round(value * 2) / 2;
    setStudyHoursPerDay(rounded);
    localStorage.setItem("studentos_study_hours", String(rounded));
  }

  function handleWeeklyBudgetPreview(value: number) {
    const rounded = Math.round(value / 5) * 5;
    setWeeklyBudget(rounded);
  }

  async function handleWeeklyBudgetCommit(value: number) {
    const rounded = Math.round(value / 5) * 5;
    setWeeklyBudget(rounded);
    if (!user?.id || rounded === savedWeeklyBudget) return;

    try {
      await upsertWeeklyBudget(user.id, rounded);
      setSavedWeeklyBudget(rounded);
    } catch {
      Alert.alert("Could not save budget", "Please try again in a moment.");
      setWeeklyBudget(savedWeeklyBudget);
    }
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
    if (!trimmed || !user?.id) return;

    if (process.env.EXPO_OS === "ios") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const previousName = displayName;
    setDisplayName(trimmed);
    setIsEditingName(false);

    try {
      await updateProfileDisplayName(user.id, trimmed);
    } catch {
      setDisplayName(previousName);
      Alert.alert("Could not update name", "Please try again.");
    }
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
            if (!user?.id) return;
            try {
              await resetCurrentStreak(user.id);
              setCurrentStreak(0);
            } catch {
              Alert.alert("Could not reset streak", "Please try again.");
            }
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
            if (!user?.id) return;
            try {
              await clearCompletedTasks(user.id);
              setTotalTasks(0);
              if (process.env.EXPO_OS === "ios") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch {
              Alert.alert("Could not clear tasks", "Please try again.");
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

  const stats = [
    {
      label: "Hours Studied",
      value: `${totalStudyHours}h`,
      icon: "book.fill",
      iconColor: colors.primary,
      iconBg: colors.primaryLight,
    },
    {
      label: "Completed",
      value: `${totalTasks}`,
      icon: "checkmark.circle.fill",
      iconColor: colors.success,
      iconBg: colors.successLight,
    },
    {
      label: "Current Streak",
      value: `${currentStreak}d`,
      icon: "flame.fill",
      iconColor: colors.warning,
      iconBg: colors.warningLight,
    },
    {
      label: "Best Streak",
      value: `${longestStreak}d`,
      icon: "trophy.fill",
      iconColor: "#B983FF",
      iconBg: "#F2E9FF",
    },
  ];

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        paddingBottom: 110,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeIn.duration(380)}>
        <LinearGradient
          colors={[colors.primaryDark, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: radius.xl,
            borderCurve: "continuous",
            padding: spacing.lg,
            marginTop: spacing.lg,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              position: "absolute",
              top: -28,
              right: -18,
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: "rgba(255,255,255,0.12)",
            }}
          />

          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <View
              style={{
                width: 62,
                height: 62,
                borderRadius: 31,
                borderWidth: 2,
                borderColor: "rgba(255,255,255,0.3)",
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 26,
                  color: "#FFFFFF",
                  fontFamily: settingsFonts.heading,
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              {isEditingName ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <TextInput
                    value={editNameValue}
                    onChangeText={setEditNameValue}
                    autoFocus
                    style={{
                      ...font.subhead,
                      color: "#FFFFFF",
                      backgroundColor: "rgba(255,255,255,0.2)",
                      borderRadius: radius.sm,
                      borderCurve: "continuous",
                      paddingVertical: 8,
                      paddingHorizontal: spacing.md,
                      flex: 1,
                      fontFamily: settingsFonts.body,
                    }}
                    placeholder="Your name"
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    returnKeyType="done"
                    onSubmitEditing={handleSaveName}
                  />
                  <Pressable
                    onPress={handleSaveName}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.7 : 1,
                      backgroundColor: "rgba(255,255,255,0.22)",
                      borderRadius: radius.sm,
                      borderCurve: "continuous",
                      padding: 9,
                    })}
                  >
                    <SymbolView name="checkmark" size={14} tintColor="#FFFFFF" />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={handleStartEditName}
                  accessibilityRole="button"
                  accessibilityLabel="Edit display name"
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text
                    style={{
                      ...font.title3,
                      color: "#FFFFFF",
                      fontFamily: settingsFonts.heading,
                    }}
                  >
                    {displayName}
                  </Text>
                  <SymbolView name="pencil.circle.fill" size={17} tintColor="rgba(255,255,255,0.85)" />
                </Pressable>
              )}

              <Text
                style={{
                  ...font.caption1,
                  color: "rgba(255,255,255,0.8)",
                  marginTop: 4,
                  fontFamily: settingsFonts.body,
                }}
                numberOfLines={1}
              >
                {userEmail}
              </Text>
              <Text
                style={{
                  ...font.caption2,
                  color: "rgba(255,255,255,0.75)",
                  marginTop: 2,
                  fontFamily: settingsFonts.body,
                }}
              >
                Member since {memberSince}
              </Text>
            </View>
          </View>

          <View style={{ marginTop: spacing.md + 2 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: spacing.sm,
              }}
            >
              <Text
                style={{
                  ...font.caption1,
                  color: "rgba(255,255,255,0.82)",
                  fontFamily: settingsFonts.body,
                }}
              >
                Momentum Score
              </Text>
              <Text
                selectable
                style={{
                  ...font.caption1,
                  color: "#FFFFFF",
                  fontWeight: "700",
                  fontVariant: ["tabular-nums"],
                }}
              >
                {momentumScore}/100
              </Text>
            </View>
            <ProgressBar
              value={momentumScore}
              color="#FFFFFF"
              trackColor="rgba(255,255,255,0.28)"
              height={7}
            />
          </View>
        </LinearGradient>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(60).duration(340)}
        style={{
          marginTop: spacing.md,
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
          rowGap: spacing.sm,
        }}
      >
        {stats.map((stat) => (
          <StatTile key={stat.label} {...stat} />
        ))}
      </Animated.View>

      <SectionLabel title="Focus Studio" delay={90} />
      <Animated.View entering={FadeInDown.delay(90).duration(300)}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderCurve: "continuous",
            paddingHorizontal: spacing.lg,
            borderWidth: 1,
            borderColor: colors.borderLight,
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          }}
        >
          <SliderPanel
            title="Focus Duration"
            subtitle="Main deep-work session"
            icon="timer"
            tint={colors.primary}
            valueLabel={`${timerStore.focusDuration} min`}
            min={5}
            max={60}
            step={5}
            value={timerStore.focusDuration}
            onValueChange={(v) => timerStore.setFocusDuration(v)}
          />

          <View style={{ height: 1, backgroundColor: colors.borderLight }} />

          <SliderPanel
            title="Break Duration"
            subtitle="Recovery between sessions"
            icon="leaf.fill"
            tint={colors.success}
            valueLabel={`${timerStore.breakDuration} min`}
            min={1}
            max={30}
            step={1}
            value={timerStore.breakDuration}
            onValueChange={(v) => timerStore.setBreakDuration(v)}
          />
        </View>
      </Animated.View>

      <SectionLabel title="Goals & Limits" delay={120} />
      <Animated.View entering={FadeInDown.delay(120).duration(300)}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderCurve: "continuous",
            paddingHorizontal: spacing.lg,
            borderWidth: 1,
            borderColor: colors.borderLight,
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          }}
        >
          <SliderPanel
            title="Daily Study Goal"
            subtitle="How many hours per day"
            icon="calendar.badge.clock"
            tint={colors.warning}
            valueLabel={`${studyHoursPerDay.toFixed(1)} hrs`}
            min={1}
            max={12}
            step={0.5}
            value={studyHoursPerDay}
            onValueChange={handleStudyHoursPreview}
            onSlidingComplete={handleStudyHoursCommit}
          />

          <View style={{ height: 1, backgroundColor: colors.borderLight }} />

          <SliderPanel
            title="Weekly Budget"
            subtitle="Spending cap for this week"
            icon="creditcard.fill"
            tint={colors.success}
            valueLabel={`$${weeklyBudget}`}
            min={20}
            max={500}
            step={5}
            value={weeklyBudget}
            onValueChange={handleWeeklyBudgetPreview}
            onSlidingComplete={handleWeeklyBudgetCommit}
          />
        </View>
      </Animated.View>

      <SectionLabel title="Data & Safety" delay={150} />
      <Animated.View entering={FadeInDown.delay(150).duration(300)}>
        <View
          style={{
            borderRadius: radius.lg,
            borderCurve: "continuous",
            overflow: "hidden",
            borderWidth: 1,
            borderColor: colors.borderLight,
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          }}
        >
          <SettingCell
            icon="arrow.counterclockwise"
            iconColor="#FFFFFF"
            iconBg={colors.warning}
            label="Reset Study Streak"
            subtitle="Set your current streak back to zero"
            value={`${currentStreak}d`}
            onPress={handleResetStreak}
            isFirst
          />
          <SettingCell
            icon="trash"
            iconColor="#FFFFFF"
            iconBg={colors.textSecondary}
            label="Clear Completed Tasks"
            subtitle="Remove only finished items from planner"
            value={`${totalTasks} tasks`}
            onPress={handleClearCompletedTasks}
            isLast
          />
        </View>
      </Animated.View>

      <SectionLabel title="Account" delay={180} />
      <Animated.View entering={FadeInDown.delay(180).duration(300)}>
        <View
          style={{
            borderRadius: radius.lg,
            borderCurve: "continuous",
            overflow: "hidden",
            borderWidth: 1,
            borderColor: colors.borderLight,
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          }}
        >
          <SettingCell
            icon="envelope.fill"
            iconColor="#FFFFFF"
            iconBg={colors.primary}
            label="Email"
            subtitle="Your login address"
            value={userEmail}
            isFirst
            isLast
          />
        </View>

        <Pressable
          onPress={handleSignOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          style={({ pressed }) => ({
            marginTop: spacing.md,
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: `${colors.danger}50`,
            paddingVertical: spacing.md,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <SymbolView name="rectangle.portrait.and.arrow.right" size={16} tintColor={colors.danger} />
            <Text
              style={{
                ...font.subhead,
                color: colors.danger,
                fontWeight: "600",
                fontFamily: settingsFonts.heading,
              }}
            >
              Sign Out
            </Text>
          </View>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(210).duration(300)}>
        <View style={{ alignItems: "center", paddingVertical: spacing.xxl }}>
          <Text
            style={{
              ...font.footnote,
              color: colors.textTertiary,
              fontFamily: settingsFonts.heading,
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
              fontFamily: settingsFonts.body,
            }}
          >
            Version {APP_VERSION}
          </Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
}
