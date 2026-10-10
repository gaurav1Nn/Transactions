import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { TransactionStatus } from "../../types/api.js";
import { AppIcon } from "../layout/AppIcon.js";
import { colors } from "../../theme/colors.js";
import { space, radius } from "../../theme/spacing.js";
import { typography } from "../../theme/typography.js";

export interface StatusStepperProps {
  status: TransactionStatus;
  createdTime?: string;
  processedTime?: string;
}

export function getStatusStepperAccessibleText(
  status: TransactionStatus
): string {
  if (status === "PENDING") {
    return "Step 2 of 3: Processing. Waiting for an outcome.";
  }
  if (status === "SUCCESS") {
    return "Step 3 of 3: Success. Transaction completed.";
  }
  return "Step 3 of 3: Failed. Transaction declined.";
}

export function StatusStepper({
  status,
  createdTime,
  processedTime,
}: StatusStepperProps): React.JSX.Element {
  const isPending = status === "PENDING";
  const isSuccess = status === "SUCCESS";
  const isFailed = status === "FAILED";

  const step3Label = isSuccess ? "Success" : isFailed ? "Failed" : "Outcome";
  const step3Color = isSuccess
    ? colors.success
    : isFailed
    ? colors.failed
    : colors.borderStrong;

  const accessibleText = getStatusStepperAccessibleText(status);

  return (
    <View
      style={styles.container}
      accessibilityRole="text"
      accessibilityLabel={accessibleText}
    >
      <View style={styles.trackRow}>
        {/* Node 1: Created */}
        <View style={[styles.node, styles.nodeActive]}>
          <AppIcon name="statusSuccess" size={14} color={colors.surface} />
        </View>

        {/* Line 1 */}
        <View
          style={[
            styles.line,
            { backgroundColor: colors.primary },
          ]}
        />

        {/* Node 2: Processing */}
        <View
          style={[
            styles.node,
            isPending ? styles.nodePending : styles.nodeActive,
          ]}
        >
          {isPending ? (
            <View style={styles.pendingDot} />
          ) : (
            <AppIcon name="statusSuccess" size={14} color={colors.surface} />
          )}
        </View>

        {/* Line 2 */}
        <View
          style={[
            styles.line,
            {
              backgroundColor: isPending ? colors.borderStrong : step3Color,
            },
          ]}
        />

        {/* Node 3: Outcome */}
        <View
          style={[
            styles.node,
            isSuccess
              ? styles.nodeSuccess
              : isFailed
              ? styles.nodeFailed
              : styles.nodeInactive,
          ]}
        >
          {isSuccess ? (
            <AppIcon name="statusSuccess" size={14} color={colors.surface} />
          ) : isFailed ? (
            <AppIcon name="statusFailed" size={14} color={colors.surface} />
          ) : (
            <View style={styles.inactiveDot} />
          )}
        </View>
      </View>

      {/* Labels & Timestamps */}
      <View style={styles.labelsRow}>
        <View style={styles.labelCol}>
          <Text style={[styles.stepLabel, typography.caption]}>Created</Text>
          {Boolean(createdTime) && (
            <Text style={[styles.timeLabel, typography.caption]}>
              {createdTime}
            </Text>
          )}
        </View>

        <View style={[styles.labelCol, styles.centerCol]}>
          <Text
            style={[
              styles.stepLabel,
              typography.caption,
              isPending && { color: colors.pending, fontWeight: "600" },
            ]}
          >
            Processing
          </Text>
        </View>

        <View style={[styles.labelCol, styles.rightCol]}>
          <Text
            style={[
              styles.stepLabel,
              typography.caption,
              { color: isPending ? colors.inkSoft : step3Color, fontWeight: isPending ? "400" : "600" },
            ]}
          >
            {step3Label}
          </Text>
          {Boolean(processedTime) && (
            <Text style={[styles.timeLabel, typography.caption]}>
              {processedTime}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: space.md,
  },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space.lg,
  },
  node: {
    width: 24,
    height: 24,
    borderRadius: radius.round,
    justifyContent: "center",
    alignItems: "center",
  },
  nodeActive: {
    backgroundColor: colors.primary,
  },
  nodePending: {
    backgroundColor: colors.pending,
  },
  nodeSuccess: {
    backgroundColor: colors.success,
  },
  nodeFailed: {
    backgroundColor: colors.failed,
  },
  nodeInactive: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.borderStrong,
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface,
  },
  inactiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderStrong,
  },
  line: {
    flex: 1,
    height: 2,
  },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: space.sm,
  },
  labelCol: {
    alignItems: "flex-start",
    flex: 1,
  },
  centerCol: {
    alignItems: "center",
  },
  rightCol: {
    alignItems: "flex-end",
  },
  stepLabel: {
    color: colors.inkSoft,
  },
  timeLabel: {
    color: colors.inkMuted,
    marginTop: 2,
  },
});
