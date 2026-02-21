import { useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { useAuth } from "@/lib/auth-context";
import { colors, spacing, radius } from "@/lib/theme";

type AuthMode = "signIn" | "signUp";

interface AuthFieldProps extends Omit<TextInputProps, "style"> {
  label: string;
  icon: string;
  trailing?: ReactNode;
}

const authFonts = {
  display: Platform.select({
    ios: "AvenirNext-Heavy",
    android: "sans-serif-medium",
    default: undefined,
  }),
  heading: Platform.select({
    ios: "AvenirNext-DemiBold",
    android: "sans-serif-medium",
    default: undefined,
  }),
  body: Platform.select({
    ios: "AvenirNext-Regular",
    android: "sans-serif",
    default: undefined,
  }),
  mono: Platform.select({
    ios: "Menlo-Regular",
    android: "monospace",
    default: undefined,
  }),
};

function AuthField({ label, icon, trailing, ...inputProps }: AuthFieldProps) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text
        style={{
          fontSize: 12,
          fontFamily: authFonts.heading,
          color: colors.textSecondary,
          marginBottom: spacing.xs,
          textTransform: "uppercase",
          letterSpacing: 0.8,
        }}
      >
        {label}
      </Text>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.surfaceSecondary,
          borderRadius: radius.md,
          borderCurve: "continuous",
          borderWidth: 1,
          borderColor: colors.borderLight,
          paddingHorizontal: spacing.md,
          minHeight: 52,
          gap: spacing.sm,
        }}
      >
        <SymbolView name={icon as any} size={16} tintColor={colors.textSecondary} />
        <TextInput
          {...inputProps}
          style={{
            flex: 1,
            fontSize: 16,
            color: colors.textPrimary,
            fontFamily: authFonts.body,
            paddingVertical: spacing.sm,
          }}
          placeholderTextColor={colors.textTertiary}
        />
        {trailing}
      </View>
    </View>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignUp = mode === "signUp";
  const canSubmit =
    email.trim().length > 0 &&
    password.trim().length > 0 &&
    (!isSignUp || displayName.trim().length > 0);

  const helperText = useMemo(
    () =>
      isSignUp
        ? "Create your workspace and start planning with clarity."
        : "Welcome back. Continue your focus streak.",
    [isSignUp]
  );

  function handleBack() {
    if (isSignUp) {
      setMode("signIn");
      setError(null);
      return;
    }
    router.replace("/(auth)/onboarding");
  }

  async function handleSubmit() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      setError("Please enter a valid email");
      return;
    }
    if (isSignUp && !displayName.trim()) {
      setError("Please add your name");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setError(null);
    setLoading(true);

    if (process.env.EXPO_OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const result = isSignUp
      ? await signUp(normalizedEmail, password, displayName.trim() || undefined)
      : await signIn(normalizedEmail, password);

    setLoading(false);

    if (result.error) {
      setError(result.error.message);
      if (process.env.EXPO_OS === "ios") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } else if (isSignUp) {
      if (process.env.EXPO_OS === "ios") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Check your email", "We sent you a confirmation link. Please verify your email to continue.");
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: spacing.xl,
            paddingBottom: spacing.xl,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeIn.duration(400)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: spacing.sm,
              marginBottom: spacing.lg,
            }}
          >
            <Pressable
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel={isSignUp ? "Back to sign in" : "Back to onboarding"}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <SymbolView
                name="chevron.left"
                size={16}
                tintColor={colors.textSecondary}
              />
              <Text
                style={{
                  fontSize: 15,
                  color: colors.textSecondary,
                  fontFamily: authFonts.body,
                }}
              >
                Back
              </Text>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(50).duration(450)}>
            <LinearGradient
              colors={[colors.primaryDark, colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: radius.xl,
                borderCurve: "continuous",
                padding: spacing.xl,
                marginBottom: spacing.lg,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  position: "absolute",
                  top: -40,
                  right: -20,
                  width: 140,
                  height: 140,
                  borderRadius: 70,
                  backgroundColor: "rgba(255,255,255,0.12)",
                }}
              />

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: spacing.md,
                  gap: spacing.md,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <SymbolView name="graduationcap.fill" size={22} tintColor="#FFFFFF" />
                </View>
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      color: "rgba(255,255,255,0.82)",
                      fontFamily: authFonts.body,
                    }}
                  >
                    Studia
                  </Text>
                  <Text
                    style={{
                      fontSize: 20,
                      color: "#FFFFFF",
                      fontFamily: authFonts.heading,
                    }}
                  >
                    Study with momentum
                  </Text>
                </View>
              </View>

              <Text
                style={{
                  fontSize: 14,
                  lineHeight: 20,
                  color: "rgba(255,255,255,0.88)",
                  fontFamily: authFonts.body,
                  marginBottom: spacing.md,
                }}
              >
                Planner precision, habit loops, and calm focus. Built for students who ship work every day.
              </Text>

              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                {["Planner", "Focus", "Wellness"].map((item) => (
                  <View
                    key={item}
                    style={{
                      borderRadius: radius.full,
                      backgroundColor: "rgba(255,255,255,0.18)",
                      paddingHorizontal: spacing.md,
                      paddingVertical: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#FFFFFF",
                        fontFamily: authFonts.heading,
                        letterSpacing: 0.3,
                      }}
                    >
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(130).duration(450)}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: radius.xl,
                borderCurve: "continuous",
                padding: spacing.xl,
                borderWidth: 1,
                borderColor: colors.borderLight,
                boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
              }}
            >
              <SegmentedControl
                values={["Sign In", "Create Account"]}
                selectedIndex={isSignUp ? 1 : 0}
                onChange={(event) => {
                  const next = event.nativeEvent.selectedSegmentIndex === 1;
                  setMode(next ? "signUp" : "signIn");
                  setError(null);
                }}
                tintColor={colors.primary}
                backgroundColor={colors.surfaceSecondary}
                fontStyle={{ color: colors.textSecondary, fontSize: 13 }}
                activeFontStyle={{ color: "#FFFFFF", fontSize: 13 }}
                style={{ marginBottom: spacing.lg }}
              />

              <Text
                style={{
                  fontSize: 22,
                  color: colors.textPrimary,
                  fontFamily: authFonts.display,
                  marginBottom: 4,
                }}
              >
                {isSignUp ? "Create your account" : "Welcome back"}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  fontFamily: authFonts.body,
                  marginBottom: spacing.lg,
                }}
              >
                {helperText}
              </Text>

              {isSignUp && (
                <AuthField
                  label="Full Name"
                  icon="person.fill"
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="e.g. Marvin Zavala"
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              )}

              <AuthField
                label="Email"
                icon="envelope.fill"
                value={email}
                onChangeText={setEmail}
                placeholder="you@university.edu"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="next"
              />

              <AuthField
                label="Password"
                icon="lock.fill"
                value={password}
                onChangeText={setPassword}
                placeholder={isSignUp ? "At least 6 characters" : "Your password"}
                secureTextEntry={!showPassword}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                returnKeyType="go"
                onSubmitEditing={handleSubmit}
                trailing={
                  <Pressable
                    onPress={() => setShowPassword((prev) => !prev)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.6 : 1,
                      padding: 2,
                    })}
                  >
                    <SymbolView
                      name={showPassword ? "eye.slash.fill" : "eye.fill"}
                      size={16}
                      tintColor={colors.textSecondary}
                    />
                  </Pressable>
                }
              />

              {isSignUp ? (
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textTertiary,
                    fontFamily: authFonts.body,
                    marginBottom: spacing.md,
                  }}
                >
                  By creating an account, you agree to receive a verification email to secure your profile.
                </Text>
              ) : null}

              {error && (
                <Animated.View
                  entering={FadeIn.duration(200)}
                  style={{
                    backgroundColor: colors.dangerLight,
                    borderRadius: radius.sm,
                    borderCurve: "continuous",
                    padding: spacing.md,
                    marginBottom: spacing.md,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.sm,
                  }}
                >
                  <SymbolView
                    name="exclamationmark.circle.fill"
                    size={16}
                    tintColor={colors.danger}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.danger,
                      fontFamily: authFonts.heading,
                      flex: 1,
                    }}
                  >
                    {error}
                  </Text>
                </Animated.View>
              )}

              <Pressable
                onPress={handleSubmit}
                disabled={loading || !canSubmit}
                accessibilityRole="button"
                accessibilityLabel={isSignUp ? "Create account" : "Sign in"}
                style={({ pressed }) => ({
                  opacity: loading || !canSubmit ? 0.6 : pressed ? 0.86 : 1,
                })}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: radius.md,
                    borderCurve: "continuous",
                    minHeight: 54,
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 10px 24px ${colors.primary}55`,
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text
                      style={{
                        fontSize: 17,
                        color: "#FFFFFF",
                        fontFamily: authFonts.heading,
                      }}
                    >
                      {isSignUp ? "Create Account" : "Sign In"}
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>

              <Pressable
                onPress={() => {
                  setMode(isSignUp ? "signIn" : "signUp");
                  setError(null);
                }}
                style={({ pressed }) => ({
                  alignItems: "center",
                  marginTop: spacing.lg,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    fontFamily: authFonts.body,
                  }}
                >
                  {isSignUp ? "Already have an account? " : "Need an account? "}
                  <Text
                    style={{
                      color: colors.primary,
                      fontFamily: authFonts.heading,
                    }}
                  >
                    {isSignUp ? "Sign In" : "Create one"}
                  </Text>
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
