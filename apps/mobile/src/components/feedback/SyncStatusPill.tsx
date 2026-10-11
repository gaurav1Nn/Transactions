import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "../../theme/colors";
import { space, radius } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import { AppIcon } from "../layout/AppIcon";

export interface SyncStatusPillProps {
  isFetching?: boolean;
  isOffline?: boolean;
  isError?: boolean;
  updatedAt?: Date | string | number | null;
  onPress?: () => void;
}

export function formatSyncTime(updatedAt?: Date | string | number | null): string {
  if (!updatedAt) {
    return "Not yet synced";
  }

  const date = new Date(updatedAt);
  const now = Date.now();
  const diffSec = Math.floor((now - date.getTime()) / 1000);

  if (diffSec < 30) {
    return "Updated just now";
  }
  if (diffSec < 60) {
    return "Updated < 1m ago";
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `Updated ${diffMin}m ago`;
  }

  const diffHours = Math.floor(diffMin / 60);
  return `Updated ${diffHours}h ago`;
}

export function SyncStatusPill({
  isFetching = false,
  isOffline = false,
  isError = false,
  updatedAt,
  onPress,
}: SyncStatusPillProps): React.JSX.Element {
  let label = formatSyncTime(updatedAt);
  let iconName: "refresh" | "offline" | "warning" = "refresh";
  let fgColor: string = colors.inkMuted;
  let bgColor: string = colors.surfaceMuted;

  if (isOffline) {
    label = "Offline: showing saved data";
    iconName = "offline";
    fgColor = colors.pending;
    bgColor = colors.pendingBg;
  } else if (isFetching) {
    label = "Refreshing…";
    iconName = "refresh";
    fgColor = colors.primary;
    bgColor = colors.primaryTint;
  } else if (isError) {
    label = "Sync failed";
    iconName = "warning";
    fgColor = colors.failed;
    bgColor = colors.failedBg;
  }

  const content = (
    <View style={[styles.pill, { backgroundColor: bgColor }]}>
      <AppIcon name={iconName} size={14} color={fgColor} />
      <Text style={[styles.label, typography.caption, { color: fgColor }]}>
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: space.xs,
    paddingHorizontal: space.sm,
    borderRadius: radius.round,
    alignSelf: "flex-start",
  },
  label: {
    marginLeft: space.xs,
    fontWeight: "500",
  },
});
