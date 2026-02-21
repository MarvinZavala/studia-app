import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Switch,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { useFocusEffect } from "expo-router";
import { SymbolView } from "expo-symbols";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useState, useCallback, useMemo } from "react";

import { Button, EmptyState } from "@/components/ui";
import { colors, spacing, radius, font } from "@/lib/theme";
import { useAuth } from "@/lib/auth-context";
import { listTasksForUser } from "@/lib/data/studia-api";
import type { Task } from "@/lib/types/database";
import {
  generateTutorContent,
  type TutorOutput,
  type FlashcardItem,
  type QuizItem,
  type TutorMode,
} from "@/lib/utils/tutor-engine";

const MODE_OPTIONS: Array<{
  value: TutorMode;
  label: string;
  icon: string;
  helper: string;
}> = [
  {
    value: "explain",
    label: "Explain",
    icon: "text.book.closed.fill",
    helper: "Core concept breakdown",
  },
  {
    value: "flashcards",
    label: "Flashcards",
    icon: "rectangle.on.rectangle.angled",
    helper: "Active recall set",
  },
  {
    value: "quiz",
    label: "Quiz",
    icon: "questionmark.circle.fill",
    helper: "Practice with feedback",
  },
  {
    value: "exam_prep",
    label: "Exam Prep",
    icon: "calendar.badge.clock",
    helper: "Session plan + drills",
  },
];

const STARTER_PROMPTS = [
  "Explain Newton's laws with daily-life examples",
  "Quiz me on photosynthesis with medium difficulty",
  "Create flashcards for World War II turning points",
  "Prepare an exam review on probability distributions",
  "I need to understand derivatives for tomorrow's class",
];

function ModeChip({
  label,
  icon,
  helper,
  selected,
  onPress,
}: {
  label: string;
  icon: string;
  helper: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flex: 1,
        minWidth: "47%",
        borderRadius: radius.md,
        borderCurve: "continuous",
        backgroundColor: selected ? colors.primary : colors.surfaceSecondary,
        borderWidth: 1,
        borderColor: selected ? `${colors.primary}66` : colors.borderLight,
        padding: spacing.md,
        opacity: pressed ? 0.78 : 1,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 9,
            borderCurve: "continuous",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: selected ? "rgba(255,255,255,0.24)" : colors.primaryLight,
          }}
        >
          <SymbolView
            name={icon as any}
            size={14}
            tintColor={selected ? "#FFFFFF" : colors.primary}
          />
        </View>
        <Text
          style={{
            ...font.footnote,
            color: selected ? "#FFFFFF" : colors.textPrimary,
            fontWeight: "700",
          }}
        >
          {label}
        </Text>
      </View>
      <Text
        style={{
          ...font.caption1,
          color: selected ? "rgba(255,255,255,0.82)" : colors.textSecondary,
          marginTop: spacing.xs,
        }}
      >
        {helper}
      </Text>
    </Pressable>
  );
}

function FlashcardCard({
  card,
  index,
}: {
  card: FlashcardItem;
  index: number;
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const rotation = useSharedValue(0);

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotation.value, [0, 1], [0, 180]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: "hidden" as const,
      position: "absolute" as const,
      width: "100%",
      height: "100%",
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotation.value, [0, 1], [180, 360]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: "hidden" as const,
      position: "absolute" as const,
      width: "100%",
      height: "100%",
    };
  });

  const handleFlip = () => {
    if (process.env.EXPO_OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const toValue = isFlipped ? 0 : 1;
    rotation.value = withTiming(toValue, {
      duration: 360,
      easing: Easing.inOut(Easing.ease),
    });
    setIsFlipped(!isFlipped);
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(320)}
      style={{ flex: 1, minWidth: "47%" }}
    >
      <Pressable onPress={handleFlip} accessibilityRole="button">
        <View style={{ height: 148 }}>
          <Animated.View style={frontStyle}>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.primaryLight,
                borderRadius: radius.md,
                borderCurve: "continuous",
                padding: spacing.md,
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  ...font.caption2,
                  color: colors.primary,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  fontWeight: "700",
                  marginBottom: spacing.xs,
                }}
              >
                Prompt
              </Text>
              <Text
                style={{
                  ...font.footnote,
                  color: colors.textPrimary,
                  lineHeight: 18,
                  fontWeight: "600",
                }}
                numberOfLines={5}
              >
                {card.front}
              </Text>
            </View>
          </Animated.View>

          <Animated.View style={backStyle}>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                borderCurve: "continuous",
                borderWidth: 1.5,
                borderColor: colors.primary,
                padding: spacing.md,
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  ...font.caption2,
                  color: colors.primary,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  fontWeight: "700",
                  marginBottom: spacing.xs,
                }}
              >
                Answer
              </Text>
              <Text
                style={{
                  ...font.footnote,
                  color: colors.textPrimary,
                  lineHeight: 18,
                }}
                numberOfLines={6}
              >
                {card.back}
              </Text>
            </View>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function QuizCard({
  item,
  index,
  selectedOption,
  onSelect,
}: {
  item: QuizItem;
  index: number;
  selectedOption: number | null;
  onSelect: (optionIndex: number) => void;
}) {
  const hasAnswered = selectedOption !== null;
  const isCorrect = selectedOption === item.correctIndex;

  const handleSelect = (optionIndex: number) => {
    if (hasAnswered) return;

    if (process.env.EXPO_OS === "ios") {
      Haptics.notificationAsync(
        optionIndex === item.correctIndex
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning
      );
    }

    onSelect(optionIndex);
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(350)}>
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          borderCurve: "continuous",
          borderWidth: 1,
          borderColor: colors.borderLight,
          padding: spacing.lg,
          marginBottom: spacing.sm,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: spacing.md }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              borderCurve: "continuous",
              backgroundColor: colors.primaryLight,
              alignItems: "center",
              justifyContent: "center",
              marginRight: spacing.sm,
            }}
          >
            <Text
              style={{
                ...font.footnote,
                fontWeight: "700",
                color: colors.primary,
                fontVariant: ["tabular-nums"],
              }}
            >
              {index + 1}
            </Text>
          </View>
          <Text style={{ ...font.subhead, color: colors.textPrimary, flex: 1, lineHeight: 22 }}>
            {item.question}
          </Text>
        </View>

        <View style={{ gap: spacing.sm }}>
          {item.options.map((option, optionIndex) => {
            const selected = selectedOption === optionIndex;
            const isCorrectOption = optionIndex === item.correctIndex;

            let backgroundColor = colors.surfaceSecondary;
            let borderColor = colors.borderLight;
            let textColor = colors.textPrimary;

            if (hasAnswered && isCorrectOption) {
              backgroundColor = colors.successLight;
              borderColor = colors.success;
              textColor = colors.success;
            } else if (hasAnswered && selected && !isCorrectOption) {
              backgroundColor = colors.dangerLight;
              borderColor = colors.danger;
              textColor = colors.danger;
            }

            return (
              <Pressable key={optionIndex} onPress={() => handleSelect(optionIndex)}>
                {({ pressed }) => (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      borderRadius: radius.md,
                      borderCurve: "continuous",
                      borderWidth: 1.5,
                      borderColor,
                      backgroundColor,
                      paddingVertical: spacing.md,
                      paddingHorizontal: spacing.md,
                      opacity: pressed && !hasAnswered ? 0.75 : 1,
                    }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        borderCurve: "continuous",
                        borderWidth: 2,
                        borderColor,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: spacing.md,
                        backgroundColor: hasAnswered && selected ? borderColor : "transparent",
                      }}
                    >
                      {hasAnswered && selected ? (
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: "#FFFFFF",
                          }}
                        />
                      ) : null}
                    </View>

                    <Text style={{ ...font.subhead, color: textColor, flex: 1 }}>{option}</Text>
                    {hasAnswered && isCorrectOption ? (
                      <SymbolView name="checkmark.circle.fill" size={16} tintColor={colors.success} />
                    ) : null}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {hasAnswered ? (
          <Animated.View
            entering={FadeIn.duration(240)}
            style={{
              marginTop: spacing.md,
              borderRadius: radius.sm,
              borderCurve: "continuous",
              padding: spacing.md,
              backgroundColor: isCorrect ? colors.successLight : colors.warningLight,
            }}
          >
            <Text
              style={{
                ...font.footnote,
                color: isCorrect ? colors.success : colors.warning,
                fontWeight: "700",
                marginBottom: 4,
              }}
            >
              {isCorrect ? "Correct" : "Review"}
            </Text>
            <Text style={{ ...font.footnote, color: colors.textPrimary, lineHeight: 18 }}>
              {item.rationale}
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </Animated.View>
  );
}

export default function TutorScreen() {
  const { user } = useAuth();

  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<TutorMode>("explain");
  const [usePlannerContext, setUsePlannerContext] = useState(true);
  const [plannerTasks, setPlannerTasks] = useState<Task[]>([]);

  const [content, setContent] = useState<TutorOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});

  const loadPlannerTasks = useCallback(async (): Promise<Task[]> => {
    if (!user?.id) {
      setPlannerTasks([]);
      return [];
    }

    try {
      const tasks = await listTasksForUser(user.id);
      setPlannerTasks(tasks);
      return tasks;
    } catch {
      setPlannerTasks([]);
      return [];
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (!usePlannerContext || !user?.id) return;
      void loadPlannerTasks();
    }, [loadPlannerTasks, usePlannerContext, user?.id])
  );

  const handleGenerate = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      setError("Write a topic or question first.");
      return;
    }

    if (process.env.EXPO_OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsGenerating(true);
    setError(null);
    setQuizAnswers({});

    try {
      let contextTasks = plannerTasks;
      if (usePlannerContext && user?.id && plannerTasks.length === 0) {
        contextTasks = await loadPlannerTasks();
      }

      await new Promise((resolve) => setTimeout(resolve, 380));

      const result = generateTutorContent({
        prompt: trimmed,
        mode,
        includePlannerContext: usePlannerContext,
        tasks: contextTasks,
      });

      setContent(result);
    } catch (generationError) {
      const fallback =
        generationError instanceof Error
          ? generationError.message
          : "Could not generate tutor content right now.";
      setContent(null);
      setError(fallback);
    } finally {
      setIsGenerating(false);
    }
  }, [loadPlannerTasks, mode, plannerTasks, prompt, usePlannerContext, user?.id]);

  const handleStarterPrompt = useCallback((value: string) => {
    if (process.env.EXPO_OS === "ios") {
      Haptics.selectionAsync();
    }
    setPrompt(value);
  }, []);

  const handleModeChange = useCallback((nextMode: TutorMode) => {
    if (process.env.EXPO_OS === "ios") {
      Haptics.selectionAsync();
    }
    setMode(nextMode);
  }, []);

  const handleQuizOption = useCallback((questionIndex: number, optionIndex: number) => {
    setQuizAnswers((previous) => {
      if (previous[questionIndex] != null) return previous;
      return { ...previous, [questionIndex]: optionIndex };
    });
  }, []);

  const quizStats = useMemo(() => {
    if (!content) {
      return { answered: 0, total: 0, correct: 0, scorePct: 0 };
    }

    const total = content.quiz.length;
    const answered = Object.keys(quizAnswers).length;
    const correct = content.quiz.reduce((sum, question, index) => {
      return sum + (quizAnswers[index] === question.correctIndex ? 1 : 0);
    }, 0);

    return {
      answered,
      total,
      correct,
      scorePct: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
  }, [content, quizAnswers]);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: "#EDF2FF" }}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        paddingBottom: 48,
      }}
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="on-drag"
    >
      <Animated.View entering={FadeInDown.duration(340)}>
        <LinearGradient
          colors={["#5B61FF", "#2E8AF7", "#11B6E9"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: radius.xl,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.3)",
            overflow: "hidden",
            padding: spacing.lg,
            marginTop: spacing.sm,
            marginBottom: spacing.lg,
          }}
        >
          <View
            style={{
              position: "absolute",
              right: -20,
              top: -24,
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: "rgba(255,255,255,0.16)",
            }}
          />
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                borderCurve: "continuous",
                backgroundColor: "rgba(255,255,255,0.22)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SymbolView name="brain.head.profile" size={20} tintColor="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...font.title3, color: "#FFFFFF", fontWeight: "800" }}>
                AI Tutor Studio
              </Text>
              <Text
                style={{
                  ...font.caption1,
                  color: "rgba(255,255,255,0.84)",
                  marginTop: 2,
                }}
              >
                Context-aware lessons, flashcards, quizzes, and exam planning.
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(50).duration(350)}>
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: radius.lg,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: "#E6EBFF",
            padding: spacing.lg,
            marginBottom: spacing.lg,
            gap: spacing.md,
          }}
        >
          <Text
            style={{
              ...font.footnote,
              color: colors.textSecondary,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              fontWeight: "700",
            }}
          >
            Study Prompt
          </Text>

          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Ask anything. Example: Explain mitosis and prepare me for a quiz tomorrow"
            placeholderTextColor={colors.textTertiary}
            multiline
            style={{
              ...font.body,
              color: colors.textPrimary,
              backgroundColor: "#F5F7FF",
              borderRadius: radius.md,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: "#E5EAFF",
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.md,
              minHeight: 110,
              textAlignVertical: "top",
            }}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {STARTER_PROMPTS.map((starterPrompt) => (
              <Pressable
                key={starterPrompt}
                onPress={() => handleStarterPrompt(starterPrompt)}
                style={({ pressed }) => ({
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.full,
                  borderCurve: "continuous",
                  backgroundColor: "#F1F5FF",
                  borderWidth: 1,
                  borderColor: "#E2E9FF",
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Text style={{ ...font.caption1, color: colors.primary, fontWeight: "600" }}>
                  {starterPrompt}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {MODE_OPTIONS.map((option) => (
              <ModeChip
                key={option.value}
                label={option.label}
                icon={option.icon}
                helper={option.helper}
                selected={mode === option.value}
                onPress={() => handleModeChange(option.value)}
              />
            ))}
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#F7F9FF",
              borderRadius: radius.md,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: "#E5EAFF",
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 9,
                  borderCurve: "continuous",
                  backgroundColor: colors.primaryLight,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SymbolView name="list.bullet.clipboard" size={14} tintColor={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...font.footnote, color: colors.textPrimary, fontWeight: "600" }}>
                  Use planner context
                </Text>
                <Text style={{ ...font.caption1, color: colors.textSecondary, marginTop: 1 }}>
                  Prioritize output based on your tasks and deadlines.
                </Text>
              </View>
            </View>
            <Switch value={usePlannerContext} onValueChange={setUsePlannerContext} />
          </View>

          <Button
            title={isGenerating ? "Generating tutor pack..." : "Generate Tutor Pack"}
            onPress={() => {
              void handleGenerate();
            }}
            size="lg"
            disabled={isGenerating}
          />
        </View>
      </Animated.View>

      {error ? (
        <Animated.View entering={FadeIn.duration(220)}>
          <View
            style={{
              backgroundColor: colors.dangerLight,
              borderWidth: 1,
              borderColor: `${colors.danger}55`,
              borderRadius: radius.md,
              borderCurve: "continuous",
              padding: spacing.md,
              marginBottom: spacing.lg,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
            }}
          >
            <SymbolView name="exclamationmark.triangle.fill" size={14} tintColor={colors.danger} />
            <Text style={{ ...font.footnote, color: colors.danger, flex: 1 }}>{error}</Text>
          </View>
        </Animated.View>
      ) : null}

      {isGenerating ? (
        <Animated.View entering={FadeIn.duration(250)}>
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: radius.lg,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: "#E6EBFF",
              alignItems: "center",
              paddingVertical: spacing.xxl,
              marginBottom: spacing.lg,
            }}
          >
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ ...font.subhead, color: colors.textSecondary, marginTop: spacing.md }}>
              Building a high-quality tutor response...
            </Text>
          </View>
        </Animated.View>
      ) : null}

      {!isGenerating && !content ? (
        <Animated.View entering={FadeIn.duration(220)}>
          <EmptyState
            icon="sparkles"
            title="Generate your first tutor pack"
            subtitle="You will get explanation, key points, flashcards, quiz and a study plan."
          />
        </Animated.View>
      ) : null}

      {content && !isGenerating ? (
        <>
          <Animated.View entering={FadeInDown.delay(60).duration(300)}>
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: radius.lg,
                borderCurve: "continuous",
                borderWidth: 1,
                borderColor: "#E6EBFF",
                padding: spacing.lg,
                marginBottom: spacing.md,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: spacing.sm,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ ...font.caption1, color: colors.textSecondary, textTransform: "uppercase" }}>
                    {content.mode.replace("_", " ")}
                  </Text>
                  <Text style={{ ...font.title2, color: colors.textPrimary, marginTop: 2 }}>
                    {content.topic}
                  </Text>
                </View>
                <View
                  style={{
                    borderRadius: radius.full,
                    borderCurve: "continuous",
                    backgroundColor:
                      content.confidence === "high" ? colors.successLight : colors.warningLight,
                    paddingHorizontal: spacing.md,
                    paddingVertical: 6,
                  }}
                >
                  <Text
                    style={{
                      ...font.caption2,
                      color: content.confidence === "high" ? colors.success : colors.warning,
                      fontWeight: "700",
                      textTransform: "uppercase",
                    }}
                  >
                    {content.confidence} confidence
                  </Text>
                </View>
              </View>

              <Text
                style={{
                  ...font.subhead,
                  color: colors.textPrimary,
                  marginTop: spacing.md,
                  lineHeight: 22,
                }}
              >
                {content.summary}
              </Text>
            </View>
          </Animated.View>

          {content.contextSignals.length > 0 ? (
            <Animated.View entering={FadeInDown.delay(90).duration(300)}>
              <View
                style={{
                  backgroundColor: "#F3F8FF",
                  borderRadius: radius.lg,
                  borderCurve: "continuous",
                  borderWidth: 1,
                  borderColor: "#DCE8FF",
                  padding: spacing.lg,
                  marginBottom: spacing.md,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <SymbolView name="list.bullet.clipboard" size={16} tintColor={colors.primary} />
                  <Text style={{ ...font.subhead, color: colors.textPrimary, fontWeight: "700" }}>
                    Planner Context
                  </Text>
                </View>
                <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
                  {content.contextSignals.map((signal, index) => (
                    <Text
                      key={index}
                      style={{ ...font.footnote, color: colors.textSecondary, lineHeight: 18 }}
                    >
                      - {signal}
                    </Text>
                  ))}
                </View>
              </View>
            </Animated.View>
          ) : null}

          <Animated.View entering={FadeInDown.delay(120).duration(300)}>
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: radius.lg,
                borderCurve: "continuous",
                borderWidth: 1,
                borderColor: "#E6EBFF",
                padding: spacing.lg,
                marginBottom: spacing.md,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <SymbolView name="list.bullet.rectangle.portrait" size={16} tintColor={colors.primary} />
                <Text style={{ ...font.subhead, color: colors.textPrimary, fontWeight: "700" }}>
                  Key Points
                </Text>
              </View>

              <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
                {content.keyPoints.map((point, index) => (
                  <View key={index} style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.sm }}>
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        borderCurve: "continuous",
                        backgroundColor: colors.primaryLight,
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: 1,
                      }}
                    >
                      <Text style={{ ...font.caption2, color: colors.primary, fontWeight: "700" }}>
                        {index + 1}
                      </Text>
                    </View>
                    <Text style={{ ...font.footnote, color: colors.textPrimary, flex: 1, lineHeight: 19 }}>
                      {point}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150).duration(300)}>
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: radius.lg,
                borderCurve: "continuous",
                borderWidth: 1,
                borderColor: "#E6EBFF",
                padding: spacing.lg,
                marginBottom: spacing.md,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <SymbolView name="text.book.closed.fill" size={16} tintColor={colors.primary} />
                <Text style={{ ...font.subhead, color: colors.textPrimary, fontWeight: "700" }}>
                  Guided Explanation
                </Text>
              </View>

              <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
                {content.explanation.map((paragraph, index) => (
                  <Text key={index} style={{ ...font.footnote, color: colors.textPrimary, lineHeight: 20 }}>
                    {paragraph}
                  </Text>
                ))}
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(180).duration(320)}>
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: radius.lg,
                borderCurve: "continuous",
                borderWidth: 1,
                borderColor: "#E6EBFF",
                padding: spacing.lg,
                marginBottom: spacing.lg,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <SymbolView name="calendar.badge.clock" size={16} tintColor={colors.warning} />
                <Text style={{ ...font.subhead, color: colors.textPrimary, fontWeight: "700" }}>
                  Study Plan
                </Text>
              </View>

              <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
                {content.studyPlan.map((step, index) => (
                  <View
                    key={index}
                    style={{
                      borderRadius: radius.md,
                      borderCurve: "continuous",
                      backgroundColor: "#F8FAFF",
                      borderWidth: 1,
                      borderColor: "#E8EDFF",
                      padding: spacing.md,
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.sm }}>
                      <Text style={{ ...font.footnote, color: colors.textPrimary, fontWeight: "700", flex: 1 }}>
                        {step.title}
                      </Text>
                      <Text
                        style={{
                          ...font.caption1,
                          color: colors.primary,
                          fontWeight: "700",
                          fontVariant: ["tabular-nums"],
                        }}
                      >
                        {step.durationMins} min
                      </Text>
                    </View>
                    <Text style={{ ...font.caption1, color: colors.textSecondary, marginTop: 4, lineHeight: 18 }}>
                      {step.detail}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(210).duration(320)}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.md }}>
              <SymbolView name="rectangle.on.rectangle.angled" size={18} tintColor={colors.primary} />
              <Text style={{ ...font.title3, color: colors.textPrimary, marginLeft: spacing.sm }}>
                Flashcards
              </Text>
              <Text style={{ ...font.caption1, color: colors.textSecondary, marginLeft: "auto" }}>
                Tap to flip
              </Text>
            </View>
          </Animated.View>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: spacing.sm,
              marginBottom: spacing.lg,
            }}
          >
            {content.flashcards.map((card, index) => (
              <FlashcardCard key={`${card.front}-${index}`} card={card} index={index} />
            ))}
          </View>

          <Animated.View entering={FadeInDown.delay(260).duration(320)}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.sm }}>
              <SymbolView name="questionmark.diamond.fill" size={18} tintColor={colors.warning} />
              <Text style={{ ...font.title3, color: colors.textPrimary, marginLeft: spacing.sm }}>
                Quiz Lab
              </Text>
              <Text
                style={{
                  ...font.caption1,
                  color: colors.textSecondary,
                  marginLeft: "auto",
                  fontVariant: ["tabular-nums"],
                }}
              >
                {quizStats.correct}/{quizStats.total}
              </Text>
            </View>

            <View
              style={{
                borderRadius: radius.md,
                borderCurve: "continuous",
                backgroundColor: "#FFFFFF",
                borderWidth: 1,
                borderColor: "#E6EBFF",
                padding: spacing.md,
                marginBottom: spacing.md,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xs }}>
                <Text style={{ ...font.caption1, color: colors.textSecondary }}>
                  Progress
                </Text>
                <Text
                  style={{
                    ...font.caption1,
                    color: colors.primary,
                    fontWeight: "700",
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {quizStats.answered}/{quizStats.total} answered
                </Text>
              </View>
              <View
                style={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "#E8ECFB",
                  overflow: "hidden",
                  marginBottom: spacing.xs,
                }}
              >
                <View
                  style={{
                    height: "100%",
                    width: `${quizStats.total > 0 ? (quizStats.answered / quizStats.total) * 100 : 0}%`,
                    backgroundColor: colors.primary,
                  }}
                />
              </View>
              <Text
                style={{
                  ...font.caption2,
                  color: colors.textSecondary,
                }}
              >
                Score: {quizStats.scorePct}%
              </Text>
            </View>

            {content.quiz.map((item, index) => (
              <QuizCard
                key={`${item.question}-${index}`}
                item={item}
                index={index}
                selectedOption={quizAnswers[index] ?? null}
                onSelect={(optionIndex) => handleQuizOption(index, optionIndex)}
              />
            ))}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(320).duration(320)}>
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: radius.lg,
                borderCurve: "continuous",
                borderWidth: 1,
                borderColor: "#E6EBFF",
                padding: spacing.lg,
                marginTop: spacing.sm,
              }}
            >
              <Text style={{ ...font.subhead, color: colors.textPrimary, fontWeight: "700", marginBottom: spacing.sm }}>
                Follow-up prompts
              </Text>
              <View style={{ gap: spacing.sm }}>
                {content.followUpPrompts.map((followUp, index) => (
                  <Pressable
                    key={index}
                    onPress={() => handleStarterPrompt(followUp)}
                    style={({ pressed }) => ({
                      borderRadius: radius.md,
                      borderCurve: "continuous",
                      borderWidth: 1,
                      borderColor: "#E4EAFF",
                      backgroundColor: "#F7F9FF",
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      opacity: pressed ? 0.72 : 1,
                    })}
                  >
                    <Text style={{ ...font.footnote, color: colors.primary }}>{followUp}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Animated.View>
        </>
      ) : null}
    </ScrollView>
  );
}
