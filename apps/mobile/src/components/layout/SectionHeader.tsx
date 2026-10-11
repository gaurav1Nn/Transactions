import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "../../theme/colors";
import { space, hit } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import { AppIcon } from "./AppIcon";

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
          style={styles.actionRow}
          accessibilityRole="button"
          accessibilityLabel={actionText}
        >
          <Text style={[styles.action, typography.bodySm]}>{actionText}</Text>
          <AppIcon name="forward" size={14} color={colors.primary} />
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
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  action: {
    color: colors.primary,
    fontWeight: "600",
  },
});
