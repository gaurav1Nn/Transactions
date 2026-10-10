import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Share,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import {
  useTransaction,
  useSimulateTransaction,
} from "./transaction-hooks.js";
import { ScreenContainer } from "../../components/layout/ScreenContainer.js";
import { AppHeader } from "../../components/layout/AppHeader.js";
import { MoneyText } from "../../components/transactions/MoneyText.js";
import { StatusBadge } from "../../components/transactions/StatusBadge.js";
import { StatusStepper } from "../../components/transactions/StatusStepper.js";
import { DetailRow } from "../../components/transactions/DetailRow.js";
import { AppButton } from "../../components/forms/AppButton.js";
import { ConfirmDialog } from "../../components/transactions/ConfirmDialog.js";
import { InlineNotice } from "../../components/feedback/InlineNotice.js";
import { Skeleton } from "../../components/feedback/Skeleton.js";
import { EmptyState, ErrorState } from "../../components/feedback/RemoteStates.js";
import { AppIcon } from "../../components/layout/AppIcon.js";
import { useToast } from "../../components/feedback/Toast.js";
import {
  formatFullDateTime,
  formatUtcDateTime,
} from "../../utils/format-date.js";
import { colors } from "../../theme/colors.js";
import { space, radius, border, hit } from "../../theme/spacing.js";
import { typography } from "../../theme/typography.js";

export interface TransactionDetailsProps {
  id: string;
}

export function TransactionDetails({ id }: TransactionDetailsProps): React.JSX.Element {
  const router = useRouter();
  const { showToast } = useToast();

  const {
    transaction: tx,
    isLoading,
    isError,
    error,
    refetch,
  } = useTransaction(id);

  const simulateMutation = useSimulateTransaction();

  const [confirmOutcome, setConfirmOutcome] = useState<"SUCCESS" | "FAILED" | null>(
    null
  );

  const handleShareId = async () => {
    if (!tx?.transactionId) return;
    try {
      await Share.share({
        message: tx.transactionId,
        title: "Transaction ID",
      });
    } catch {
      // Ignored
    }
  };

  const handleConfirmSimulation = async () => {
    if (!confirmOutcome || !tx) return;

    const outcome = confirmOutcome;

    try {
      await simulateMutation.mutateAsync({
        id: tx.transactionId,
        outcome,
      });

      setConfirmOutcome(null);
      showToast(
        outcome === "SUCCESS" ? "Marked as Success" : "Marked as Failed",
        outcome === "SUCCESS" ? "success" : "error"
      );
    } catch (err) {
      setConfirmOutcome(null);
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        showToast("This transaction was already finalized.", "info");
        void refetch();
      } else {
        showToast("Failed to simulate transaction.", "error");
      }
    }
  };

  const is404 =
    axios.isAxiosError(error) && error.response?.status === 404;

  if (isLoading && !tx) {
    return (
      <ScreenContainer padded={false}>
        <AppHeader title="Transaction" showBack onBack={() => router.back()} />
        <View style={styles.contentWrap}>
          <Skeleton height={260} borderRadius={radius.card} />
          <Skeleton height={220} borderRadius={radius.card} />
          <Skeleton height={140} borderRadius={radius.card} />
        </View>
      </ScreenContainer>
    );
  }

  if (is404 || !tx) {
    return (
      <ScreenContainer padded={false}>
        <AppHeader title="Transaction" showBack onBack={() => router.back()} />
        <View style={styles.centerContainer}>
          <EmptyState
            iconName="info"
            title="Transaction not found"
            message="It may have been removed, or it isn't yours to view."
            actionText="Back to history"
            onAction={() => router.replace("/(app)/transactions")}
          />
        </View>
      </ScreenContainer>
    );
  }

  if (isError && !tx) {
    return (
      <ScreenContainer padded={false}>
        <AppHeader title="Transaction" showBack onBack={() => router.back()} />
        <View style={styles.centerContainer}>
          <ErrorState
            title="Unable to load transaction"
            message="Failed to retrieve transaction details."
            onRetry={refetch}
          />
        </View>
      </ScreenContainer>
    );
  }

  const isPending = tx.status === "PENDING";
  const isFailed = tx.status === "FAILED";

  const createdFormatted = formatFullDateTime(tx.createdAt);
  const createdUtcFormatted = formatUtcDateTime(tx.createdAt);
  const processedFormatted = tx.processedAt
    ? formatFullDateTime(tx.processedAt)
    : "Awaiting outcome";

  return (
    <ScreenContainer padded={false}>
      <AppHeader title="Transaction" showBack onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWrap}>
          {/* Status Hero Card */}
          <View style={styles.card}>
            <View style={styles.heroTopRow}>
              <Text style={[styles.heroTxId, typography.mono]} numberOfLines={1}>
                {tx.transactionId}
              </Text>
              <StatusBadge status={tx.status} size="lg" />
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroAmountWrap}>
              <MoneyText
                amount={tx.amount}
                currency={tx.currency}
                size="xl"
              />
            </View>

            <Text style={[styles.heroDescription, typography.body]} numberOfLines={3}>
              {tx.description}
            </Text>

            <StatusStepper
              status={tx.status}
              createdTime={createdFormatted}
              processedTime={tx.processedAt ? processedFormatted : undefined}
            />
          </View>

          {/* Details Card */}
          <View style={styles.card}>
            <Text style={[styles.cardTitle, typography.headline]}>Details</Text>

            <DetailRow
              label="Transaction ID"
              value={tx.transactionId}
              mono
              trailingAction={
                <TouchableOpacity
                  onPress={handleShareId}
                  hitSlop={hit.slop}
                  accessibilityRole="button"
                  accessibilityLabel="Share transaction ID"
                >
                  <AppIcon name="share" size={18} color={colors.primary} />
                </TouchableOpacity>
              }
            />

            <DetailRow label="Description" value={tx.description} />

            <DetailRow
              label="Created"
              value={createdFormatted}
              caption={createdUtcFormatted}
            />

            <DetailRow
              label="Processed"
              value={processedFormatted}
              caption={tx.processedAt ? formatUtcDateTime(tx.processedAt) : undefined}
            />

            {isFailed && Boolean(tx.failureReason) && (
              <DetailRow
                label="Failure reason"
                value={tx.failureReason!}
                alertStyle
                showDivider={false}
              />
            )}
          </View>

          {/* Simulation or Final State Card */}
          {isPending ? (
            <View style={styles.card}>
              <View style={styles.simTitleRow}>
                <AppIcon name="sandbox" size={20} color={colors.primary} />
                <Text style={[styles.simTitle, typography.headline]}>
                  Simulate outcome
                </Text>
              </View>
              <Text style={[styles.simSubtitle, typography.bodySm]}>
                Choose how this sandbox transaction ends. This action cannot be reversed.
              </Text>

              <View style={styles.simButtonsRow}>
                <AppButton
                  label="Simulate success"
                  variant="success"
                  leadingIcon="statusSuccess"
                  onPress={() => setConfirmOutcome("SUCCESS")}
                  disabled={simulateMutation.isPending}
                />
                <AppButton
                  label="Simulate failure"
                  variant="danger"
                  leadingIcon="statusFailed"
                  onPress={() => setConfirmOutcome("FAILED")}
                  disabled={simulateMutation.isPending}
                />
              </View>
            </View>
          ) : (
            <InlineNotice
              variant="info"
              message={`Outcome recorded on ${processedFormatted}. Final transactions cannot be changed.`}
            />
          )}
        </View>
      </ScrollView>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        visible={Boolean(confirmOutcome)}
        title={confirmOutcome === "SUCCESS" ? "Mark as Success?" : "Mark as Failed?"}
        message={
          confirmOutcome === "SUCCESS"
            ? `${tx.transactionId} will be marked Success. This is final.`
            : `${tx.transactionId} will be marked Failed. This is final.`
        }
        confirmLabel={
          confirmOutcome === "SUCCESS" ? "Simulate success" : "Simulate failure"
        }
        confirmVariant={confirmOutcome === "SUCCESS" ? "success" : "danger"}
        loading={simulateMutation.isPending}
        onConfirm={handleConfirmSimulation}
        onCancel={() => setConfirmOutcome(null)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: space.huge,
  },
  contentWrap: {
    paddingHorizontal: space.gutter,
    paddingTop: space.md,
    gap: space.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: border.card,
    borderColor: colors.border,
    padding: space.cardPadding,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroTxId: {
    color: colors.inkMuted,
    flex: 1,
    marginRight: space.sm,
  },
  heroDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: space.md,
  },
  heroAmountWrap: {
    alignItems: "center",
    marginVertical: space.sm,
  },
  heroDescription: {
    color: colors.ink,
    textAlign: "center",
    marginBottom: space.md,
    lineHeight: 22,
  },
  cardTitle: {
    color: colors.ink,
    marginBottom: space.xs,
  },
  simTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: space.xs,
  },
  simTitle: {
    color: colors.ink,
    marginLeft: space.xs,
  },
  simSubtitle: {
    color: colors.inkSoft,
    marginBottom: space.lg,
    lineHeight: 20,
  },
  simButtonsRow: {
    gap: space.sm,
  },
});
