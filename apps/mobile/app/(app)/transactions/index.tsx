import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../../src/providers/AuthProvider";
import {
  useInfiniteTransactions,
  useStatusCounts,
} from "../../../src/features/transactions/transaction-hooks";
import { ScreenContainer } from "../../../src/components/layout/ScreenContainer";
import { AppHeader } from "../../../src/components/layout/AppHeader";
import { Avatar } from "../../../src/components/layout/Avatar";
import { FilterChips, FilterValue } from "../../../src/components/transactions/FilterChips";
import { SyncStatusPill } from "../../../src/components/feedback/SyncStatusPill";
import { TransactionHistoryList } from "../../../src/features/transactions/TransactionHistoryList";
import { Skeleton } from "../../../src/components/feedback/Skeleton";
import { EmptyState, ErrorState } from "../../../src/components/feedback/RemoteStates";
import { TransactionDto, TransactionStatus } from "../../../src/types/api";
import { colors } from "../../../src/theme/colors";
import { space, radius, border } from "../../../src/theme/spacing";

export default function TransactionsHistoryScreen(): React.JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useLocalSearchParams<{ status?: string }>();

  const initialStatus =
    searchParams.status &&
    ["PENDING", "SUCCESS", "FAILED"].includes(searchParams.status)
      ? (searchParams.status as TransactionStatus)
      : "ALL";

  const [filter, setFilter] = useState<FilterValue>(initialStatus);

  // Sync state if route parameter changes
  useEffect(() => {
    if (
      searchParams.status &&
      ["PENDING", "SUCCESS", "FAILED"].includes(searchParams.status)
    ) {
      setFilter(searchParams.status as TransactionStatus);
    }
  }, [searchParams.status]);

  const activeApiStatus = filter === "ALL" ? undefined : filter;

  const {
    items,
    isLoading,
    isError,
    errorMessage,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    refetch,
    isRefetching,
    dataUpdatedAt,
  } = useInfiniteTransactions({ status: activeApiStatus, limit: 20 });

  const {
    pending: pendingCount,
    success: successCount,
    failed: failedCount,
    total: allCount,
    refetch: refetchCounts,
  } = useStatusCounts();

  const handleRefresh = async () => {
    await Promise.all([refetch(), refetchCounts()]);
  };

  const handleItemPress = (tx: TransactionDto) => {
    router.push(`/(app)/transactions/${tx.transactionId}`);
  };

  const rightHeaderAction = (
    <TouchableOpacity
      onPress={() => router.push("/(app)/profile")}
      accessibilityRole="button"
      accessibilityLabel="Open profile"
    >
      <Avatar name={user?.name || "User"} size={32} />
    </TouchableOpacity>
  );

  return (
    <ScreenContainer padded={false}>
      <AppHeader title="History" rightAction={rightHeaderAction} />

      {/* Pinned Subheader: Sync Status & Filter Chips */}
      <View style={styles.pinnedHeader}>
        <View style={styles.syncRow}>
          <SyncStatusPill
            updatedAt={dataUpdatedAt}
            isFetching={isRefetching}
            onPress={handleRefresh}
          />
        </View>

        <FilterChips
          selected={filter}
          onChange={(newVal) => setFilter(newVal)}
          counts={{
            all: allCount,
            pending: pendingCount,
            success: successCount,
            failed: failedCount,
          }}
        />
      </View>

      {/* List / States content */}
      <View style={styles.content}>
        {isLoading && items.length === 0 ? (
          <View style={styles.skeletonContainer}>
            <Skeleton height={20} width={140} style={styles.sectionSkeleton} />
            <View style={styles.cardSkeleton}>
              <Skeleton height={68} borderRadius={radius.control} />
              <Skeleton height={68} borderRadius={radius.control} />
              <Skeleton height={68} borderRadius={radius.control} />
            </View>
            <Skeleton height={20} width={140} style={styles.sectionSkeleton} />
            <View style={styles.cardSkeleton}>
              <Skeleton height={68} borderRadius={radius.control} />
              <Skeleton height={68} borderRadius={radius.control} />
            </View>
          </View>
        ) : isError && items.length === 0 ? (
          <ErrorState
            title="Unable to load history"
            message={errorMessage || "We couldn't retrieve your transactions."}
            onRetry={handleRefresh}
          />
        ) : items.length === 0 ? (
          filter === "ALL" ? (
            <EmptyState
              iconName="history"
              title="No transactions yet"
              message="Create your first transaction and it will appear here."
              actionText="Create transaction"
              onAction={() => router.push("/(app)/transactions/create")}
            />
          ) : (
            <EmptyState
              iconName="history"
              title={`No ${filter.toLowerCase()} transactions`}
              message="Nothing currently matches this filter."
              actionText="Show all"
              onAction={() => setFilter("ALL")}
            />
          )
        ) : (
          <TransactionHistoryList
            transactions={items}
            onItemPress={handleItemPress}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError) {
                void fetchNextPage();
              }
            }}
            isFetchingNextPage={isFetchingNextPage}
            isNextPageError={isFetchNextPageError}
            onRetryNextPage={() => void fetchNextPage()}
            hasNextPage={Boolean(hasNextPage)}
            onRefresh={handleRefresh}
            refreshing={isRefetching}
          />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  pinnedHeader: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  syncRow: {
    paddingHorizontal: space.gutter,
    paddingTop: space.xs,
  },
  content: {
    flex: 1,
  },
  skeletonContainer: {
    padding: space.gutter,
    gap: space.md,
  },
  sectionSkeleton: {
    marginBottom: space.xs,
  },
  cardSkeleton: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: border.card,
    borderColor: colors.border,
    padding: space.md,
    gap: space.sm,
  },
});
