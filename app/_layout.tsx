import "expo-sqlite/localStorage/install";

import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter, useSegments, Slot } from "expo-router";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { colors } from "@/lib/theme";

function RootLayoutNav() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      const onboardingDone = localStorage.getItem("studia_onboarding_complete");
      if (onboardingDone) {
        router.replace("/(auth)/login");
      } else {
        router.replace("/(auth)/onboarding");
      }
    } else if (session && inAuthGroup) {
      router.replace("/(home)");
    }
  }, [session, isLoading, segments]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // When not authenticated, render auth screens without the tab bar
  if (!session) {
    return <Slot />;
  }

  return (
    <NativeTabs
      minimizeBehavior="onScrollDown"
      disableTransparentOnScrollEdge
      backgroundColor={colors.surface}
      shadowColor={colors.borderLight}
    >
      <NativeTabs.Trigger name="(auth)" hidden />
      <NativeTabs.Trigger name="(home)">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(inbox)">
        <Icon
          sf={{
            default: "tray.and.arrow.down",
            selected: "tray.and.arrow.down.fill",
          }}
        />
        <Label>Inbox</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(study)">
        <Icon sf={{ default: "book", selected: "book.fill" }} />
        <Label>Study</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(budget)">
        <Icon sf={{ default: "creditcard", selected: "creditcard.fill" }} />
        <Label>Budget</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(settings)">
        <Icon sf={{ default: "gearshape", selected: "gearshape.fill" }} />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
