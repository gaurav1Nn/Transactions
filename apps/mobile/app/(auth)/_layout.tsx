import React from "react";
import { Stack } from "expo-router";
import { AuthGate } from "../../src/providers/AuthGate";

export default function AuthLayout(): React.JSX.Element {
  return (
    <AuthGate>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack>
    </AuthGate>
  );
}
