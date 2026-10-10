import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "../../theme/colors.js";
import { space, hit } from "../../theme/spacing.js";
import { typography } from "../../theme/typography.js";

export interface SectionHeaderProps {
  title: string;
  actionText?: string;
  onAction?: () => void;
}

export function SectionHeader({
  title,
  actionText,
  onAction,
}: SectionHeaderProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text
        style={[styles.title, typography.headline]}
        accessibilityRole="header"
      >
        {title}
      </Text>
      {Boolean(actionText && onAction) && (
        <TouchableOpacity
          onPress={onAction}
          hitSlop={hit.slop}
          accessibilityRole="button"
          accessibilityLabel={actionText}
        >
          <Text style={[styles.action, typography.bodySm]}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: space.md,
  },
  title: {
    color: colors.ink,
  },
  action: {
    color: colors.primary,
    fontWeight: "600",
  },
});
