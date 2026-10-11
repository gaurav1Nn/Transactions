import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Keyboard, ScrollView, TextInput } from "react-native";
import { useNavigation, useRouter } from "expo-router";
import { ScreenContainer } from "../../../src/components/layout/ScreenContainer";
import { SegmentedControl } from "../../../src/components/forms/SegmentedControl";
import { AmountInput } from "../../../src/components/forms/AmountInput";
import { AppTextField } from "../../../src/components/forms/AppTextField";
import { AppButton } from "../../../src/components/forms/AppButton";
import { InlineNotice } from "../../../src/components/feedback/InlineNotice";
import { ConfirmDialog } from "../../../src/components/transactions/ConfirmDialog";
import { AppIcon } from "../../../src/components/layout/AppIcon";
import { useCreateTransaction } from "../../../src/features/transactions/useCreateTransaction";
import { createTransactionSchema } from "../../../src/features/transactions/create-transaction.schema";
import { formatMoney } from "../../../src/utils/format-money";
import { shouldPromptBeforeLeavingTransaction } from "../../../src/features/transactions/create-transaction-navigation";
import { colors } from "../../../src/theme/colors";
import { space, hit } from "../../../src/theme/spacing";
import { typography } from "../../../src/theme/typography";

type CurrencyChoice = "USD" | "EUR" | "GBP";

const CURRENCY_OPTIONS = [
  { value: "USD" as CurrencyChoice, label: "USD ($)" },
  { value: "EUR" as CurrencyChoice, label: "EUR (€)" },
  { value: "GBP" as CurrencyChoice, label: "GBP (£)" },
];

export default function CreateTransactionScreen(): React.JSX.Element {
  const router = useRouter();
  const navigation = useNavigation();

  const [currency, setCurrency] = useState<CurrencyChoice>("USD");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ amount?: string; description?: string }>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const discardConfirmedRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const descriptionRef = useRef<TextInput>(null);
  const revealSubmitRef = useRef(false);
  const scrollFrameRef = useRef<number | null>(null);

  const revealSubmit = useCallback(() => {
    if (scrollFrameRef.current !== null) {
      cancelAnimationFrame(scrollFrameRef.current);
    }
    // Let the viewport resize and the bottom tabs return before finding the end.
    scrollFrameRef.current = requestAnimationFrame(() => {
      scrollFrameRef.current = requestAnimationFrame(() => {
        scrollFrameRef.current = null;
        if (!revealSubmitRef.current) return;
        revealSubmitRef.current = false;
        scrollRef.current?.scrollToEnd({ animated: true });
      });
    });
  }, []);

  useEffect(() => {
    const subscription = Keyboard.addListener("keyboardDidHide", () => {
      if (revealSubmitRef.current) revealSubmit();
    });
    return () => {
      subscription.remove();
      if (scrollFrameRef.current !== null) {
        cancelAnimationFrame(scrollFrameRef.current);
      }
    };
  }, [revealSubmit]);

  const handleDescriptionDone = () => {
    if (!amount.trim() || !description.trim()) {
      Keyboard.dismiss();
      return;
    }
    revealSubmitRef.current = true;
    // A hardware keyboard may submit without an on-screen keyboard to close.
    if (!Keyboard.isVisible()) revealSubmit();
    Keyboard.dismiss();
  };

  const { createTransaction, isLoading, error, clearError } = useCreateTransaction();

  const hasUnsavedInput = Boolean(amount.trim() || description.trim());

  useEffect(
    () =>
      navigation.addListener("beforeRemove", (event) => {
        if (
          !shouldPromptBeforeLeavingTransaction({
            hasUnsavedInput,
            isSubmitting: isLoading,
            discardConfirmed: discardConfirmedRef.current,
          })
        ) {
          return;
        }

        event.preventDefault();
        setShowDiscardConfirm(true);
      }),
    [hasUnsavedInput, isLoading, navigation]
  );

  const handleClose = () => router.back();

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
    <ScreenContainer scroll keyboardAvoiding padded={false} scrollRef={scrollRef} bottomSafeArea={false}>
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
            onSubmitEditing={() => descriptionRef.current?.focus()}
          />
        </View>

        {/* Description Field */}
        <View style={styles.section}>
          <AppTextField
            ref={descriptionRef}
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
            returnKeyType="done"
            submitBehavior="blurAndSubmit"
            onSubmitEditing={handleDescriptionDone}
            onFocus={() => { revealSubmitRef.current = false; }}
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
          discardConfirmedRef.current = true;
          setShowDiscardConfirm(false);
          router.back();
        }}
        onCancel={() => {
          discardConfirmedRef.current = false;
          setShowDiscardConfirm(false);
        }}
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
