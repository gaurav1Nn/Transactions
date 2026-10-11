import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useRouter, useSegments } from "expo-router";
import { useAuth } from "./AuthProvider";
import { getAuthRedirect } from "./auth-route";
import { colors } from "../theme/colors";

export function AuthGate({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { status } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const redirect = getAuthRedirect(status, segments[0]);

  useEffect(() => {
    if (redirect) {
      router.replace(redirect);
    }
  }, [redirect, router]);

  if (status === "restoring" || redirect) {
    return (
      <View style={styles.loading} accessibilityRole="progressbar">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
