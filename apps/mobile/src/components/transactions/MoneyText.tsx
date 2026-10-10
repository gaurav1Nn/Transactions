import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { formatMoneyParts } from "../../utils/format-money.js";
import { colors } from "../../theme/colors.js";
import { typography } from "../../theme/typography.js";
import { space } from "../../theme/spacing.js";

export interface MoneyTextProps {
  amount: string;
  currency?: string;
  size?: "row" | "hero" | "xl";
  color?: string;
  onDark?: boolean;
}

export function MoneyText({
  amount,
  currency = "USD",
  size = "row",
  color,
  onDark = false,
}: MoneyTextProps): React.JSX.Element {
  const parts = formatMoneyParts(amount, currency);

  const mainColor = color || (onDark ? colors.onNavy : colors.ink);
  const softColor = onDark ? colors.onNavySoft : colors.inkSoft;

  if (size === "row") {
    return (
      <View style={styles.rowWrap} accessibilityLabel={parts.speechText}>
        <Text
          style={[
            styles.tabular,
            typography.headline,
            { color: mainColor },
          ]}
        >
          {parts.formatted}
        </Text>
      </View>
    );
  }

  const isXL = size === "xl";
  const intFontSize = isXL ? 44 : 36;
  const decFontSize = isXL ? 24 : 20;

  return (
    <View
      style={styles.heroWrap}
      accessibilityRole="text"
      accessibilityLabel={parts.speechText}
    >
      <View style={styles.numberRow}>
        <Text
          style={[
            styles.tabular,
            typography.amountXL,
            {
              fontSize: intFontSize,
              lineHeight: intFontSize + 4,
              color: mainColor,
            },
          ]}
        >
          {parts.symbol}
          {parts.integerPart}
        </Text>
        <Text
          style={[
            styles.tabular,
            typography.title,
            {
              fontSize: decFontSize,
              lineHeight: decFontSize + 4,
              color: softColor,
              marginBottom: 4,
            },
          ]}
        >
          .{parts.decimalPart}
        </Text>
      </View>
      <Text
        style={[
          styles.currencyCode,
          typography.eyebrow,
          { color: softColor },
        ]}
      >
        {parts.currency}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  rowWrap: {
    alignItems: "flex-end",
  },
  heroWrap: {
    alignItems: "flex-start",
  },
  numberRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  tabular: {
    fontVariant: ["tabular-nums"],
  },
  currencyCode: {
    marginTop: space.xs,
  },
});
