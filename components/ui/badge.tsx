import { View, Text, type ViewStyle } from "react-native";
import { colors } from "@/lib/theme";
import type { Priority } from "@/lib/types/database";

interface BadgeProps {
  priority: Priority;
  style?: ViewStyle;
}

const priorityConfig: Record<
  Priority,
  { background: string; text: string; label: string }
> = {
  high: { background: colors.dangerLight, text: colors.danger, label: "High" },
  medium: { background: colors.warningLight, text: colors.warning, label: "Medium" },
  low: { background: colors.primaryLight, text: colors.primary, label: "Low" },
};

export function Badge({ priority, style }: BadgeProps) {
  const config = priorityConfig[priority];

  return (
    <View
      style={[
        {
          backgroundColor: config.background,
          borderRadius: 8,
          borderCurve: "continuous",
          paddingVertical: 4,
          paddingHorizontal: 10,
          alignSelf: "flex-start",
        },
        style,
      ]}
    >
      <Text
        style={{
          color: config.text,
          fontSize: 12,
          fontWeight: "600",
        }}
      >
        {config.label}
      </Text>
    </View>
  );
}
