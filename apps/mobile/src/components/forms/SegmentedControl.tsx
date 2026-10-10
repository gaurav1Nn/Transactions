import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../../theme/colors.js";
import { radius, border } from "../../theme/spacing.js";
import { typography } from "../../theme/typography.js";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: Array<SegmentOption<T>>;
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>): React.JSX.Element {
  return (
    <View style={styles.container} accessibilityRole="tablist">
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.segment, isSelected && styles.selectedSegment]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={opt.label}
          >
            <Text
              style={[
                styles.label,
                typography.bodySm,
                isSelected ? styles.selectedLabel : styles.unselectedLabel,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 44,
    flexDirection: "row",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.control,
    borderWidth: border.card,
    borderColor: colors.border,
    padding: 4,
    alignItems: "stretch",
  },
  segment: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.control - 2,
  },
  selectedSegment: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontWeight: "600",
  },
  selectedLabel: {
    color: colors.ink,
  },
  unselectedLabel: {
    color: colors.inkSoft,
  },
});
