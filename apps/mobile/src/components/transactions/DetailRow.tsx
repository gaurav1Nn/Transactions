import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../theme/colors.js";
import { space, radius } from "../../theme/spacing.js";
import { typography } from "../../theme/typography.js";

export interface DetailRowProps {
  label: string;
  value: string;
  caption?: string;
  mono?: boolean;
  alertStyle?: boolean;
  trailingAction?: React.ReactNode;
  showDivider?: boolean;
}

export function DetailRow({
  label,
  value,
  caption,
  mono = false,
  alertStyle = false,
  trailingAction,
  showDivider = true,
}: DetailRowProps): React.JSX.Element {
  return (
    <View
      style={[
        styles.rowWrap,
        showDivider && styles.divider,
        alertStyle && styles.alertContainer,
      ]}
    >
      <View style={styles.labelCol}>
        <Text style={[styles.label, typography.bodySm]}>{label}</Text>
      </View>
      <View style={styles.valueCol}>
        <View style={styles.valueRow}>
          <Text
            style={[
              styles.valueText,
              mono ? typography.mono : typography.bodyStrong,
              alertStyle && styles.alertText,
            ]}
          >
            {value}
          </Text>
          {Boolean(trailingAction) && (
            <View style={styles.actionWrap}>{trailingAction}</View>
          )}
        </View>
        {Boolean(caption) && (
          <Text style={[styles.captionText, typography.caption]}>
            {caption}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowWrap: {
    paddingVertical: space.md,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  alertContainer: {
    backgroundColor: colors.failedBg,
    borderRadius: radius.control,
    paddingHorizontal: space.md,
    marginVertical: space.xs,
    borderBottomWidth: 0,
  },
  labelCol: {
    width: "35%",
    paddingRight: space.sm,
  },
  label: {
    color: colors.inkSoft,
  },
  valueCol: {
    flex: 1,
    alignItems: "flex-end",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    flexWrap: "wrap",
  },
  valueText: {
    color: colors.ink,
    textAlign: "right",
  },
  alertText: {
    color: colors.failed,
  },
  actionWrap: {
    marginLeft: space.sm,
  },
  captionText: {
    color: colors.inkMuted,
    marginTop: 2,
    textAlign: "right",
  },
});
