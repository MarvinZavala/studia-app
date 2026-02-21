import { ScrollView, View, Text } from "react-native";
import { useFocusEffect } from "expo-router";
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { SymbolView } from "expo-symbols";
import * as Haptics from "expo-haptics";
import Slider from "@react-native-community/slider";
import { useCallback, useEffect, useState } from "react";
import Svg, { Circle } from "react-native-svg";
import { Button, EmptyState } from "@/components/ui";
import { colors, spacing, radius, font } from "@/lib/theme";
import { useAuth } from "@/lib/auth-context";
import {
  createWellnessLog,
  listWellnessHistory,
} from "@/lib/data/studia-api";
import {
  calculateWellness,
  type WellnessInput,
  type WellnessResult,
} from "@/lib/utils/wellness-engine";
import { getLocalISODate } from "@/lib/utils/date";
import type { WellnessLog } from "@/lib/types/database";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function ScoreRing({
  score,
  level,
}: {
  score: number;
  level: "good" | "medium" | "low";
}) {
  const size = 160;
  const strokeWidth = 12;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;

  const progress = useSharedValue(0);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  useEffect(() => {
    progress.value = 0;
    const timeout = setTimeout(() => {
      progress.value = withTiming(score / 10, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [progress, score]);

  const ringColor =
    level === "good"
      ? colors.success
      : level === "medium"
        ? colors.warning
        : colors.danger;

  const levelLabel =
    level === "good"
      ? "Great"
      : level === "medium"
        ? "Moderate"
        : "Needs Attention";

  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ width: size, height: size, position: "relative" }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={colors.borderLight}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={ringColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            selectable
            style={{
              fontSize: 42,
              fontWeight: "800",
              color: colors.textPrimary,
              fontVariant: ["tabular-nums"],
            }}
          >
            {score}
          </Text>
          <Text
            style={{
              ...font.footnote,
              color: colors.textTertiary,
              fontWeight: "500",
            }}
          >
            / 10
          </Text>
        </View>
      </View>
      <View
        style={{
          backgroundColor:
            level === "good"
              ? colors.successLight
              : level === "medium"
                ? colors.warningLight
                : colors.dangerLight,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.xs + 2,
          borderRadius: radius.full,
          borderCurve: "continuous",
          marginTop: spacing.md,
        }}
      >
        <Text
          style={{
            ...font.subhead,
            fontWeight: "600",
            color: ringColor,
          }}
        >
          {levelLabel}
        </Text>
      </View>
    </View>
  );
}

function SliderControl({
  label,
  value,
  onValueChange,
  min,
  max,
  step,
  icon,
  iconColor,
  unit,
}: {
  label: string;
  value: number;
  onValueChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  icon: string;
  iconColor: string;
  unit?: string;
}) {
  return (
    <View style={{ marginBottom: spacing.xl }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
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
              width: 30,
              height: 30,
              borderRadius: 8,
              borderCurve: "continuous",
              backgroundColor: iconColor + "20",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SymbolView name={icon as any} size={16} tintColor={iconColor} />
          </View>
          <Text
            style={{
              ...font.subhead,
              fontWeight: "600",
              color: colors.textPrimary,
            }}
          >
            {label}
          </Text>
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
          {value}
          {unit ?? ""}
        </Text>
      </View>
      <Slider
        value={value}
        onValueChange={onValueChange}
        minimumValue={min}
        maximumValue={max}
        step={step}
        minimumTrackTintColor={iconColor}
        maximumTrackTintColor={colors.borderLight}
        thumbTintColor={iconColor}
      />
    </View>
  );
}

function formatLogDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = getLocalISODate(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalISODate(yesterday);

  if (dateStr === today) return "Today";
  if (dateStr === yesterdayStr) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function WellnessScreen() {
  const { user } = useAuth();
  const [stress, setStress] = useState(5);
  const [sleepHours, setSleepHours] = useState(7);
  const [energy, setEnergy] = useState(5);
  const [result, setResult] = useState<WellnessResult | null>(null);
  const [history, setHistory] = useState<WellnessLog[]>([]);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!user?.id) return;
    try {
      const logs = await listWellnessHistory(user.id, 7);
      setHistory(logs);
    } catch {
      setHistory([]);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
      setResult(null);
      setHasCheckedIn(false);
    }, [loadHistory])
  );

  const handleCheckIn = async () => {
    if (!user?.id) return;
    if (process.env.EXPO_OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const input: WellnessInput = { stress, sleepHours, energy };
    const wellness = calculateWellness(input);
    setResult(wellness);
    setHasCheckedIn(true);

    const today = getLocalISODate();
    try {
      await createWellnessLog(user.id, {
        date: today,
        stress,
        sleep_hours: sleepHours,
        energy,
        score: wellness.score,
        mode: wellness.mode,
      });
    } catch {
      // keep local score result even if persistence fails
    }

    if (process.env.EXPO_OS === "ios") {
      setTimeout(() => {
        Haptics.notificationAsync(
          wellness.level === "good"
            ? Haptics.NotificationFeedbackType.Success
            : wellness.level === "medium"
              ? Haptics.NotificationFeedbackType.Warning
              : Haptics.NotificationFeedbackType.Error
        );
      }, 500);
    }

    loadHistory();
  };

  const tipIcons: Record<number, string> = {
    0: "wind",
    1: "arrow.up.right.square",
    2: "moon.zzz.fill",
    3: "bed.double.fill",
    4: "figure.walk",
    5: "powersleep",
    6: "star.fill",
    7: "target",
    8: "leaf.fill",
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        paddingBottom: 40,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.delay(0).duration(400)}>
        <Text
          style={{
            ...font.subhead,
            color: colors.textSecondary,
            paddingTop: spacing.sm,
            marginBottom: spacing.xl,
          }}
        >
          Track your daily wellness to optimise your study schedule
        </Text>
      </Animated.View>

      {/* ── Check-in Form ─────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(60).duration(400)}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderCurve: "continuous",
            padding: spacing.lg,
            marginBottom: spacing.xl,
          }}
        >
          <SliderControl
            label="Stress Level"
            value={stress}
            onValueChange={(v) => setStress(Math.round(v))}
            min={0}
            max={10}
            step={1}
            icon="brain.head.profile"
            iconColor={colors.secondary}
          />
          <SliderControl
            label="Sleep Hours"
            value={sleepHours}
            onValueChange={(v) => setSleepHours(Math.round(v * 2) / 2)}
            min={0}
            max={12}
            step={0.5}
            icon="moon.fill"
            iconColor="#AF52DE"
            unit="h"
          />
          <SliderControl
            label="Energy Level"
            value={energy}
            onValueChange={(v) => setEnergy(Math.round(v))}
            min={0}
            max={10}
            step={1}
            icon="bolt.fill"
            iconColor={colors.warning}
          />
          <Button
            title={hasCheckedIn ? "Update Check-In" : "Check In"}
            onPress={handleCheckIn}
            size="lg"
          />
        </View>
      </Animated.View>

      {/* ── Result ────────────────────────────────────────────── */}
      {result && (
        <>
          <Animated.View entering={FadeIn.duration(500)}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                borderCurve: "continuous",
                alignItems: "center",
                paddingVertical: spacing.xl,
                marginBottom: spacing.lg,
              }}
            >
              <Text
                style={{
                  ...font.footnote,
                  fontWeight: "600",
                  color: colors.textTertiary,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: spacing.lg,
                }}
              >
                Wellness Score
              </Text>
              <ScoreRing score={result.score} level={result.level} />
              {result.mode === "light" && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.warningLight,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: radius.sm,
                    borderCurve: "continuous",
                    marginTop: spacing.lg,
                    gap: spacing.sm,
                  }}
                >
                  <SymbolView
                    name="moon.fill"
                    size={14}
                    tintColor={colors.warning}
                  />
                  <Text
                    style={{
                      ...font.footnote,
                      color: colors.warning,
                      fontWeight: "500",
                    }}
                  >
                    Light Mode suggested for your planner
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Tips */}
          {result.tips.length > 0 && (
            <>
              <Animated.View entering={FadeInDown.delay(200).duration(400)}>
                <Text
                  style={{
                    ...font.title3,
                    color: colors.textPrimary,
                    marginBottom: spacing.md,
                  }}
                >
                  Tips for You
                </Text>
              </Animated.View>
              <View style={{ gap: spacing.sm, marginBottom: spacing.xl }}>
                {result.tips.map((tip, index) => (
                  <Animated.View
                    key={index}
                    entering={FadeInDown.delay(
                      300 + index * 50
                    ).duration(400)}
                  >
                    <View
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: radius.md,
                        borderCurve: "continuous",
                        padding: spacing.lg,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.md,
                      }}
                    >
                      <View
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          borderCurve: "continuous",
                          backgroundColor: colors.primaryLight,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <SymbolView
                          name={
                            (tipIcons[index] ?? "sparkles") as any
                          }
                          size={16}
                          tintColor={colors.primary}
                        />
                      </View>
                      <Text
                        selectable
                        style={{
                          ...font.subhead,
                          color: colors.textPrimary,
                          lineHeight: 22,
                          flex: 1,
                        }}
                      >
                        {tip}
                      </Text>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </>
          )}
        </>
      )}

      {/* ── History ───────────────────────────────────────────── */}
      <Animated.View
        entering={FadeInDown.delay(result ? 600 : 120).duration(400)}
      >
        <Text
          style={{
            ...font.title3,
            color: colors.textPrimary,
            marginBottom: spacing.md,
          }}
        >
          History
        </Text>
      </Animated.View>

      {history.length === 0 ? (
        <Animated.View
          entering={FadeInDown.delay(result ? 660 : 180).duration(400)}
        >
          <EmptyState icon="heart.text.clipboard" title="No check-ins yet" />
        </Animated.View>
      ) : (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderCurve: "continuous",
            overflow: "hidden",
          }}
        >
          {history.map((log, index) => {
            const scoreColor =
              log.score > 7
                ? colors.success
                : log.score >= 4
                  ? colors.warning
                  : colors.danger;
            const scoreBg =
              log.score > 7
                ? colors.successLight
                : log.score >= 4
                  ? colors.warningLight
                  : colors.dangerLight;
            const isLast = index === history.length - 1;

            return (
              <Animated.View
                key={log.id}
                entering={FadeInDown.delay(
                  (result ? 660 : 180) + index * 50
                ).duration(400)}
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
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      borderCurve: "continuous",
                      backgroundColor: scoreBg,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: spacing.md,
                    }}
                  >
                    <Text
                      selectable
                      style={{
                        ...font.headline,
                        fontWeight: "700",
                        color: scoreColor,
                        fontVariant: ["tabular-nums"],
                      }}
                    >
                      {log.score}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        ...font.subhead,
                        fontWeight: "600",
                        color: colors.textPrimary,
                      }}
                    >
                      {formatLogDate(log.date)}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        gap: spacing.md,
                        marginTop: 3,
                      }}
                    >
                      <Text
                        style={{
                          ...font.caption1,
                          color: colors.textTertiary,
                        }}
                      >
                        Stress {log.stress}
                      </Text>
                      <Text
                        style={{
                          ...font.caption1,
                          color: colors.textTertiary,
                        }}
                      >
                        Sleep {log.sleep_hours}h
                      </Text>
                      <Text
                        style={{
                          ...font.caption1,
                          color: colors.textTertiary,
                        }}
                      >
                        Energy {log.energy}
                      </Text>
                    </View>
                  </View>
                  {log.mode === "light" && (
                    <View
                      style={{
                        backgroundColor: colors.warningLight,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: radius.full,
                        borderCurve: "continuous",
                      }}
                    >
                      <Text
                        style={{
                          ...font.caption2,
                          fontWeight: "600",
                          color: colors.warning,
                        }}
                      >
                        Light
                      </Text>
                    </View>
                  )}
                  {!isLast && (
                    <View
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 76,
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
      )}
    </ScrollView>
  );
}
