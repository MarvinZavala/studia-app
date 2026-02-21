import { Text, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { colors, font, radius, spacing } from "@/lib/theme";

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderCurve: "continuous",
        alignItems: "center",
        paddingVertical: spacing.xxl,
        paddingHorizontal: spacing.lg,
      }}
    >
      <SymbolView name={icon as any} size={40} tintColor={colors.textTertiary} />
      <Text
        style={{
          ...font.subhead,
          color: colors.textSecondary,
          marginTop: spacing.md,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={{
            ...font.footnote,
            color: colors.textTertiary,
            marginTop: spacing.xs,
            textAlign: "center",
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
