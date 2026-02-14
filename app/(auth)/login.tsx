import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SymbolView } from "expo-symbols";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/lib/auth-context";
import { colors, spacing, radius } from "@/lib/theme";

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
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
      ? await signUp(email.trim(), password, displayName.trim() || undefined)
      : await signIn(email.trim(), password);

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
    <KeyboardAvoidingView
      behavior="padding"
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: spacing.xl,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          entering={FadeIn.duration(600)}
          style={{ alignItems: "center", marginBottom: 48 }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              borderCurve: "continuous",
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: spacing.xl,
              boxShadow: "0 8px 24px rgba(79,107,246,0.3)",
            }}
          >
            <SymbolView name="book.fill" size={36} tintColor="#FFFFFF" />
          </View>
          <Text
            style={{
              fontSize: 32,
              fontWeight: "800",
              color: colors.textPrimary,
              letterSpacing: -0.5,
            }}
          >
            Studia
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: colors.textSecondary,
              marginTop: spacing.sm,
            }}
          >
            Your study companion
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              borderCurve: "continuous",
              padding: spacing.xl,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            {isSignUp && (
              <View style={{ marginBottom: spacing.lg }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.textSecondary,
                    marginBottom: spacing.sm,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Name
                </Text>
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Your name"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="words"
                  style={{
                    fontSize: 16,
                    color: colors.textPrimary,
                    backgroundColor: colors.background,
                    borderRadius: radius.md,
                    borderCurve: "continuous",
                    padding: spacing.lg,
                  }}
                />
              </View>
            )}

            <View style={{ marginBottom: spacing.lg }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: colors.textSecondary,
                  marginBottom: spacing.sm,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@university.edu"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                style={{
                  fontSize: 16,
                  color: colors.textPrimary,
                  backgroundColor: colors.background,
                  borderRadius: radius.md,
                  borderCurve: "continuous",
                  padding: spacing.lg,
                }}
              />
            </View>

            <View style={{ marginBottom: spacing.xl }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: colors.textSecondary,
                  marginBottom: spacing.sm,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Password
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Min. 6 characters"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry
                autoComplete="password"
                style={{
                  fontSize: 16,
                  color: colors.textPrimary,
                  backgroundColor: colors.background,
                  borderRadius: radius.md,
                  borderCurve: "continuous",
                  padding: spacing.lg,
                }}
              />
            </View>

            {error && (
              <Animated.View
                entering={FadeIn.duration(200)}
                style={{
                  backgroundColor: colors.dangerLight,
                  borderRadius: radius.sm,
                  borderCurve: "continuous",
                  padding: spacing.md,
                  marginBottom: spacing.lg,
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
                    fontWeight: "500",
                    flex: 1,
                  }}
                >
                  {error}
                </Text>
              </Animated.View>
            )}

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={({ pressed }) => ({
                backgroundColor: colors.primary,
                borderRadius: radius.md,
                borderCurve: "continuous",
                paddingVertical: 16,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed || loading ? 0.7 : 1,
                boxShadow: "0 4px 12px rgba(79,107,246,0.3)",
              })}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "700",
                    color: "#FFFFFF",
                  }}
                >
                  {isSignUp ? "Create Account" : "Sign In"}
                </Text>
              )}
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Pressable
            onPress={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            style={{ alignItems: "center", marginTop: spacing.xl }}
          >
            <Text style={{ fontSize: 15, color: colors.textSecondary }}>
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <Text style={{ color: colors.primary, fontWeight: "600" }}>
                {isSignUp ? "Sign In" : "Sign Up"}
              </Text>
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
