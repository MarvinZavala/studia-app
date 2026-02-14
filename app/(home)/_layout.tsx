import Stack from "expo-router/stack";

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerTransparent: true,
        headerBlurEffect: "systemMaterial",
        headerShadowVisible: false,
        headerLargeTitleShadowVisible: false,
        headerLargeStyle: { backgroundColor: "transparent" },
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Studia" }} />
      <Stack.Screen name="planner" options={{ title: "Planner" }} />
      <Stack.Screen name="tutor" options={{ title: "Tutor" }} />
      <Stack.Screen name="wellness" options={{ title: "Wellness" }} />
    </Stack>
  );
}
