import { Appearance } from "react-native";

const lightColors = {
  // Backgrounds
  background: "#F2F2F7",
  surface: "#FFFFFF",
  surfaceSecondary: "#F2F2F7",
  surfaceGrouped: "#FFFFFF",

  // Brand
  primary: "#5856D6",
  primaryLight: "#EDEDFC",
  primaryDark: "#3634A3",
  accent: "#FF9F0A",
  accentLight: "#FFF3E0",

  // Semantic
  secondary: "#FF375F",
  secondaryLight: "#FFEAEF",
  success: "#30D158",
  successLight: "#E7FAF0",
  warning: "#FF9F0A",
  warningLight: "#FFF3E0",
  danger: "#FF453A",
  dangerLight: "#FFECEB",

  // Text
  textPrimary: "#000000",
  textSecondary: "#8E8E93",
  textTertiary: "#AEAEB2",

  // Borders
  border: "#D1D1D6",
  borderLight: "#E5E5EA",
  separator: "#C6C6C8",

  // Special
  tint: "#5856D6",
};

const darkColors = {
  // Backgrounds
  background: "#000000",
  surface: "#1C1C1E",
  surfaceSecondary: "#2C2C2E",
  surfaceGrouped: "#1C1C1E",

  // Brand
  primary: "#7D7BFF",
  primaryLight: "#2D2B5A",
  primaryDark: "#A5A3FF",
  accent: "#FFB340",
  accentLight: "#4A3A21",

  // Semantic
  secondary: "#FF6482",
  secondaryLight: "#4A2632",
  success: "#4CD964",
  successLight: "#243C2C",
  warning: "#FFB340",
  warningLight: "#4A3A21",
  danger: "#FF6961",
  dangerLight: "#4A2A2A",

  // Text
  textPrimary: "#FFFFFF",
  textSecondary: "#A1A1A6",
  textTertiary: "#8E8E93",

  // Borders
  border: "#3A3A3C",
  borderLight: "#2C2C2E",
  separator: "#38383A",

  // Special
  tint: "#7D7BFF",
};

const systemScheme = Appearance.getColorScheme();

export const colors = systemScheme === "dark" ? darkColors : lightColors;

export const categoryColors: Record<string, string> = {
  food: '#FF375F',
  school: '#5856D6',
  transport: '#30D158',
  entertainment: '#FF9F0A',
  other: '#8E8E93',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Typography presets for consistent text sizing
export const font = {
  largeTitle: { fontSize: 34 as const, fontWeight: '700' as const, letterSpacing: 0.4 as const },
  title1: { fontSize: 28 as const, fontWeight: '700' as const, letterSpacing: 0.36 as const },
  title2: { fontSize: 22 as const, fontWeight: '700' as const, letterSpacing: 0.35 as const },
  title3: { fontSize: 20 as const, fontWeight: '600' as const, letterSpacing: 0.38 as const },
  headline: { fontSize: 17 as const, fontWeight: '600' as const, letterSpacing: -0.4 as const },
  body: { fontSize: 17 as const, fontWeight: '400' as const, letterSpacing: -0.4 as const },
  callout: { fontSize: 16 as const, fontWeight: '400' as const, letterSpacing: -0.3 as const },
  subhead: { fontSize: 15 as const, fontWeight: '400' as const, letterSpacing: -0.2 as const },
  footnote: { fontSize: 13 as const, fontWeight: '400' as const, letterSpacing: -0.1 as const },
  caption1: { fontSize: 12 as const, fontWeight: '400' as const, letterSpacing: 0 as const },
  caption2: { fontSize: 11 as const, fontWeight: '400' as const, letterSpacing: 0.1 as const },
};
