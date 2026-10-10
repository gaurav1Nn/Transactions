import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../src/providers/AuthProvider.js";
import { colors } from "../src/theme/colors.js";
import { typography } from "../src/theme/typography.js";
import { space } from "../src/theme/spacing.js";

export default function IndexRoute(): React.JSX.Element {
  const { status } = useAuth();

  if (status === "restoring") {
    return (
      <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel="Initializing session">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.title, typography.title]}>ACE Transactions</Text>
        <Text style={[styles.subtitle, typography.bodySm]}>Initializing secure session...</Text>
      </View>
    );
  }

  if (status === "authenticated") {
    return <Redirect href="/(app)" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: space.gutter,
  },
  title: {
    color: colors.ink,
    marginTop: space.lg,
  },
  subtitle: {
    color: colors.inkSoft,
    marginTop: space.xs,
  },
});
