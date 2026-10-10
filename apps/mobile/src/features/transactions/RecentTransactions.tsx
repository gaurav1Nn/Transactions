import React from "react";
import { View, StyleSheet } from "react-native";
import { TransactionDto } from "../../types/api.js";
import { TransactionListItem } from "../../components/transactions/TransactionListItem.js";
import { SectionHeader } from "../../components/layout/SectionHeader.js";
import { Skeleton } from "../../components/feedback/Skeleton.js";
import { ErrorState } from "../../components/feedback/RemoteStates.js";
import { colors } from "../../theme/colors.js";
import { radius, border, space } from "../../theme/spacing.js";

export interface RecentTransactionsProps {
  transactions: TransactionDto[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onViewAll?: () => void;
  onItemPress?: (tx: TransactionDto) => void;
}

export function RecentTransactions({
  transactions,
  isLoading = false,
  isError = false,
  onRetry,
  onViewAll,
  onItemPress,
}: RecentTransactionsProps): React.JSX.Element | null {
  if (!isLoading && !isError && transactions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Recent transactions"
        actionText={transactions.length > 0 ? "View all" : undefined}
        onAction={onViewAll}
      />

      <View style={styles.card}>
        {isLoading ? (
          <View style={styles.skeletonContainer}>
            <Skeleton height={68} borderRadius={radius.control} />
            <Skeleton height={68} borderRadius={radius.control} />
            <Skeleton height={68} borderRadius={radius.control} />
          </View>
        ) : isError ? (
          <View style={styles.errorContainer}>
            <ErrorState
              title="Failed to load recent activity"
              message="Please try again to see your latest transactions."
              onRetry={onRetry}
            />
          </View>
        ) : (
          transactions.map((tx, idx) => (
            <TransactionListItem
              key={tx.id}
              transaction={tx}
              showDivider={idx < transactions.length - 1}
              onPress={() => onItemPress?.(tx)}
            />
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: space.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: border.card,
    borderColor: colors.border,
    overflow: "hidden",
  },
  skeletonContainer: {
    padding: space.cardPadding,
    gap: space.md,
  },
  errorContainer: {
    padding: space.md,
  },
});
