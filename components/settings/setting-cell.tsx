import { Pressable, Text, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { colors, spacing, radius, font } from "@/lib/theme";

interface SettingCellProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  isDestructive?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}

export function SettingCell({
  icon,
  iconColor,
  iconBg,
  label,
  subtitle,
  value,
  onPress,
  isDestructive,
  isFirst,
  isLast,
}: SettingCellProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: pressed && onPress ? colors.surfaceSecondary : colors.surface,
        paddingVertical: spacing.md + 1,
        paddingHorizontal: spacing.lg,
        borderTopLeftRadius: isFirst ? radius.md : 0,
        borderTopRightRadius: isFirst ? radius.md : 0,
        borderBottomLeftRadius: isLast ? radius.md : 0,
        borderBottomRightRadius: isLast ? radius.md : 0,
        borderCurve: "continuous",
      })}
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
          marginRight: spacing.md + 2,
          marginTop: 1,
        }}
      >
        <SymbolView name={icon as any} size={16} tintColor={iconColor} />
      </View>
      <View style={{ flex: 1, paddingTop: 1 }}>
        <Text
          style={{
            ...font.body,
            color: isDestructive ? colors.danger : colors.textPrimary,
            fontWeight: "500",
          }}
        >
          {label}
        </Text>
        {subtitle ? (
          <Text
            style={{
              ...font.caption1,
              color: colors.textSecondary,
              marginTop: 2,
              lineHeight: 16,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value && (
        <Text
          selectable
          style={{
            ...font.body,
            color: colors.textSecondary,
            fontVariant: ["tabular-nums"],
            marginRight: onPress ? spacing.xs : 0,
            marginTop: subtitle ? 3 : 0,
          }}
        >
          {value}
        </Text>
      )}
      {onPress && !isDestructive && (
        <View style={{ marginTop: subtitle ? 5 : 3 }}>
          <SymbolView name="chevron.right" size={14} tintColor={colors.textTertiary} />
        </View>
      )}
      {!isLast && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 62,
            right: 0,
            height: 0.5,
            backgroundColor: colors.separator,
          }}
        />
      )}
    </Pressable>
  );
}
