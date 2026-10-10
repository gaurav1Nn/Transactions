import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";

export default function StartupScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2F66CF" />
      <Text style={styles.title}>ACE Transactions</Text>
      <Text style={styles.subtitle}>Initializing...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F8FA",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: "#4B5565",
    marginTop: 8,
  },
});
