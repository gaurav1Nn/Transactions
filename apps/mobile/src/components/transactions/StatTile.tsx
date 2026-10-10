import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { ApiTransactionStatus, statusTheme } from "../../theme/status.js";
import { AppIcon } from "../layout/AppIcon.js";
import { space, radius, border } from "../../theme/spacing.js";
import { typography } from "../../theme/typography.js";

export interface StatTileProps {
  status: ApiTransactionStatus;
  count: number;
  onPress?: () => void;
}

export function StatTile({
  status,
  count,
  onPress,
}: StatTileProps): React.JSX.Element {
  const meta = statusTheme[status] || statusTheme.PENDING;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${meta.label} transactions count: ${count}`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: meta.backgroundColor,
          borderColor: meta.borderColor,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={styles.topRow}>
        <Text style={[styles.label, typography.eyebrow, { color: meta.color }]}>
          {meta.label}
        </Text>
        <AppIcon name={meta.iconName} size={16} color={meta.color} />
      </View>
      <Text style={[styles.count, typography.display, { color: meta.color }]}>
        {count}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 88,
    borderRadius: radius.card,
    borderWidth: border.card,
    padding: space.md,
    justifyContent: "space-between",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    letterSpacing: 0.5,
  },
  count: {
    fontSize: 28,
    lineHeight: 32,
    marginTop: space.xs,
  },
});
