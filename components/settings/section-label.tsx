import { Text } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { colors, spacing, font } from "@/lib/theme";

interface SectionLabelProps {
  title: string;
  delay: number;
}

export function SectionLabel({ title, delay }: SectionLabelProps) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(300)}>
      <Text
        style={{
          ...font.footnote,
          color: colors.textSecondary,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          fontWeight: "600",
          marginBottom: spacing.sm + 2,
          marginLeft: spacing.xs,
          marginTop: spacing.xl,
        }}
      >
        {title}
      </Text>
    </Animated.View>
  );
}
