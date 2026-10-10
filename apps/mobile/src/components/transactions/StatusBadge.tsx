import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { statusTheme, ApiTransactionStatus } from "../../theme/status.js";
import { radius, space } from "../../theme/spacing.js";
import { typography } from "../../theme/typography.js";
import { AppIcon } from "../layout/AppIcon.js";

export interface StatusBadgeProps {
  status: ApiTransactionStatus;
  size?: "sm" | "lg";
}

export function StatusBadge({
  status,
  size = "sm",
}: StatusBadgeProps): React.JSX.Element {
  const meta = statusTheme[status] || statusTheme.PENDING;
  const isLg = size === "lg";
  const iconSize = isLg ? 16 : 13;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: meta.backgroundColor,
          borderColor: meta.borderColor,
          paddingVertical: isLg ? space.xs + 2 : space.xs,
          paddingHorizontal: isLg ? space.md : space.sm,
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${meta.label}`}
    >
      <AppIcon name={meta.iconName} size={iconSize} color={meta.color} />
      <Text
        style={[
          styles.text,
          typography.caption,
          {
            color: meta.color,
            fontSize: isLg ? 14 : 12,
            lineHeight: isLg ? 18 : 16,
          },
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.badge,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  text: {
    fontWeight: "700",
    letterSpacing: 0.5,
    marginLeft: space.xs,
  },
});
