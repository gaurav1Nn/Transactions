import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { colors } from "../../theme/colors.js";
import { space, radius, hit } from "../../theme/spacing.js";
import { typography } from "../../theme/typography.js";
import { AppIcon, SemanticIconName } from "../layout/AppIcon.js";

export interface LoadingStateProps {
  label?: string;
}

export function LoadingState({
  label = "Loading...",
}: LoadingStateProps): React.JSX.Element {
  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingLabel, typography.bodySm]}>{label}</Text>
    </View>
  );
}

export interface ErrorStateProps {
  title?: string;
  message: string;
  referenceId?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = "Unable to load data",
  message,
  referenceId,
  onRetry,
  retryLabel = "Try again",
}: ErrorStateProps): React.JSX.Element {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <View style={styles.errorIconWrap}>
        <AppIcon name="warning" size={32} color={colors.failed} />
      </View>
      <Text style={[styles.title, typography.headline]}>{title}</Text>
      <Text style={[styles.message, typography.bodySm]}>{message}</Text>
      {Boolean(referenceId) && (
        <Text style={[styles.refId, typography.caption]}>
          Ref ID: {referenceId}
        </Text>
      )}
      {Boolean(onRetry) && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel={retryLabel}
          hitSlop={hit.slop}
        >
          <Text style={[styles.retryText, typography.bodyStrong]}>
            {retryLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export interface EmptyStateProps {
  iconName?: SemanticIconName;
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  iconName = "info",
  title,
  message,
  actionText,
  onAction,
}: EmptyStateProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <View style={styles.emptyIconWrap}>
        <AppIcon name={iconName} size={36} color={colors.inkMuted} />
      </View>
      <Text style={[styles.title, typography.headline]}>{title}</Text>
      <Text style={[styles.message, typography.bodySm]}>{message}</Text>
      {Boolean(actionText && onAction) && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionText}
          hitSlop={hit.slop}
        >
          <Text style={[styles.actionText, typography.bodyStrong]}>
            {actionText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: space.xxxl,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingLabel: {
    color: colors.inkSoft,
    marginTop: space.md,
  },
  errorIconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.round,
    backgroundColor: colors.failedBg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: space.lg,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceMuted,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: space.lg,
  },
  title: {
    color: colors.ink,
    textAlign: "center",
    marginBottom: space.xs,
  },
  message: {
    color: colors.inkSoft,
    textAlign: "center",
    maxWidth: 280,
    marginBottom: space.lg,
  },
  refId: {
    color: colors.inkMuted,
    fontFamily: "monospace",
    marginBottom: space.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: space.md,
    paddingHorizontal: space.xxl,
    borderRadius: radius.control,
  },
  retryText: {
    color: colors.surface,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingVertical: space.md,
    paddingHorizontal: space.xxl,
    borderRadius: radius.control,
  },
  actionText: {
    color: colors.surface,
  },
});
