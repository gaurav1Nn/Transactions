import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../theme/colors.js";
import { typography } from "../../theme/typography.js";
import { radius } from "../../theme/spacing.js";

export interface AvatarProps {
  name: string;
  size?: number;
}

export function getInitials(name: string): string {
  if (!name || typeof name !== "string") {
    return "U";
  }

  const parts = name
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  // First letter of first word + first letter of last word
  const first = parts[0].slice(0, 1).toUpperCase();
  const last = parts[parts.length - 1].slice(0, 1).toUpperCase();
  return `${first}${last}`;
}

export function Avatar({ name, size = 48 }: AvatarProps): React.JSX.Element {
  const initials = getInitials(name);
  const fontSize = Math.round(size * 0.4);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: radius.round,
        },
      ]}
      accessibilityRole="image"
      accessibilityLabel={`${name || "User"}'s avatar`}
    >
      <Text
        style={[
          styles.text,
          typography.bodyStrong,
          {
            fontSize,
          },
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primaryTint,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: colors.primary,
  },
});
