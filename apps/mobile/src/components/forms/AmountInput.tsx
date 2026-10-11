import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import {
  sanitizeAmountInput,
  padAmountOnBlur,
  addIntegerCents,
  amountToCents,
  MAX_AMOUNT_CENTS,
} from "../../utils/money-input";
import { CURRENCY_SYMBOLS } from "../../utils/format-money";
import { colors } from "../../theme/colors";
import { space, radius, border, hit } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import { useRevealFocusedInput } from "../layout/ScreenContainer";

export interface AmountInputProps {
  value: string;
  onChangeText: (text: string) => void;
  currency?: string;
  error?: string;
  disabled?: boolean;
  onSubmitEditing?: () => void;
}

export function AmountInput({
  value,
  onChangeText,
  currency = "USD",
  error,
  disabled = false,
  onSubmitEditing,
}: AmountInputProps): React.JSX.Element {
  const [isFocused, setIsFocused] = useState(false);
  const revealFocusedInput = useRevealFocusedInput();

  const symbol = CURRENCY_SYMBOLS[currency] || `${currency} `;
  const currentCents = amountToCents(value);

    const quickChips = [
      { label: `+${symbol}50`, cents: 5000 },
      { label: `+${symbol}100`, cents: 10000 },
      { label: `+${symbol}500`, cents: 50000 },
      { label: `+${symbol}1k`, cents: 100000 },
    ];

  const handleTextChange = (raw: string) => {
    const sanitized = sanitizeAmountInput(raw);
    onChangeText(sanitized);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (value) {
      onChangeText(padAmountOnBlur(value));
    }
  };

  const handleQuickAdd = (addCents: number) => {
    const nextAmount = addIntegerCents(value, addCents);
    onChangeText(nextAmount);
  };

  const handleClear = () => {
    onChangeText("");
  };

  return (
    <View style={styles.card}>
      <Text style={[styles.eyebrow, typography.eyebrow]}>AMOUNT</Text>

      <View
        style={[
          styles.inputRow,
          isFocused && styles.inputRowFocused,
          Boolean(error) && styles.inputRowError,
        ]}
      >
        <Text style={[styles.symbolText, typography.title]}>{symbol}</Text>
        <TextInput
          value={value}
          onChangeText={handleTextChange}
          onFocus={() => {
            setIsFocused(true);
            revealFocusedInput?.();
          }}
          onBlur={handleBlur}
          placeholder="0.00"
          placeholderTextColor={colors.inkMuted}
          keyboardType="decimal-pad"
          returnKeyType={onSubmitEditing ? "next" : "done"}
          submitBehavior={onSubmitEditing ? "submit" : "blurAndSubmit"}
          onSubmitEditing={onSubmitEditing}
          editable={!disabled}
          style={[styles.textInput, typography.amountXL]}
          accessibilityLabel="Transfer amount"
        />
      </View>

      <View style={styles.helperRow}>
        <Text style={[styles.helperText, typography.caption]}>
          Maximum 9,999,999,999.99
        </Text>
        {Boolean(error) && (
          <Text style={[styles.errorText, typography.caption]}>{error}</Text>
        )}
      </View>

      {/* Quick Add Chips */}
      <View style={styles.chipsRow}>
        {quickChips.map((chip) => {
          const wouldExceed = currentCents + chip.cents > MAX_AMOUNT_CENTS;
          const isChipDisabled = disabled || wouldExceed;

          return (
            <TouchableOpacity
              key={chip.label}
              onPress={() => handleQuickAdd(chip.cents)}
              disabled={isChipDisabled}
              style={[
                styles.chip,
                isChipDisabled && styles.chipDisabled,
              ]}
              hitSlop={hit.slop}
              accessibilityRole="button"
              accessibilityLabel={`Add ${chip.label}`}
            >
              <Text
                style={[
                  styles.chipText,
                  typography.caption,
                  isChipDisabled && styles.chipTextDisabled,
                ]}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          onPress={handleClear}
          disabled={disabled || !value}
          style={[styles.chip, styles.clearChip]}
          hitSlop={hit.slop}
          accessibilityRole="button"
          accessibilityLabel="Clear amount"
        >
          <Text style={[styles.clearChipText, typography.caption]}>Clear</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: border.card,
    borderColor: colors.border,
    padding: space.cardPadding,
  },
  eyebrow: {
    color: colors.inkSoft,
    letterSpacing: 0.8,
    marginBottom: space.sm,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: border.field * 2,
    borderBottomColor: colors.borderStrong,
    paddingVertical: space.xs,
  },
  inputRowFocused: {
    borderBottomColor: colors.primary,
  },
  inputRowError: {
    borderBottomColor: colors.failed,
  },
  symbolText: {
    color: colors.inkMuted,
    marginRight: space.xs,
  },
  textInput: {
    color: colors.ink,
    minWidth: 160,
    textAlign: "center",
    paddingVertical: 0,
  },
  helperRow: {
    marginTop: space.xs,
    marginBottom: space.md,
  },
  helperText: {
    color: colors.inkMuted,
    textAlign: "center",
  },
  errorText: {
    color: colors.failed,
    textAlign: "center",
    marginTop: 2,
  },
  chipsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: space.xs,
  },
  chip: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipDisabled: {
    opacity: 0.4,
  },
  chipText: {
    color: colors.ink,
    fontWeight: "600",
  },
  chipTextDisabled: {
    color: colors.inkMuted,
  },
  clearChip: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  clearChipText: {
    color: colors.inkMuted,
    fontWeight: "600",
  },
});
