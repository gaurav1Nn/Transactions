import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { TransactionDto } from "../../types/api.js";
import { MoneyText } from "./MoneyText.js";
import { StatusBadge } from "./StatusBadge.js";
import { AppIcon } from "../layout/AppIcon.js";
import { statusTheme } from "../../theme/status.js";
import { formatRelativeTime } from "../../utils/format-date.js";
import { formatMoneyParts } from "../../utils/format-money.js";
import { colors } from "../../theme/colors.js";
import { space, radius } from "../../theme/spacing.js";
import { typography } from "../../theme/typography.js";

export interface TransactionListItemProps {
  transaction: TransactionDto;
  onPress?: () => void;
  showDivider?: boolean;
}

export function TransactionListItem({
  transaction,
  onPress,
  showDivider = true,
}: TransactionListItemProps): React.JSX.Element {
  const meta = statusTheme[transaction.status] || statusTheme.PENDING;
  const relativeTime = formatRelativeTime(transaction.createdAt);
  const moneyParts = formatMoneyParts(transaction.amount, transaction.currency);

  const accessibilityLabel = `${transaction.description}, ${moneyParts.speechText}, ${meta.label}, ${relativeTime}`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Opens transaction details"
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
        showDivider && styles.divider,
      ]}
    >
      {/* Left Icon Tile */}
      <View
        style={[
          styles.iconTile,
          {
            backgroundColor: meta.backgroundColor,
          },
        ]}
      >
        <AppIcon name={meta.iconName} size={20} color={meta.color} />
      </View>

      {/* Center Details */}
      <View style={styles.centerCol}>
        <Text style={[styles.description, typography.bodyStrong]} numberOfLines={2}>
          {transaction.description}
        </Text>
        <Text style={[styles.transactionId, typography.mono]} numberOfLines={1}>
          {transaction.transactionId}
        </Text>
        <Text style={[styles.time, typography.caption]}>{relativeTime}</Text>
      </View>

      {/* Right Column: Amount & Status Badge */}
      <View style={styles.rightCol}>
        <MoneyText
          amount={transaction.amount}
          currency={transaction.currency}
          size="row"
        />
        <View style={styles.badgeWrap}>
          <StatusBadge status={transaction.status} size="sm" />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: space.md,
    paddingHorizontal: space.gutter,
    minHeight: 76,
    backgroundColor: colors.surface,
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: radius.control,
    justifyContent: "center",
    alignItems: "center",
    marginRight: space.md,
  },
  centerCol: {
    flex: 1,
    marginRight: space.md,
  },
  description: {
    color: colors.ink,
    marginBottom: 2,
  },
  transactionId: {
    color: colors.inkMuted,
    fontSize: 12,
    marginBottom: 2,
  },
  time: {
    color: colors.inkSoft,
  },
  rightCol: {
    alignItems: "flex-end",
    justifyContent: "center",
    flexShrink: 0,
  },
  badgeWrap: {
    marginTop: space.xs,
  },
});
