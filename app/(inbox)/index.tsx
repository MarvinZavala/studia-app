import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
  Alert,
  Pressable,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { useFocusEffect } from "expo-router";
import { SymbolView } from "expo-symbols";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { Badge, EmptyState } from "@/components/ui";
import { colors, spacing, radius, font } from "@/lib/theme";
import { useAuth } from "@/lib/auth-context";
import { createTasksFromInbox } from "@/lib/data/studia-api";
import {
  parseAssignmentText,
  type ParsedTask,
} from "@/lib/utils/mock-parser";
import type { Priority } from "@/lib/types/database";

const BG_COLORS = ["#EEF2FF", "#F3FCFF", "#FFF6EA"] as const;

interface StatPillProps {
  icon: string;
  label: string;
  value: string;
}

function StatPill({ icon, label, value }: StatPillProps) {
  return (
    <View
      style={{
        flex: 1,
        borderRadius: radius.md,
        borderCurve: "continuous",
        backgroundColor: "rgba(255,255,255,0.16)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.24)",
        paddingVertical: spacing.sm + 1,
        paddingHorizontal: spacing.sm,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <SymbolView name={icon as any} size={13} tintColor="rgba(255,255,255,0.88)" />
        <Text
          style={{
            ...font.caption2,
            color: "rgba(255,255,255,0.76)",
            textTransform: "uppercase",
            letterSpacing: 0.7,
          }}
        >
          {label}
        </Text>
      </View>
      <Text
        selectable
        style={{
          ...font.subhead,
          color: "#FFFFFF",
          fontWeight: "700",
          marginTop: 4,
          fontVariant: ["tabular-nums"],
        }}
      >
        {value}
      </Text>
    </View>
  );
}

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: string;
}

function PrimaryButton({ title, onPress, disabled, icon }: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => ({
        opacity: disabled ? 0.45 : pressed ? 0.78 : 1,
      })}
    >
      <LinearGradient
        colors={["#635BFF", "#2E86F5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: radius.md,
          borderCurve: "continuous",
          paddingVertical: spacing.md + 1,
          paddingHorizontal: spacing.lg,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {icon ? <SymbolView name={icon as any} size={16} tintColor="#FFFFFF" /> : null}
        <Text style={{ ...font.subhead, color: "#FFFFFF", fontWeight: "700" }}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export default function InboxScreen() {
  const [inputText, setInputText] = useState("");
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);
  const [hasParsed, setHasParsed] = useState(false);
  const [addedCount, setAddedCount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const { user } = useAuth();

  useFocusEffect(
    useCallback(() => {
      setInputText("");
      setParsedTasks([]);
      setHasParsed(false);
      setAddedCount(0);
      setShowSuccess(false);
    }, [])
  );

  function handleExtract() {
    if (!inputText.trim()) {
      Alert.alert("Empty Input", "Paste some assignment text first.");
      return;
    }
    if (process.env.EXPO_OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const tasks = parseAssignmentText(inputText.trim());
    setParsedTasks(tasks);
    setHasParsed(true);
    setShowSuccess(false);
  }

  function handleUpdateTask(
    index: number,
    field: keyof ParsedTask,
    value: string
  ) {
    setParsedTasks((prev) => {
      const updated = [...prev];
      if (field === "title") {
        updated[index] = { ...updated[index], title: value };
      } else if (field === "course") {
        updated[index] = { ...updated[index], course: value || null };
      } else if (field === "estimated_hours") {
        const num = parseFloat(value);
        updated[index] = {
          ...updated[index],
          estimated_hours: isNaN(num) ? 1 : num,
        };
      }
      return updated;
    });
  }

  function handleCyclePriority(index: number) {
    if (process.env.EXPO_OS === "ios") {
      Haptics.selectionAsync();
    }
    const cycle: Priority[] = ["low", "medium", "high"];
    setParsedTasks((prev) => {
      const updated = [...prev];
      const current = updated[index].priority;
      const nextIdx = (cycle.indexOf(current) + 1) % cycle.length;
      updated[index] = { ...updated[index], priority: cycle[nextIdx] };
      return updated;
    });
  }

  function handleRemoveTask(index: number) {
    if (process.env.EXPO_OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setParsedTasks((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleAddToPlanner() {
    if (parsedTasks.length === 0) return;
    if (!user?.id) {
      Alert.alert("Session expired", "Please sign in again.");
      return;
    }

    try {
      await createTasksFromInbox(user.id, parsedTasks, inputText);
    } catch {
      Alert.alert("Could not add tasks", "Please try again.");
      return;
    }

    if (process.env.EXPO_OS === "ios") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setAddedCount(parsedTasks.length);
    setShowSuccess(true);
    setParsedTasks([]);
    setInputText("");
    setHasParsed(false);
  }

  function renderTaskItem({
    item,
    index,
  }: {
    item: ParsedTask;
    index: number;
  }) {
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 60).duration(280)}
        exiting={FadeOut.duration(180)}
        layout={LinearTransition.duration(240)}
      >
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: radius.lg,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: "#E6EBFF",
            padding: spacing.lg,
            marginBottom: spacing.sm,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: spacing.sm,
            }}
          >
            <TextInput
              value={item.title}
              onChangeText={(v) => handleUpdateTask(index, "title", v)}
              style={{
                ...font.subhead,
                fontWeight: "700",
                flex: 1,
                color: colors.textPrimary,
                padding: 0,
                marginRight: spacing.sm,
                lineHeight: 21,
              }}
              multiline
            />
            <Pressable
              onPress={() => handleRemoveTask(index)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Remove task"
              style={{ padding: 4 }}
            >
              <SymbolView
                name="xmark.circle.fill"
                size={20}
                tintColor={colors.textTertiary}
              />
            </Pressable>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: spacing.md,
            }}
          >
            <Pressable
              onPress={() => handleCyclePriority(index)}
              accessibilityRole="button"
              accessibilityLabel="Change priority"
            >
              <Badge priority={item.priority} />
            </Pressable>

            {item.deadline ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: "#EDF4FF",
                  borderRadius: radius.sm,
                  borderCurve: "continuous",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                }}
              >
                <SymbolView
                  name="calendar"
                  size={12}
                  tintColor={colors.primary}
                />
                <Text style={{ ...font.caption1, color: colors.primary, fontWeight: "600" }}>
                  {new Date(item.deadline).toLocaleDateString()}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  ...font.caption2,
                  color: colors.textSecondary,
                  textTransform: "uppercase",
                  marginBottom: 6,
                  letterSpacing: 0.7,
                }}
              >
                Course
              </Text>
              <View
                style={{
                  backgroundColor: "#F0F5FF",
                  borderRadius: radius.sm,
                  borderCurve: "continuous",
                  borderWidth: 1,
                  borderColor: "#DEE8FF",
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: spacing.md,
                  gap: 8,
                }}
              >
                <SymbolView name="book.closed" size={13} tintColor={colors.primary} />
                <TextInput
                  value={item.course ?? ""}
                  onChangeText={(v) => handleUpdateTask(index, "course", v)}
                  placeholder="e.g. CS 201"
                  placeholderTextColor={colors.textTertiary}
                  style={{
                    ...font.footnote,
                    color: colors.textPrimary,
                    paddingVertical: 9,
                    flex: 1,
                  }}
                />
              </View>
            </View>

            <View style={{ width: 94 }}>
              <Text
                style={{
                  ...font.caption2,
                  color: colors.textSecondary,
                  textTransform: "uppercase",
                  marginBottom: 6,
                  letterSpacing: 0.7,
                }}
              >
                Hours
              </Text>
              <View
                style={{
                  backgroundColor: "#FFF4E5",
                  borderRadius: radius.sm,
                  borderCurve: "continuous",
                  borderWidth: 1,
                  borderColor: "#FFE3BC",
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: spacing.sm,
                  gap: 6,
                }}
              >
                <SymbolView name="clock.fill" size={12} tintColor={colors.warning} />
                <TextInput
                  value={String(item.estimated_hours)}
                  onChangeText={(v) =>
                    handleUpdateTask(index, "estimated_hours", v)
                  }
                  keyboardType="decimal-pad"
                  style={{
                    ...font.footnote,
                    color: colors.textPrimary,
                    paddingVertical: 9,
                    flex: 1,
                    fontVariant: ["tabular-nums"],
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#EDF2FF" }}>
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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(320)}>
          <LinearGradient
            colors={["#614FF8", "#327FF8", "#15B5FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: radius.xl,
              borderCurve: "continuous",
              padding: spacing.lg,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.3)",
              overflow: "hidden",
            }}
          >
            <View
              style={{
                position: "absolute",
                width: 150,
                height: 150,
                right: -26,
                top: -56,
                borderRadius: 75,
                backgroundColor: "rgba(255,255,255,0.14)",
              }}
            />

            <Text style={{ ...font.title2, color: "#FFFFFF", fontWeight: "800" }}>
              Smart Capture
            </Text>
            <Text
              style={{
                ...font.subhead,
                color: "rgba(255,255,255,0.82)",
                marginTop: 4,
                lineHeight: 20,
              }}
            >
              Paste your assignments, extract structured tasks, and push them
              directly into your planner.
            </Text>

            <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
              <StatPill
                icon="text.alignleft"
                label="Input"
                value={`${inputText.trim().length} chars`}
              />
              <StatPill
                icon="sparkles"
                label="Detected"
                value={`${parsedTasks.length} tasks`}
              />
              <StatPill
                icon="checkmark.circle"
                label="Added"
                value={`${addedCount}`}
              />
            </View>
          </LinearGradient>
        </Animated.View>

        {showSuccess ? (
          <Animated.View
            entering={FadeInDown.delay(40).duration(300)}
            exiting={FadeOut.duration(220)}
            style={{
              backgroundColor: "#E8FBEF",
              borderRadius: radius.lg,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: "#CFEFDB",
              padding: spacing.lg,
              marginTop: spacing.md,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <SymbolView name="checkmark.seal.fill" size={26} tintColor={colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={{ ...font.subhead, color: colors.success, fontWeight: "800" }}>
                  Tasks Added Successfully
                </Text>
                <Text style={{ ...font.caption1, color: colors.textSecondary, marginTop: 2 }}>
                  {addedCount} task{addedCount !== 1 ? "s" : ""} moved to planner.
                </Text>
              </View>
            </View>
          </Animated.View>
        ) : null}

        <Animated.View
          entering={FadeInDown.delay(80).duration(320)}
          style={{ marginTop: spacing.md }}
        >
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: radius.lg,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: "#E4EAFF",
              padding: spacing.lg,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: spacing.md,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 11,
                    borderCurve: "continuous",
                    backgroundColor: "#ECE8FF",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <SymbolView name="doc.text.magnifyingglass" size={16} tintColor={colors.primary} />
                </View>
                <View>
                  <Text style={{ ...font.subhead, color: colors.textPrimary, fontWeight: "700" }}>
                    Paste Assignment Text
                  </Text>
                  <Text style={{ ...font.caption1, color: colors.textSecondary, marginTop: 1 }}>
                    Syllabus, tasks, or exam notes
                  </Text>
                </View>
              </View>
            </View>

            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder={
                "Paste your syllabus, assignment list, or course schedule here...\n\nExample:\n1. Read Chapter 5 — due March 15\n2. Submit essay on climate policy\n3. Midterm exam review"
              }
              placeholderTextColor={colors.textTertiary}
              multiline
              textAlignVertical="top"
              style={{
                minHeight: 160,
                ...font.subhead,
                color: colors.textPrimary,
                backgroundColor: "#F2F6FF",
                borderRadius: radius.md,
                borderCurve: "continuous",
                borderWidth: 1,
                borderColor: "#DEE7FF",
                padding: spacing.lg,
                marginBottom: spacing.md,
                lineHeight: 22,
              }}
            />

            <PrimaryButton
              title="Extract Tasks"
              onPress={handleExtract}
              disabled={!inputText.trim()}
              icon="sparkles"
            />
          </View>
        </Animated.View>

        {hasParsed && parsedTasks.length === 0 && !showSuccess ? (
          <Animated.View
            entering={FadeIn.duration(260)}
            style={{ marginTop: spacing.lg }}
          >
            <EmptyState
              icon="doc.questionmark"
              title="No tasks were extracted"
              subtitle="Try a clearer format with action verbs and dates."
            />
          </Animated.View>
        ) : null}

        {parsedTasks.length > 0 ? (
          <Animated.View
            entering={FadeIn.duration(280)}
            layout={LinearTransition.duration(230)}
            style={{ marginTop: spacing.lg }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: spacing.md,
              }}
            >
              <View>
                <Text style={{ ...font.title3, color: colors.textPrimary, fontWeight: "700" }}>
                  Review Extracted Tasks
                </Text>
                <Text style={{ ...font.caption1, color: colors.textSecondary, marginTop: 2 }}>
                  Edit title, priority, hours, and course before importing
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: "#EDF4FF",
                  borderRadius: radius.full,
                  borderCurve: "continuous",
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                }}
              >
                <Text
                  style={{
                    ...font.footnote,
                    color: colors.primary,
                    fontWeight: "700",
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {parsedTasks.length}
                </Text>
              </View>
            </View>

            <FlatList
              data={parsedTasks}
              renderItem={renderTaskItem}
              keyExtractor={(_, i) => `parsed-${i}`}
              scrollEnabled={false}
            />

            <View style={{ marginTop: spacing.sm }}>
              <PrimaryButton
                title={`Add ${parsedTasks.length} Task${parsedTasks.length !== 1 ? "s" : ""} to Planner`}
                onPress={handleAddToPlanner}
                icon="arrow.down.doc.fill"
              />
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>
    </View>
  );
}
