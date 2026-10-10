import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { TransactionStatus } from "../../types/api.js";
import { StatTile } from "../../components/transactions/StatTile.js";
import { Skeleton } from "../../components/feedback/Skeleton.js";
import { ErrorState } from "../../components/feedback/RemoteStates.js";
import { AppButton } from "../../components/forms/AppButton.js";
import { colors } from "../../theme/colors.js";
import { space, radius, border } from "../../theme/spacing.js";
import { typography } from "../../theme/typography.js";

export interface TransactionSummaryProps {
  counts: {
    pending: number;
    success: number;
    failed: number;
    total: number;
  };
  lastActivityTime?: string;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onCreatePress?: () => void;
  onStatusPress?: (status: TransactionStatus) => void;
}

export function TransactionSummary({
  counts,
  lastActivityTime,
  isLoading = false,
  isError = false,
  onRetry,
  onCreatePress,
  onStatusPress,
}: TransactionSummaryProps): React.JSX.Element {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Skeleton height={180} borderRadius={radius.hero} />
        <View style={styles.tilesRow}>
          <Skeleton height={88} borderRadius={radius.card} style={styles.tileCol} />
          <Skeleton height={88} borderRadius={radius.card} style={styles.tileCol} />
          <Skeleton height={88} borderRadius={radius.card} style={styles.tileCol} />
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <View style={styles.errorCard}>
          <ErrorState
            title="Unable to load summary"
            message="We couldn't retrieve your transaction metrics."
            onRetry={onRetry}
          />
        </View>
      </View>
    );
  }

  const { pending, success, failed, total } = counts;
  const isEmpty = total === 0;

  const successRate = total > 0 ? (Math.round((success * 1000) / total) / 10).toFixed(1) : "0.0";

  return (
    <View style={styles.container}>
      {isEmpty ? (
        <View style={styles.welcomeCard}>
          <Text style={[styles.welcomeTitle, typography.headline]}>
            No transactions yet
          </Text>
          <Text style={[styles.welcomeSubtitle, typography.bodySm]}>
            Create your first transaction to simulate its outcome and track history.
          </Text>
          <View style={styles.welcomeActionWrap}>
            <AppButton
              label="Create transaction"
              variant="primary"
              onPress={onCreatePress}
              trailingIcon="forward"
              fullWidth={false}
            />
          </View>
        </View>
      ) : (
        <View style={styles.heroCard}>
          {/* Decorative Circles */}
          <View style={styles.decoCircle1} />
          <View style={styles.decoCircle2} />

          {/* Top Eyebrow */}
          <Text style={[styles.eyebrow, typography.eyebrow]}>
            ALL TRANSACTIONS
          </Text>

          {/* Count and label */}
          <View style={styles.countRow}>
            <Text style={[styles.totalCount, typography.display]}>
              {total}
            </Text>
            <Text style={[styles.transactionsLabel, typography.bodySm]}>
              transactions
            </Text>
          </View>

          {/* Distribution Bar */}
          <View
            style={styles.barContainer}
            accessibilityLabel={`Success: ${success}, Pending: ${pending}, Failed: ${failed}`}
          >
            {success > 0 && (
              <View
                style={[
                  styles.barSegment,
                  { flex: success, backgroundColor: colors.successOnDark },
                ]}
              />
            )}
            {pending > 0 && (
              <View
                style={[
                  styles.barSegment,
                  { flex: pending, backgroundColor: colors.pendingOnDark },
                ]}
              />
            )}
            {failed > 0 && (
              <View
                style={[
                  styles.barSegment,
                  { flex: failed, backgroundColor: colors.failedOnDark },
                ]}
              />
            )}
          </View>

          {/* Legend Row */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: colors.successOnDark }]} />
              <Text style={[styles.legendText, typography.caption]}>
                Success {success}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: colors.pendingOnDark }]} />
              <Text style={[styles.legendText, typography.caption]}>
                Pending {pending}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: colors.failedOnDark }]} />
              <Text style={[styles.legendText, typography.caption]}>
                Failed {failed}
              </Text>
            </View>
          </View>

          {/* Divider & Facts */}
          <View style={styles.heroDivider} />
          <View style={styles.factsRow}>
            <View>
              <Text style={[styles.factLabel, typography.caption]}>
                Success rate
              </Text>
              <Text style={[styles.factValue, typography.bodyStrong]}>
                {successRate}%
              </Text>
            </View>
            {Boolean(lastActivityTime) && (
              <View style={styles.rightFact}>
                <Text style={[styles.factLabel, typography.caption]}>
                  Last activity
                </Text>
                <Text style={[styles.factValue, typography.bodyStrong]}>
                  {lastActivityTime}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* 3 Status Tiles */}
      <View style={styles.tilesRow}>
        <View style={styles.tileCol}>
          <StatTile
            status="PENDING"
            count={pending}
            onPress={total > 0 ? () => onStatusPress?.("PENDING") : undefined}
          />
        </View>
        <View style={styles.tileCol}>
          <StatTile
            status="SUCCESS"
            count={success}
            onPress={total > 0 ? () => onStatusPress?.("SUCCESS") : undefined}
          />
        </View>
        <View style={styles.tileCol}>
          <StatTile
            status="FAILED"
            count={failed}
            onPress={total > 0 ? () => onStatusPress?.("FAILED") : undefined}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: space.md,
  },
  heroCard: {
    backgroundColor: colors.navy,
    borderRadius: radius.hero,
    padding: space.xl,
    overflow: "hidden",
    position: "relative",
  },
  decoCircle1: {
    position: "absolute",
    right: -30,
    top: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.navyRaised,
    opacity: 0.6,
  },
  decoCircle2: {
    position: "absolute",
    right: 40,
    top: -60,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.navyRaised,
    opacity: 0.3,
  },
  welcomeCard: {
    backgroundColor: colors.primaryTint,
    borderRadius: radius.hero,
    padding: space.xl,
    borderWidth: border.card,
    borderColor: colors.border,
  },
  welcomeTitle: {
    color: colors.primary,
    marginBottom: space.xs,
  },
  welcomeSubtitle: {
    color: colors.inkSoft,
    marginBottom: space.lg,
    lineHeight: 20,
  },
  welcomeActionWrap: {
    alignSelf: "flex-start",
  },
  errorCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: border.card,
    borderColor: colors.border,
    padding: space.md,
  },
  eyebrow: {
    color: colors.onNavySoft,
    letterSpacing: 0.8,
  },
  countRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: space.xs,
    marginBottom: space.md,
  },
  totalCount: {
    color: colors.onNavy,
  },
  transactionsLabel: {
    color: colors.onNavySoft,
    marginLeft: space.sm,
  },
  barContainer: {
    height: 8,
    borderRadius: radius.round,
    overflow: "hidden",
    flexDirection: "row",
    gap: 2,
    backgroundColor: colors.navyRaised,
    marginBottom: space.sm,
  },
  barSegment: {
    height: "100%",
    borderRadius: radius.round,
  },
  legendRow: {
    flexDirection: "row",
    gap: space.lg,
    marginBottom: space.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: space.xs,
  },
  legendText: {
    color: colors.onNavySoft,
  },
  heroDivider: {
    height: 1,
    backgroundColor: colors.navyRaised,
    marginBottom: space.md,
  },
  factsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rightFact: {
    alignItems: "flex-end",
  },
  factLabel: {
    color: colors.onNavySoft,
  },
  factValue: {
    color: colors.onNavy,
    marginTop: 2,
  },
  tilesRow: {
    flexDirection: "row",
    gap: space.md,
  },
  tileCol: {
    flex: 1,
  },
});
