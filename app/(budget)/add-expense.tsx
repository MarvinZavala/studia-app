import { useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable, Alert } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import * as Haptics from "expo-haptics";

import { Button } from "@/components/ui/button";
import { colors, spacing, radius, font, categoryColors } from "@/lib/theme";
import { useAuth } from "@/lib/auth-context";
import { createBudgetExpense } from "@/lib/data/studia-api";
import { getLocalISODate } from "@/lib/utils/date";
import type { BudgetCategory } from "@/lib/types/database";

const CATEGORIES: { key: BudgetCategory; icon: string; label: string }[] = [
  { key: "food", icon: "fork.knife", label: "Food" },
  { key: "school", icon: "book.closed.fill", label: "School" },
  { key: "transport", icon: "bus.fill", label: "Transport" },
  { key: "entertainment", icon: "gamecontroller.fill", label: "Fun" },
  { key: "other", icon: "archivebox.fill", label: "Other" },
];

export default function AddExpenseScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<BudgetCategory>("food");
  const [description, setDescription] = useState("");
  const [dateText, setDateText] = useState(getLocalISODate());

  async function handleSave() {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount.");
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateText)) {
      Alert.alert(
        "Invalid Date",
        "Please enter a date in YYYY-MM-DD format."
      );
      return;
    }

    if (!user?.id) {
      Alert.alert("Session expired", "Please sign in again.");
      return;
    }

    try {
      await createBudgetExpense(user.id, {
        amount: numAmount,
        category,
        description: description.trim() || null,
        date: dateText,
      });
    } catch {
      Alert.alert("Could not save expense", "Please try again.");
      return;
    }

    if (process.env.EXPO_OS === "ios") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    router.back();
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        paddingBottom: 60,
      }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Amount */}
      <Animated.View entering={FadeIn.duration(300)}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderCurve: "continuous",
            padding: spacing.lg,
            marginTop: spacing.lg,
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
            Amount
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.surfaceSecondary,
              borderRadius: radius.md,
              borderCurve: "continuous",
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.md,
            }}
          >
            <Text
              style={{
                fontSize: 28,
                fontWeight: "700",
                color: colors.textTertiary,
                marginRight: 4,
              }}
            >
              $
            </Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
              style={{
                flex: 1,
                fontSize: 28,
                fontWeight: "700",
                color: colors.textPrimary,
                padding: 0,
                fontVariant: ["tabular-nums"],
              }}
              autoFocus
            />
          </View>
        </View>
      </Animated.View>

      {/* Category */}
      <Animated.View entering={FadeInDown.delay(80).duration(300)}>
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
              marginBottom: spacing.md,
            }}
          >
            Category
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.key;
              return (
                <Pressable
                  key={cat.key}
                  onPress={() => {
                    if (process.env.EXPO_OS === "ios") {
                      Haptics.selectionAsync();
                    }
                    setCategory(cat.key);
                  }}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: radius.md,
                    borderCurve: "continuous",
                    backgroundColor: isSelected
                      ? categoryColors[cat.key] + "20"
                      : colors.surfaceSecondary,
                    borderWidth: 2,
                    borderColor: isSelected
                      ? categoryColors[cat.key]
                      : "transparent",
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <SymbolView
                    name={cat.icon as any}
                    size={16}
                    tintColor={
                      isSelected
                        ? categoryColors[cat.key]
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={{
                      ...font.subhead,
                      fontWeight: isSelected ? "600" : "400",
                      color: isSelected
                        ? categoryColors[cat.key]
                        : colors.textSecondary,
                    }}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Animated.View>

      {/* Description */}
      <Animated.View entering={FadeInDown.delay(160).duration(300)}>
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
            Description
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What was this for?"
            placeholderTextColor={colors.textTertiary}
            style={{
              ...font.body,
              color: colors.textPrimary,
              backgroundColor: colors.surfaceSecondary,
              borderRadius: radius.md,
              borderCurve: "continuous",
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.md,
            }}
          />
        </View>
      </Animated.View>

      {/* Date */}
      <Animated.View entering={FadeInDown.delay(240).duration(300)}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderCurve: "continuous",
            padding: spacing.lg,
            marginBottom: spacing.xl,
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
            Date
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.surfaceSecondary,
              borderRadius: radius.md,
              borderCurve: "continuous",
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.md,
              gap: spacing.sm,
            }}
          >
            <SymbolView
              name="calendar"
              size={18}
              tintColor={colors.textSecondary}
            />
            <TextInput
              value={dateText}
              onChangeText={setDateText}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textTertiary}
              style={{
                flex: 1,
                ...font.body,
                color: colors.textPrimary,
                padding: 0,
                fontVariant: ["tabular-nums"],
              }}
            />
          </View>
          <View
            style={{
              flexDirection: "row",
              gap: spacing.sm,
              marginTop: spacing.sm,
            }}
          >
            <Pressable
              onPress={() => {
                if (process.env.EXPO_OS === "ios") {
                  Haptics.selectionAsync();
                }
                setDateText(getLocalISODate());
              }}
              style={({ pressed }) => ({
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: radius.sm,
                borderCurve: "continuous",
                backgroundColor: colors.primaryLight,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                style={{
                  ...font.caption1,
                  fontWeight: "600",
                  color: colors.primary,
                }}
              >
                Today
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (process.env.EXPO_OS === "ios") {
                  Haptics.selectionAsync();
                }
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                setDateText(getLocalISODate(yesterday));
              }}
              style={({ pressed }) => ({
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: radius.sm,
                borderCurve: "continuous",
                backgroundColor: colors.primaryLight,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                style={{
                  ...font.caption1,
                  fontWeight: "600",
                  color: colors.primary,
                }}
              >
                Yesterday
              </Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(320).duration(300)}>
        <Button
          title="Add Expense"
          size="lg"
          onPress={handleSave}
          disabled={!amount.trim()}
        />
      </Animated.View>
    </ScrollView>
  );
}
