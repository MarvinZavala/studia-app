import { View, type ViewProps } from "react-native";
import { colors, spacing, radius } from "@/lib/theme";

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, style, ...props }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderCurve: "continuous",
          padding: spacing.lg,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
