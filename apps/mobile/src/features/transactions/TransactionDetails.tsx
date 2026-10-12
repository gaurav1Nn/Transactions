import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Share,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import * as Clipboard from "expo-clipboard";
import { haptics } from "../../utils/haptics";
import {
  useTransaction,
  useSimulateTransaction,
} from "./transaction-hooks";
import { ScreenContainer } from "../../components/layout/ScreenContainer";
import { AppHeader } from "../../components/layout/AppHeader";
import { MoneyText } from "../../components/transactions/MoneyText";
import { StatusBadge } from "../../components/transactions/StatusBadge";
import { StatusStepper } from "../../components/transactions/StatusStepper";
import { DetailRow } from "../../components/transactions/DetailRow";
import { AppButton } from "../../components/forms/AppButton";
import { ConfirmDialog } from "../../components/transactions/ConfirmDialog";
import { InlineNotice } from "../../components/feedback/InlineNotice";
import { Skeleton } from "../../components/feedback/Skeleton";
import { EmptyState, ErrorState } from "../../components/feedback/RemoteStates";
import { AppIcon } from "../../components/layout/AppIcon";
import { useToast } from "../../components/feedback/Toast";
import { getTransactionDetailsState } from "./transaction-details-state";
import {
  formatFullDateTime,
  formatUtcDateTime,
} from "../../utils/format-date";
import { colors } from "../../theme/colors";
import { space, radius, border, hit } from "../../theme/spacing";
import { typography } from "../../theme/typography";

const AUTO_RETURN_SECONDS = 5;

export interface TransactionDetailsProps {
  id: string;
}

export function TransactionDetails({ id }: TransactionDetailsProps): React.JSX.Element {
  const router = useRouter();
  const { autoReturnHome } = useLocalSearchParams<{
    autoReturnHome?: string;
  }>();
  const { showToast } = useToast();

  const {
    transaction: tx,
    isLoading,
    isError,
    error,
    refetch,
  } = useTransaction(id);

  const simulateMutation = useSimulateTransaction();

  const shouldAutoReturn =
    autoReturnHome === "true" &&
    (tx?.status === "SUCCESS" || tx?.status === "FAILED");
  const [redirectSeconds, setRedirectSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!shouldAutoReturn) {
      setRedirectSeconds(null);
      return;
    }

    setRedirectSeconds(AUTO_RETURN_SECONDS);
    const interval = setInterval(() => {
      setRedirectSeconds((s) => (s === null ? null : Math.max(s - 1, 0)));
    }, 1000);

    return () => clearInterval(interval);
  }, [shouldAutoReturn]);

  useEffect(() => {
    if (redirectSeconds === 0) router.replace("/(app)");
  }, [redirectSeconds, router]);

  const [confirmOutcome, setConfirmOutcome] = useState<"SUCCESS" | "FAILED" | null>(
    null
  );

  const handleCopyId = async () => {
    if (!tx?.transactionId) return;
    try {
      await Clipboard.setStringAsync(tx.transactionId);
      haptics.success();
      showToast("Transaction ID copied", "success");
    } catch {
      showToast("Couldn't copy the transaction ID.", "error");
    }
  };

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
      if (outcome === "SUCCESS") {
        haptics.success();
      } else {
        haptics.error();
      }
      showToast(
        outcome === "SUCCESS" ? "Marked as Success" : "Marked as Failed",
        outcome === "SUCCESS" ? "success" : "error"
      );
    } catch (err) {
      setConfirmOutcome(null);
      haptics.error();
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
  const detailsState = getTransactionDetailsState({
    isLoading,
    isError,
    isNotFound: is404,
    hasTransaction: Boolean(tx),
  });

  if (detailsState === "loading") {
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

  if (detailsState === "not-found") {
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

  if (detailsState === "error") {
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

  if (!tx) {
    return <></>;
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
                <View style={styles.idActions}>
                  <TouchableOpacity
                    onPress={handleCopyId}
                    hitSlop={hit.slop}
                    accessibilityRole="button"
                    accessibilityLabel="Copy transaction ID"
                  >
                    <AppIcon name="copy" size={18} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleShareId}
                    hitSlop={hit.slop}
                    accessibilityRole="button"
                    accessibilityLabel="Share transaction ID"
                  >
                    <AppIcon name="share" size={18} color={colors.primary} />
                  </TouchableOpacity>
                </View>
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

          {redirectSeconds !== null && redirectSeconds > 0 && (
            <Text
              style={[styles.redirectText, typography.bodySm]}
              accessibilityLiveRegion="polite"
            >
              Redirecting to home in {redirectSeconds}{" "}
              {redirectSeconds === 1 ? "second" : "seconds"}…
            </Text>
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
  idActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
  simButtonsRow: {
    gap: space.sm,
  },
  redirectText: {
    color: colors.inkSoft,
    textAlign: "center",
  },
});
