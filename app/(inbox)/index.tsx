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
import * as Haptics from "expo-haptics";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { colors, spacing, radius, font } from "@/lib/theme";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import {
  parseAssignmentText,
  type ParsedTask,
} from "@/lib/utils/mock-parser";
import type { Priority } from "@/lib/types/database";

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
    if (process.env.EXPO_OS === "ios") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const rows = parsedTasks.map((task) => ({
      user_id: user?.id,
      title: task.title,
      description: null,
      deadline: task.deadline,
      priority: task.priority,
      estimated_hours: task.estimated_hours,
      status: "pending",
      course: task.course,
      planned_date: null,
      source_text: inputText,
    }));
    await supabase.from("studia_tasks").insert(rows);

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
        entering={FadeInDown.delay(index * 70).duration(300)}
        exiting={FadeOut.duration(200)}
        layout={LinearTransition.duration(250)}
      >
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
                fontWeight: "600",
                flex: 1,
                color: colors.textPrimary,
                padding: 0,
                marginRight: spacing.sm,
              }}
              multiline
            />
            <Pressable
              onPress={() => handleRemoveTask(index)}
              hitSlop={12}
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
              gap: spacing.sm,
              marginBottom: spacing.md,
            }}
          >
            <Pressable onPress={() => handleCyclePriority(index)}>
              <Badge priority={item.priority} />
            </Pressable>

            {item.deadline && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <SymbolView
                  name="calendar"
                  size={13}
                  tintColor={colors.textSecondary}
                />
                <Text
                  style={{
                    ...font.caption1,
                    color: colors.textSecondary,
                  }}
                >
                  {new Date(item.deadline).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  ...font.caption2,
                  color: colors.textTertiary,
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                Course
              </Text>
              <TextInput
                value={item.course ?? ""}
                onChangeText={(v) => handleUpdateTask(index, "course", v)}
                placeholder="e.g. CS 201"
                placeholderTextColor={colors.textTertiary}
                style={{
                  ...font.footnote,
                  color: colors.textPrimary,
                  backgroundColor: colors.surfaceSecondary,
                  borderRadius: radius.sm,
                  borderCurve: "continuous",
                  paddingVertical: 8,
                  paddingHorizontal: spacing.md,
                }}
              />
            </View>
            <View style={{ width: 80 }}>
              <Text
                style={{
                  ...font.caption2,
                  color: colors.textTertiary,
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                Hours
              </Text>
              <TextInput
                value={String(item.estimated_hours)}
                onChangeText={(v) =>
                  handleUpdateTask(index, "estimated_hours", v)
                }
                keyboardType="decimal-pad"
                style={{
                  ...font.footnote,
                  color: colors.textPrimary,
                  backgroundColor: colors.surfaceSecondary,
                  borderRadius: radius.sm,
                  borderCurve: "continuous",
                  paddingVertical: 8,
                  paddingHorizontal: spacing.md,
                  fontVariant: ["tabular-nums"],
                }}
              />
            </View>
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        paddingBottom: 100,
      }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Success banner */}
      {showSuccess && (
        <Animated.View
          entering={FadeIn.duration(400)}
          exiting={FadeOut.duration(300)}
          style={{
            backgroundColor: colors.successLight,
            borderRadius: radius.md,
            borderCurve: "continuous",
            padding: spacing.xl,
            alignItems: "center",
            marginTop: spacing.lg,
            marginBottom: spacing.lg,
          }}
        >
          <SymbolView
            name="checkmark.circle.fill"
            size={48}
            tintColor={colors.success}
          />
          <Text
            style={{
              ...font.title3,
              color: colors.success,
              marginTop: spacing.md,
            }}
          >
            Tasks Added!
          </Text>
          <Text
            selectable
            style={{
              ...font.subhead,
              color: colors.textSecondary,
              marginTop: spacing.xs,
            }}
          >
            {addedCount} task{addedCount !== 1 ? "s" : ""} added to your
            planner.
          </Text>
        </Animated.View>
      )}

      {/* Input card */}
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
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            marginBottom: spacing.md,
          }}
        >
          <SymbolView
            name="doc.text.magnifyingglass"
            size={20}
            tintColor={colors.primary}
          />
          <Text
            style={{
              ...font.headline,
              color: colors.textPrimary,
            }}
          >
            Paste Assignment Text
          </Text>
        </View>

        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder={
            "Paste your syllabus, assignment list, or course schedule here...\n\nExample:\n1. Read Chapter 5 \u2014 due March 15\n2. Submit essay on climate policy\n3. Midterm exam review"
          }
          placeholderTextColor={colors.textTertiary}
          multiline
          textAlignVertical="top"
          style={{
            minHeight: 140,
            ...font.subhead,
            color: colors.textPrimary,
            backgroundColor: colors.surfaceSecondary,
            borderRadius: radius.md,
            borderCurve: "continuous",
            padding: spacing.lg,
            marginBottom: spacing.md,
            lineHeight: 22,
          }}
        />

        <Button
          title="Extract Tasks"
          onPress={handleExtract}
          disabled={!inputText.trim()}
        />
      </View>

      {/* Empty parse */}
      {hasParsed && parsedTasks.length === 0 && !showSuccess && (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={{ alignItems: "center", padding: spacing.xl }}
        >
          <SymbolView
            name="doc.questionmark"
            size={40}
            tintColor={colors.textTertiary}
          />
          <Text
            style={{
              ...font.subhead,
              color: colors.textSecondary,
              marginTop: spacing.md,
              textAlign: "center",
            }}
          >
            No tasks could be extracted.{"\n"}Try pasting a different format.
          </Text>
        </Animated.View>
      )}

      {/* Parsed tasks list */}
      {parsedTasks.length > 0 && (
        <Animated.View
          entering={FadeIn.duration(300)}
          layout={LinearTransition.duration(250)}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: spacing.md,
            }}
          >
            <Text
              style={{
                ...font.title3,
                color: colors.textPrimary,
              }}
            >
              Extracted Tasks
            </Text>
            <Text
              style={{
                ...font.footnote,
                color: colors.textSecondary,
                fontVariant: ["tabular-nums"],
              }}
            >
              {parsedTasks.length} task{parsedTasks.length !== 1 ? "s" : ""}
            </Text>
          </View>

          <FlatList
            data={parsedTasks}
            renderItem={renderTaskItem}
            keyExtractor={(_, i) => `parsed-${i}`}
            scrollEnabled={false}
          />

          <Button
            title={`Add ${parsedTasks.length} Task${parsedTasks.length !== 1 ? "s" : ""} to Planner`}
            size="lg"
            onPress={handleAddToPlanner}
            style={{ marginTop: spacing.sm }}
          />
        </Animated.View>
      )}
    </ScrollView>
  );
}
