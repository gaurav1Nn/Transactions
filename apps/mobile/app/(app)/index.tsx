import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/providers/AuthProvider.js";
import {
  useStatusCounts,
  useTransactions,
} from "../../src/features/transactions/transaction-hooks.js";
import { ScreenContainer } from "../../src/components/layout/ScreenContainer.js";
import { Avatar } from "../../src/components/layout/Avatar.js";
import { SyncStatusPill } from "../../src/components/feedback/SyncStatusPill.js";
import { TransactionSummary } from "../../src/features/transactions/TransactionSummary.js";
import { RecentTransactions } from "../../src/features/transactions/RecentTransactions.js";
import { AppButton } from "../../src/components/forms/AppButton.js";
import { getGreeting } from "../../src/utils/greeting.js";
import { formatRelativeTime } from "../../src/utils/format-date.js";
import { colors } from "../../src/theme/colors.js";
import { space, radius, border } from "../../src/theme/spacing.js";
import { typography } from "../../src/theme/typography.js";
import { TransactionDto, TransactionStatus } from "../../src/types/api.js";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getFormattedToday(): string {
  const now = new Date();
  const day = DAYS[now.getDay()];
  const date = now.getDate();
  const month = MONTHS[now.getMonth()];
  return `${day}, ${date} ${month}`;
}

export default function HomeScreen(): React.JSX.Element {
  const router = useRouter();
  const { user } = useAuth();

  const {
    pending,
    success,
    failed,
    total,
    isLoading: isCountsLoading,
    isError: isCountsError,
    isRefetching: isCountsRefetching,
    refetch: refetchCounts,
  } = useStatusCounts();

  const {
    transactions: recentList,
    isLoading: isRecentLoading,
    isError: isRecentError,
    isRefetching: isRecentRefetching,
    refetch: refetchRecent,
    dataUpdatedAt,
  } = useTransactions({ page: 1, limit: 5 });

  const greeting = getGreeting(user?.name);
  const todayDate = getFormattedToday();

  const newestTx = recentList[0];
  const lastActivityTime = newestTx
    ? formatRelativeTime(newestTx.createdAt)
    : undefined;

  const isRefreshing = isCountsRefetching || isRecentRefetching;

  const handleRefresh = async () => {
    await Promise.all([refetchCounts(), refetchRecent()]);
  };

  const handleStatusPress = (status: TransactionStatus) => {
    router.push({
      pathname: "/(app)/transactions",
      params: { status },
    });
  };

  const handleItemPress = (tx: TransactionDto) => {
    router.push(`/(app)/transactions/${tx.transactionId}`);
  };

  return (
    <ScreenContainer padded={false}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.wordmarkRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>A</Text>
          </View>
          <Text style={[styles.wordmarkText, typography.headline]}>
            ACE Transactions
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/(app)/profile")}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
        >
          <Avatar name={user?.name || "User"} size={36} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Greeting & Date block */}
        <View style={styles.greetingSection}>
          <View style={styles.greetingRow}>
            <Text style={[styles.greetingTitle, typography.title]}>
              {greeting.greetingText}
            </Text>
            <SyncStatusPill
              updatedAt={dataUpdatedAt}
              isFetching={isRefreshing}
              onPress={handleRefresh}
            />
          </View>
          <Text style={[styles.todayText, typography.bodySm]}>{todayDate}</Text>
        </View>

        {/* Hero Card & Status Tiles */}
        <View style={styles.sectionWrap}>
          <TransactionSummary
            counts={{ pending, success, failed, total }}
            lastActivityTime={lastActivityTime}
            isLoading={isCountsLoading}
            isError={isCountsError}
            onRetry={refetchCounts}
            onCreatePress={() => router.push("/(app)/transactions/create")}
            onStatusPress={handleStatusPress}
          />
        </View>

        {/* Primary Action Button */}
        <View style={styles.actionWrap}>
          <AppButton
            label="New transaction"
            variant="primary"
            leadingIcon="create"
            trailingIcon="forward"
            onPress={() => router.push("/(app)/transactions/create")}
          />
        </View>

        {/* Recent Transactions List */}
        <View style={styles.sectionWrap}>
          <RecentTransactions
            transactions={recentList}
            isLoading={isRecentLoading}
            isError={isRecentError}
            onRetry={refetchRecent}
            onViewAll={() => router.push("/(app)/transactions")}
            onItemPress={handleItemPress}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.gutter,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  wordmarkRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.control,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: space.sm,
  },
  logoBadgeText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "serif",
  },
  wordmarkText: {
    color: colors.ink,
  },
  scrollContent: {
    paddingBottom: space.huge,
  },
  greetingSection: {
    paddingHorizontal: space.gutter,
    paddingTop: space.lg,
    paddingBottom: space.sm,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greetingTitle: {
    color: colors.ink,
    flex: 1,
  },
  todayText: {
    color: colors.inkSoft,
    marginTop: space.xs,
  },
  sectionWrap: {
    paddingHorizontal: space.gutter,
    marginTop: space.md,
  },
  actionWrap: {
    paddingHorizontal: space.gutter,
    marginTop: space.lg,
  },
});
