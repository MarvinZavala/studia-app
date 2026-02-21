import { Pressable, Text, type PressableProps, type ViewStyle } from "react-native";
import { colors as themeColors, radius } from "@/lib/theme";

type ButtonVariant = "primary" | "secondary" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "style"> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: ViewStyle;
}

const variantStyles: Record<
  ButtonVariant,
  { background: string; text: string }
> = {
  primary: { background: themeColors.primary, text: "#FFFFFF" },
  secondary: { background: themeColors.primaryLight, text: themeColors.primary },
  danger: { background: themeColors.danger, text: "#FFFFFF" },
};

const sizeStyles: Record<
  ButtonSize,
  { paddingVertical: number; paddingHorizontal: number; fontSize: number }
> = {
  sm: { paddingVertical: 8, paddingHorizontal: 14, fontSize: 13 },
  md: { paddingVertical: 12, paddingHorizontal: 20, fontSize: 15 },
  lg: { paddingVertical: 16, paddingHorizontal: 28, fontSize: 17 },
};

export function Button({
  title,
  variant = "primary",
  size = "md",
  disabled,
  style,
  ...props
}: ButtonProps) {
  const colors = variantStyles[variant];
  const sizing = sizeStyles[size];

  return (
    <Pressable
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled }}
      android_ripple={{ color: "rgba(255,255,255,0.2)" }}
      style={({ pressed }) => [
        {
          backgroundColor: colors.background,
          borderRadius: radius.md,
          borderCurve: "continuous",
          paddingVertical: sizing.paddingVertical,
          paddingHorizontal: sizing.paddingHorizontal,
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
        },
        style,
      ]}
      {...props}
    >
      <Text
        style={{
          color: colors.text,
          fontSize: sizing.fontSize,
          fontWeight: "600",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
