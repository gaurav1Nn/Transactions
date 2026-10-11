import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { TransactionStatus } from "../../types/api";
import { colors } from "../../theme/colors";
import { space, radius, border } from "../../theme/spacing";
import { typography } from "../../theme/typography";

export type FilterValue = "ALL" | TransactionStatus;

export interface FilterChipsProps {
  selected: FilterValue;
  onChange: (value: FilterValue) => void;
  counts?: {
    all?: number;
    pending?: number;
    success?: number;
    failed?: number;
  };
}

export function FilterChips({
  selected,
  onChange,
  counts,
}: FilterChipsProps): React.JSX.Element {
  const chips: Array<{ value: FilterValue; label: string; count?: number }> = [
    { value: "ALL", label: "All", count: counts?.all },
    { value: "PENDING", label: "Pending", count: counts?.pending },
    { value: "SUCCESS", label: "Success", count: counts?.success },
    { value: "FAILED", label: "Failed", count: counts?.failed },
  ];

  return (
    <View style={styles.container} accessibilityRole="tablist">
      {chips.map((chip) => {
        const isSelected = selected === chip.value;
        const hasCount = typeof chip.count === "number";

        return (
          <TouchableOpacity
            key={chip.value}
            onPress={() => onChange(chip.value)}
            style={[
              styles.chip,
              isSelected ? styles.selectedChip : styles.unselectedChip,
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${chip.label}${hasCount ? ` (${chip.count})` : ""}`}
          >
            <Text
              style={[
                styles.label,
                typography.caption,
                isSelected ? styles.selectedLabel : styles.unselectedLabel,
              ]}
              numberOfLines={1}
            >
              {chip.label}
              {hasCount ? ` ${chip.count}` : ""}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: space.xs,
    paddingHorizontal: space.gutter,
    paddingVertical: space.sm,
  },
  chip: {
    flex: 1,
    height: 40,
    borderRadius: radius.control,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: space.xs,
  },
  selectedChip: {
    backgroundColor: colors.primary,
    borderWidth: 0,
  },
  unselectedChip: {
    backgroundColor: colors.surface,
    borderWidth: border.card,
    borderColor: colors.borderStrong,
  },
  label: {
    fontWeight: "600",
  },
  selectedLabel: {
    color: colors.surface,
  },
  unselectedLabel: {
    color: colors.ink,
  },
});
