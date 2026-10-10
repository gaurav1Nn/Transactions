import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "../../../src/components/layout/ScreenContainer.js";
import { SegmentedControl } from "../../../src/components/forms/SegmentedControl.js";
import { AmountInput } from "../../../src/components/forms/AmountInput.js";
import { AppTextField } from "../../../src/components/forms/AppTextField.js";
import { AppButton } from "../../../src/components/forms/AppButton.js";
import { InlineNotice } from "../../../src/components/feedback/InlineNotice.js";
import { ConfirmDialog } from "../../../src/components/transactions/ConfirmDialog.js";
import { AppIcon } from "../../../src/components/layout/AppIcon.js";
import { useCreateTransaction } from "../../../src/features/transactions/useCreateTransaction.js";
import { createTransactionSchema } from "../../../src/features/transactions/create-transaction.schema.js";
import { formatMoney } from "../../../src/utils/format-money.js";
import { colors } from "../../../src/theme/colors.js";
import { space, hit } from "../../../src/theme/spacing.js";
import { typography } from "../../../src/theme/typography.js";

type CurrencyChoice = "USD" | "EUR" | "GBP";

const CURRENCY_OPTIONS = [
  { value: "USD" as CurrencyChoice, label: "USD ($)" },
  { value: "EUR" as CurrencyChoice, label: "EUR (€)" },
  { value: "GBP" as CurrencyChoice, label: "GBP (£)" },
];

export default function CreateTransactionScreen(): React.JSX.Element {
  const router = useRouter();

  const [currency, setCurrency] = useState<CurrencyChoice>("USD");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ amount?: string; description?: string }>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const { createTransaction, isLoading, error, clearError } = useCreateTransaction();

  const hasUnsavedInput = Boolean(amount.trim() || description.trim());

  const handleClose = () => {
    if (hasUnsavedInput && !isLoading) {
      setShowDiscardConfirm(true);
    } else {
      router.back();
    }
  };

  const validateForm = (): boolean => {
    const result = createTransactionSchema.safeParse({
      amount: amount.trim(),
      currency,
      description: description.trim(),
    });

    if (!result.success) {
      const errors: typeof fieldErrors = {};
      for (const issue of result.error.issues) {
        if (issue.path[0] === "amount" && !errors.amount) {
          errors.amount = issue.message;
        }
        if (issue.path[0] === "description" && !errors.description) {
          errors.description = issue.message;
        }
      }
      setFieldErrors(errors);
      return false;
    }

    setFieldErrors({});
    return true;
  };

  const handleSubmit = async () => {
    clearError();
    if (!validateForm()) return;

    await createTransaction({
      amount: amount.trim(),
      currency,
      description: description.trim(),
    });
  };

  const isAmountValid =
    Boolean(amount.trim()) && parseFloat(amount) > 0 && !fieldErrors.amount;
  const liveFormattedAmount = formatMoney(amount || "0", currency);
  return (
    <ScreenContainer scroll keyboardAvoiding padded={false}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleClose}
          hitSlop={hit.slop}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <AppIcon name="close" size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={[styles.title, typography.headline]}>New transaction</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        {/* Currency Selector */}
        <View style={styles.section}>
          <SegmentedControl
            options={CURRENCY_OPTIONS}
            value={currency}
            onChange={(val) => setCurrency(val as CurrencyChoice)}
          />
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <AmountInput
            value={amount}
            onChangeText={(val) => {
              setAmount(val);
              if (fieldErrors.amount) setFieldErrors((prev) => ({ ...prev, amount: undefined }));
            }}
            currency={currency}
            error={fieldErrors.amount}
            disabled={isLoading}
          />
        </View>

        {/* Description Field */}
        <View style={styles.section}>
          <AppTextField
            label="Description"
            value={description}
            onChangeText={(val) => {
              if (val.length <= 255) {
                setDescription(val);
                if (fieldErrors.description) setFieldErrors((prev) => ({ ...prev, description: undefined }));
              }
            }}
            placeholder="e.g. Client invoice #402"
            maxLength={255}
            error={fieldErrors.description}
            helperText={`${description.length} / 255`}
            editable={!isLoading}
          />
        </View>

        {/* Simulation Notice */}
        <InlineNotice
          variant="info"
          title="Simulation mode"
          message="New transactions start as Pending. You can simulate the final payment result from the transaction details."
        />

        {/* Server Error banner */}
        {Boolean(error) && (
          <InlineNotice
            variant="error"
            message={error!.message}
            actionText={error?.requestId ? `Ref: ${error.requestId}` : undefined}
          />
        )}

        {/* Live Summary Line & Submit */}
        <View style={styles.summarySection}>
          {isAmountValid && (
            <Text style={[styles.summaryText, typography.bodySm]}>
              You're creating a <Text style={styles.boldText}>Pending</Text> transaction of{" "}
              <Text style={styles.boldText}>{liveFormattedAmount} {currency}</Text>
            </Text>
          )}
          <View style={styles.submitWrap}>
            <AppButton
              label="Create transaction"
              loadingLabel="Creating transaction…"
              variant="primary"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={isLoading || !amount.trim() || !description.trim()}
              trailingIcon="forward"
            />
          </View>

          <Text style={[styles.footnoteText, typography.caption]}>
            Safe to retry. Duplicate taps never create two transactions.
          </Text>
        </View>
      </View>

      {/* Discard Confirmation Dialog */}
      <ConfirmDialog
        visible={showDiscardConfirm}
        title="Discard this transaction?"
        message="Any amounts and descriptions entered will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        confirmVariant="danger"
        onConfirm={() => {
          setShowDiscardConfirm(false);
          router.back();
        }}
        onCancel={() => setShowDiscardConfirm(false)}
      />
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
  closeButton: {
    width: hit.minSize,
    height: hit.minSize,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: colors.ink,
  },
  headerRight: {
    width: hit.minSize,
  },
  content: {
    paddingHorizontal: space.gutter,
    paddingVertical: space.md,
    gap: space.md,
  },
  section: {
    marginBottom: space.xs,
  },
  summarySection: {
    marginTop: space.sm,
    alignItems: "center",
  },
  summaryText: {
    color: colors.inkSoft,
    textAlign: "center",
    marginBottom: space.md,
  },
  boldText: {
    color: colors.ink,
    fontWeight: "600",
  },
  submitWrap: {
    width: "100%",
  },
  footnoteText: {
    color: colors.inkMuted,
    textAlign: "center",
    marginTop: space.sm,
  },
});
