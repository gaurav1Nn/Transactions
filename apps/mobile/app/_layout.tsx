import React from "react";
import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { QueryProvider } from "../src/providers/QueryProvider.js";
import { AuthProvider } from "../src/providers/AuthProvider.js";
import { ToastProvider } from "../src/components/feedback/Toast.js";

export default function RootLayout(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <QueryProvider>
        <AuthProvider>
          <ToastProvider>
            <Slot />
          </ToastProvider>
        </AuthProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
