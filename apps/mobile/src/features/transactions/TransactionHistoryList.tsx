import React, { useMemo } from "react";
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { TransactionDto } from "../../types/api";
import { TransactionListItem } from "../../components/transactions/TransactionListItem";
import { colors } from "../../theme/colors";
import { space, radius, border } from "../../theme/spacing";
import { typography } from "../../theme/typography";

export interface TransactionDateSection {
  title: string;
  tag?: "Today" | "Yesterday";
  data: TransactionDto[];
}

const SHORT_DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const SHORT_MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

export function getSectionHeaderInfo(dateInput: string | Date): {
  title: string;
  tag?: "Today" | "Yesterday";
  dateKey: string;
} {
  const d = new Date(dateInput);
  const now = new Date();

  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();

  const dayOfWeek = SHORT_DAYS[d.getDay()];
  const dateNum = d.getDate();
  const month = SHORT_MONTHS[d.getMonth()];
  const year = d.getFullYear();

  const dateKey = `${year}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    dateNum
  ).padStart(2, "0")}`;
  const title = `${dayOfWeek}, ${dateNum} ${month} ${year}`;

  return {
    title,
    tag: isToday ? "Today" : isYesterday ? "Yesterday" : undefined,
    dateKey,
  };
}

export function groupTransactionsByDate(
  transactions: TransactionDto[]
): TransactionDateSection[] {
  const map = new Map<string, TransactionDateSection>();

  for (const tx of transactions) {
    const { title, tag, dateKey } = getSectionHeaderInfo(tx.createdAt);
    let section = map.get(dateKey);
    if (!section) {
      section = { title, tag, data: [] };
      map.set(dateKey, section);
    }
    section.data.push(tx);
  }

  return Array.from(map.values());
}

export interface TransactionHistoryListProps {
  transactions: TransactionDto[];
  onItemPress?: (tx: TransactionDto) => void;
  onEndReached?: () => void;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  isNextPageError?: boolean;
  onRetryNextPage?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function TransactionHistoryList({
  transactions,
  onItemPress,
  onEndReached,
  isFetchingNextPage = false,
  hasNextPage = false,
  isNextPageError = false,
  onRetryNextPage,
  onRefresh,
  refreshing = false,
}: TransactionHistoryListProps): React.JSX.Element {
  const sections = useMemo(
    () => groupTransactionsByDate(transactions),
    [transactions]
  );

  const renderSectionHeader = ({
    section,
  }: {
    section: TransactionDateSection;
  }) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, typography.eyebrow]}>
        {section.title}
      </Text>
      {Boolean(section.tag) && (
        <View style={styles.tagBadge}>
          <Text style={[styles.tagText, typography.caption]}>
            {section.tag}
          </Text>
        </View>
      )}
    </View>
  );

  const renderItem = ({
    item,
    index,
    section,
  }: {
    item: TransactionDto;
    index: number;
    section: TransactionDateSection;
  }) => {
    const isFirst = index === 0;
    const isLast = index === section.data.length - 1;

    return (
      <View
        style={[
          styles.itemWrapper,
          isFirst && styles.firstItem,
          isLast && styles.lastItem,
        ]}
      >
        <TransactionListItem
          transaction={item}
          showDivider={!isLast}
          onPress={() => onItemPress?.(item)}
        />
      </View>
    );
  };

  const renderListFooter = () => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.footerText, typography.caption]}>
            Loading more…
          </Text>
        </View>
      );
    }

    if (isNextPageError) {
      return (
        <View style={styles.footerError}>
          <Text style={[styles.footerText, typography.caption]}>
            Couldn't load more.
          </Text>
          <TouchableOpacity onPress={onRetryNextPage}>
            <Text style={[styles.retryLink, typography.caption]}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!hasNextPage && transactions.length > 0) {
      return (
        <View style={styles.footerEnd}>
          <Text style={[styles.endText, typography.caption]}>
            You've reached the beginning.
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderSectionHeader={renderSectionHeader}
      renderItem={renderItem}
      ListFooterComponent={renderListFooter}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      stickySectionHeadersEnabled={true}
      // Android defaults this to true, which blanks the first row under a sticky header.
      removeClippedSubviews={false}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      onRefresh={onRefresh}
      refreshing={refreshing}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: space.huge,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    paddingHorizontal: space.gutter,
    paddingTop: space.lg,
    paddingBottom: space.xs,
  },
  sectionTitle: {
    color: colors.inkSoft,
    letterSpacing: 0.8,
  },
  tagBadge: {
    backgroundColor: colors.primaryTint,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.badge,
    marginLeft: space.sm,
  },
  tagText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 10,
  },
  itemWrapper: {
    marginHorizontal: space.gutter,
    backgroundColor: colors.surface,
    borderLeftWidth: border.card,
    borderRightWidth: border.card,
    borderColor: colors.border,
  },
  firstItem: {
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    borderTopWidth: border.card,
    overflow: "hidden",
  },
  lastItem: {
    borderBottomLeftRadius: radius.card,
    borderBottomRightRadius: radius.card,
    borderBottomWidth: border.card,
    overflow: "hidden",
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: space.xl,
    gap: space.sm,
  },
  footerError: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: space.xl,
    gap: space.sm,
  },
  footerEnd: {
    alignItems: "center",
    paddingVertical: space.xl,
  },
  footerText: {
    color: colors.inkSoft,
  },
  retryLink: {
    color: colors.primary,
    fontWeight: "600",
  },
  endText: {
    color: colors.inkMuted,
  },
});
