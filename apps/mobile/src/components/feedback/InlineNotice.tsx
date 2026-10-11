import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "../../theme/colors";
import { space, radius, hit } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import { AppIcon, SemanticIconName } from "../layout/AppIcon";

export type NoticeVariant = "info" | "warning" | "error" | "success";

export interface InlineNoticeProps {
  variant?: NoticeVariant;
  title?: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

const variantStyles: Record<
  NoticeVariant,
  {
    bg: string;
    border: string;
    fg: string;
    icon: SemanticIconName;
  }
> = {
  info: {
    bg: colors.primaryTint,
    border: colors.border,
    fg: colors.primary,
    icon: "info",
  },
  warning: {
    bg: colors.pendingBg,
    border: colors.pendingBorder,
    fg: colors.pending,
    icon: "warning",
  },
  error: {
    bg: colors.failedBg,
    border: colors.failedBorder,
    fg: colors.failed,
    icon: "warning",
  },
  success: {
    bg: colors.successBg,
    border: colors.successBorder,
    fg: colors.success,
    icon: "statusSuccess",
  },
};

export function InlineNotice({
  variant = "info",
  title,
  message,
  actionText,
  onAction,
}: InlineNoticeProps): React.JSX.Element {
  const current = variantStyles[variant];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: current.bg,
          borderColor: current.border,
        },
      ]}
      accessibilityRole="alert"
    >
      <View style={styles.iconCol}>
        <AppIcon name={current.icon} size={20} color={current.fg} />
      </View>
      <View style={styles.contentCol}>
        {Boolean(title) && (
          <Text style={[styles.title, typography.bodyStrong, { color: current.fg }]}>
            {title}
          </Text>
        )}
        <Text style={[styles.message, typography.bodySm]}>{message}</Text>
        {Boolean(actionText && onAction) && (
          <TouchableOpacity
            onPress={onAction}
            hitSlop={hit.slop}
            style={styles.actionButton}
            accessibilityRole="button"
            accessibilityLabel={actionText}
          >
            <Text
              style={[
                styles.actionText,
                typography.bodyStrong,
                { color: current.fg },
              ]}
            >
              {actionText}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: space.md,
    borderRadius: radius.control,
    borderWidth: 1,
    marginVertical: space.sm,
  },
  iconCol: {
    marginRight: space.md,
    marginTop: 2,
  },
  contentCol: {
    flex: 1,
  },
  title: {
    marginBottom: space.xs,
  },
  message: {
    color: colors.inkSoft,
  },
  actionButton: {
    marginTop: space.sm,
    alignSelf: "flex-start",
  },
  actionText: {
    textDecorationLine: "underline",
  },
});
