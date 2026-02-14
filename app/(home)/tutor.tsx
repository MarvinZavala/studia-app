import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
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
import { SymbolView } from "expo-symbols";
import * as Haptics from "expo-haptics";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui";
import { colors, spacing, radius, font } from "@/lib/theme";
import {
  generateTutorContent,
  type TutorOutput,
  type FlashcardItem,
  type QuizItem,
} from "@/lib/utils/mock-tutor";

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
      duration: 400,
      easing: Easing.inOut(Easing.ease),
    });
    setIsFlipped(!isFlipped);
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 70).duration(400)}
      style={{ flex: 1, minWidth: "45%" }}
    >
      <Pressable onPress={handleFlip}>
        <View style={{ height: 140 }}>
          <Animated.View style={frontStyle}>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.primaryLight,
                borderRadius: radius.md,
                borderCurve: "continuous",
                padding: spacing.md,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <SymbolView
                name="questionmark.circle"
                size={20}
                tintColor={colors.primary}
                style={{ marginBottom: spacing.sm }}
              />
              <Text
                style={{
                  ...font.footnote,
                  fontWeight: "500",
                  color: colors.primary,
                  textAlign: "center",
                }}
                numberOfLines={4}
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
                padding: spacing.md,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 2,
                borderColor: colors.primary,
              }}
            >
              <Text
                style={{
                  ...font.caption1,
                  color: colors.textPrimary,
                  textAlign: "center",
                  lineHeight: 17,
                }}
                numberOfLines={5}
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
}: {
  item: QuizItem;
  index: number;
}) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const hasAnswered = selectedOption !== null;
  const isCorrect = selectedOption === item.correctIndex;

  const handleSelect = (optionIndex: number) => {
    if (hasAnswered) return;
    if (process.env.EXPO_OS === "ios") {
      Haptics.notificationAsync(
        optionIndex === item.correctIndex
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Error
      );
    }
    setSelectedOption(optionIndex);
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 90).duration(400)}>
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          borderCurve: "continuous",
          padding: spacing.lg,
          marginBottom: spacing.sm,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: spacing.md,
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
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
          <Text
            style={{
              ...font.subhead,
              fontWeight: "600",
              color: colors.textPrimary,
              flex: 1,
            }}
          >
            {item.question}
          </Text>
        </View>
        <View style={{ gap: spacing.sm }}>
          {item.options.map((option, optIdx) => {
            let bgColor = colors.surfaceSecondary;
            let borderColor = "transparent";
            let textColor = colors.textPrimary;

            if (hasAnswered) {
              if (optIdx === item.correctIndex) {
                bgColor = colors.successLight;
                borderColor = colors.success;
                textColor = colors.success;
              } else if (optIdx === selectedOption) {
                bgColor = colors.dangerLight;
                borderColor = colors.danger;
                textColor = colors.danger;
              }
            }

            return (
              <Pressable key={optIdx} onPress={() => handleSelect(optIdx)}>
                {({ pressed }) => (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: bgColor,
                      borderWidth: 1.5,
                      borderColor: borderColor,
                      borderRadius: radius.md,
                      borderCurve: "continuous",
                      paddingVertical: spacing.md,
                      paddingHorizontal: spacing.lg,
                      opacity: pressed && !hasAnswered ? 0.7 : 1,
                    }}
                  >
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 2,
                        borderColor:
                          hasAnswered && optIdx === item.correctIndex
                            ? colors.success
                            : hasAnswered && optIdx === selectedOption
                              ? colors.danger
                              : colors.border,
                        backgroundColor:
                          hasAnswered && optIdx === item.correctIndex
                            ? colors.success
                            : hasAnswered && optIdx === selectedOption
                              ? colors.danger
                              : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: spacing.md,
                      }}
                    >
                      {hasAnswered &&
                        (optIdx === item.correctIndex ||
                          optIdx === selectedOption) && (
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: "#FFFFFF",
                            }}
                          />
                        )}
                    </View>
                    <Text
                      style={{
                        ...font.subhead,
                        color: textColor,
                        fontWeight:
                          hasAnswered && optIdx === item.correctIndex
                            ? "600"
                            : "400",
                        flex: 1,
                      }}
                    >
                      {option}
                    </Text>
                    {hasAnswered && optIdx === item.correctIndex && (
                      <SymbolView
                        name="checkmark.circle.fill"
                        size={18}
                        tintColor={colors.success}
                      />
                    )}
                    {hasAnswered &&
                      optIdx === selectedOption &&
                      optIdx !== item.correctIndex && (
                        <SymbolView
                          name="xmark.circle.fill"
                          size={18}
                          tintColor={colors.danger}
                        />
                      )}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
        {hasAnswered && (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={{
              marginTop: spacing.md,
              padding: spacing.md,
              backgroundColor: isCorrect
                ? colors.successLight
                : colors.dangerLight,
              borderRadius: radius.sm,
              borderCurve: "continuous",
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
            }}
          >
            <SymbolView
              name={
                isCorrect
                  ? "checkmark.seal.fill"
                  : ("info.circle.fill" as any)
              }
              size={16}
              tintColor={isCorrect ? colors.success : colors.danger}
            />
            <Text
              style={{
                ...font.footnote,
                fontWeight: "500",
                color: isCorrect ? colors.success : colors.danger,
                flex: 1,
              }}
            >
              {isCorrect
                ? "Correct! Well done."
                : `The correct answer is: ${item.options[item.correctIndex]}`}
            </Text>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}

export default function TutorScreen() {
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState<TutorOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = useCallback(() => {
    const trimmed = topic.trim();
    if (!trimmed) return;

    if (process.env.EXPO_OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsGenerating(true);
    setContent(null);

    setTimeout(() => {
      const result = generateTutorContent(trimmed);
      setContent(result);
      setIsGenerating(false);
    }, 800);
  }, [topic]);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        paddingBottom: 40,
      }}
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="on-drag"
    >
      <Animated.View entering={FadeInDown.delay(0).duration(400)}>
        <Text
          style={{
            ...font.subhead,
            color: colors.textSecondary,
            paddingTop: spacing.sm,
            marginBottom: spacing.lg,
          }}
        >
          Enter a topic and get an explanation, flashcards, and a quiz
        </Text>
      </Animated.View>

      {/* ── Topic Input ───────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(60).duration(400)}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderCurve: "continuous",
            padding: spacing.lg,
            marginBottom: spacing.lg,
          }}
        >
          <Text
            style={{
              ...font.footnote,
              fontWeight: "600",
              color: colors.textSecondary,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: spacing.sm,
            }}
          >
            Topic
          </Text>
          <TextInput
            value={topic}
            onChangeText={setTopic}
            placeholder="e.g. Photosynthesis, Newton's Laws..."
            placeholderTextColor={colors.textTertiary}
            style={{
              ...font.body,
              color: colors.textPrimary,
              backgroundColor: colors.surfaceSecondary,
              borderRadius: radius.md,
              borderCurve: "continuous",
              padding: spacing.lg,
              marginBottom: spacing.md,
            }}
            returnKeyType="go"
            onSubmitEditing={handleGenerate}
          />
          <Button
            title={isGenerating ? "Generating..." : "Generate"}
            onPress={handleGenerate}
            disabled={!topic.trim() || isGenerating}
          />
        </View>
      </Animated.View>

      {isGenerating && (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={{
            alignItems: "center",
            paddingVertical: spacing.xxl,
          }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={{
              ...font.subhead,
              color: colors.textSecondary,
              marginTop: spacing.md,
            }}
          >
            Generating content...
          </Text>
        </Animated.View>
      )}

      {content && !isGenerating && (
        <>
          {/* Explanation */}
          <Animated.View entering={FadeInDown.delay(0).duration(400)}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: spacing.md,
                gap: spacing.sm,
              }}
            >
              <SymbolView
                name="text.book.closed.fill"
                size={20}
                tintColor={colors.primary}
              />
              <Text
                style={{
                  ...font.title3,
                  color: colors.textPrimary,
                }}
              >
                {content.topic}
              </Text>
            </View>
          </Animated.View>

          <View style={{ marginBottom: spacing.xl }}>
            {content.explanation.map((paragraph, index) => (
              <Animated.View
                key={index}
                entering={FadeInDown.delay(index * 50).duration(400)}
              >
                <Text
                  selectable
                  style={{
                    ...font.body,
                    lineHeight: 24,
                    color: colors.textPrimary,
                    marginBottom: spacing.md,
                  }}
                >
                  {paragraph}
                </Text>
              </Animated.View>
            ))}
          </View>

          {/* Flashcards */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: spacing.md,
                gap: spacing.sm,
              }}
            >
              <SymbolView
                name="rectangle.on.rectangle.angled"
                size={20}
                tintColor="#AF52DE"
              />
              <Text
                style={{
                  ...font.title3,
                  color: colors.textPrimary,
                }}
              >
                Flashcards
              </Text>
              <Text
                style={{
                  ...font.footnote,
                  color: colors.textTertiary,
                  marginLeft: "auto",
                }}
              >
                Tap to flip
              </Text>
            </View>
          </Animated.View>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: spacing.sm,
              marginBottom: spacing.xl,
            }}
          >
            {content.flashcards.map((card, index) => (
              <FlashcardCard key={index} card={card} index={index} />
            ))}
          </View>

          {/* Quiz */}
          <Animated.View entering={FadeInDown.delay(500).duration(400)}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: spacing.md,
                gap: spacing.sm,
              }}
            >
              <SymbolView
                name="questionmark.diamond.fill"
                size={20}
                tintColor={colors.warning}
              />
              <Text
                style={{
                  ...font.title3,
                  color: colors.textPrimary,
                }}
              >
                Quiz
              </Text>
            </View>
          </Animated.View>

          {content.quiz.map((item, index) => (
            <QuizCard key={index} item={item} index={index} />
          ))}
        </>
      )}
    </ScrollView>
  );
}
