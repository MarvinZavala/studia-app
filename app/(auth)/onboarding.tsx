import { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  BounceIn,
  FadeOut,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import * as Haptics from "expo-haptics";

import { colors, spacing, radius } from "@/lib/theme";

interface Slide {
  icon: string;
  iconColor: string;
  bgColor: string;
  title: string;
  subtitle: string;
}

const SLIDES: Slide[] = [
  {
    icon: "book.fill",
    iconColor: colors.primary,
    bgColor: colors.primaryLight,
    title: "Welcome to Studia",
    subtitle: "Your study life, simplified.\nEverything you need in one place.",
  },
  {
    icon: "calendar.badge.clock",
    iconColor: colors.warning,
    bgColor: colors.warningLight,
    title: "Smart Planner",
    subtitle:
      "Organize your week with smart scheduling.\nNever miss a deadline again.",
  },
  {
    icon: "timer",
    iconColor: colors.success,
    bgColor: colors.successLight,
    title: "Focus Timer",
    subtitle:
      "Pomodoro sessions that keep you locked in.\nTrack your study streaks.",
  },
  {
    icon: "brain.head.profile",
    iconColor: colors.primary,
    bgColor: colors.primaryLight,
    title: "AI Tutor",
    subtitle:
      "Flashcards, quizzes & explanations.\nLearn smarter, not harder.",
  },
  {
    icon: "heart.text.square",
    iconColor: colors.secondary,
    bgColor: colors.secondaryLight,
    title: "Wellness Check",
    subtitle:
      "Track stress, sleep & energy levels.\nYour wellbeing matters too.",
  },
  {
    icon: "creditcard.fill",
    iconColor: "#00C2A8",
    bgColor: "#E0F7F3",
    title: "Student Budget",
    subtitle:
      "Track expenses by category.\nStay on top of your student finances.",
  },
  {
    icon: "sparkles",
    iconColor: colors.primary,
    bgColor: colors.primaryLight,
    title: "Ready to crush it?",
    subtitle: "Join thousands of students studying smarter.\nLet's get started!",
  },
];

function DotIndicator({
  count,
  current,
  accentColor,
}: {
  count: number;
  current: number;
  accentColor: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Animated.View
          key={i}
          style={{
            width: i === current ? 24 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i === current ? accentColor : colors.border,
            borderCurve: "continuous",
          }}
        />
      ))}
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const isLastSlide = currentPage === SLIDES.length - 1;
  const slide = SLIDES[currentPage];

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const page = Math.round(e.nativeEvent.contentOffset.x / width);
      if (page !== currentPage && page >= 0 && page < SLIDES.length) {
        setCurrentPage(page);
        if (process.env.EXPO_OS === "ios") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    },
    [currentPage, width]
  );

  function handleNext() {
    if (process.env.EXPO_OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (isLastSlide) {
      completeOnboarding();
    } else {
      scrollRef.current?.scrollTo({
        x: (currentPage + 1) * width,
        animated: true,
      });
    }
  }

  function handleSkip() {
    if (process.env.EXPO_OS === "ios") {
      Haptics.selectionAsync();
    }
    completeOnboarding();
  }

  function completeOnboarding() {
    try {
      localStorage.setItem("studia_onboarding_complete", "true");
    } catch {}
    router.replace("/(auth)/login");
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Skip button */}
      {!isLastSlide && (
        <Animated.View
          entering={FadeIn.delay(800).duration(300)}
          exiting={FadeOut.duration(200)}
          style={{
            position: "absolute",
            top: 60,
            right: spacing.xl,
            zIndex: 10,
          }}
        >
          <Pressable
            onPress={handleSkip}
            hitSlop={16}
            style={({ pressed }) => ({
              opacity: pressed ? 0.5 : 1,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.lg,
            })}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: colors.textSecondary,
              }}
            >
              Skip
            </Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Paged ScrollView */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s, index) => (
          <SlideView key={index} slide={s} width={width} index={index} />
        ))}
      </ScrollView>

      {/* Bottom controls */}
      <View
        style={{
          paddingHorizontal: spacing.xl,
          paddingBottom: 50,
          gap: spacing.xl,
        }}
      >
        <DotIndicator
          count={SLIDES.length}
          current={currentPage}
          accentColor={slide.iconColor}
        />

        <Pressable
          onPress={handleNext}
          style={({ pressed }) => ({
            backgroundColor: slide.iconColor,
            borderRadius: radius.lg,
            borderCurve: "continuous",
            paddingVertical: 18,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.8 : 1,
            boxShadow: `0 6px 20px ${slide.iconColor}40`,
          })}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: "#FFFFFF",
              letterSpacing: 0.3,
            }}
          >
            {isLastSlide ? "Get Started" : "Next"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function SlideView({
  slide,
  width,
  index,
}: {
  slide: Slide;
  width: number;
  index: number;
}) {
  return (
    <View
      style={{
        width,
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: spacing.xxl,
      }}
    >
      {/* Icon container */}
      <Animated.View
        entering={BounceIn.delay(200).duration(600)}
        style={{
          width: 140,
          height: 140,
          borderRadius: 40,
          borderCurve: "continuous",
          backgroundColor: slide.bgColor,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 40,
          boxShadow: `0 12px 32px ${slide.iconColor}25`,
        }}
      >
        <SymbolView
          name={slide.icon as any}
          size={64}
          tintColor={slide.iconColor}
          animationSpec={{
            effect: {
              type: "bounce",
              direction: "up",
            },
          }}
        />
      </Animated.View>

      {/* Title */}
      <Animated.View entering={FadeInDown.delay(400).duration(400)}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: "800",
            color: colors.textPrimary,
            textAlign: "center",
            letterSpacing: -0.5,
            marginBottom: spacing.md,
          }}
        >
          {slide.title}
        </Text>
      </Animated.View>

      {/* Subtitle */}
      <Animated.View entering={FadeInDown.delay(500).duration(400)}>
        <Text
          style={{
            fontSize: 17,
            color: colors.textSecondary,
            textAlign: "center",
            lineHeight: 26,
            paddingHorizontal: spacing.lg,
          }}
        >
          {slide.subtitle}
        </Text>
      </Animated.View>
    </View>
  );
}
