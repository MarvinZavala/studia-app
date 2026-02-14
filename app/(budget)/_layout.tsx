import Stack from "expo-router/stack";

export default function BudgetLayout() {
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
      <Stack.Screen name="index" options={{ title: "Budget" }} />
      <Stack.Screen
        name="add-expense"
        options={{
          title: "Add Expense",
          presentation: "formSheet",
          sheetGrabberVisible: true,
          sheetCornerRadius: 20,
          headerLargeTitle: false,
        }}
      />
    </Stack>
  );
}
