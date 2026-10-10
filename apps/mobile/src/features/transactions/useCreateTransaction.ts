import { useState, useCallback, useRef } from "react";
import axios from "axios";
import { useRouter } from "expo-router";
import { createTransactionApi } from "../../api/transactions.api.js";
import { CreateTransactionRequest, TransactionDto } from "../../types/api.js";
import { generateIdempotencyKey } from "../../utils/idempotency-key.js";
import { useInvalidateTransactions } from "./transaction-hooks.js";
import { useToast } from "../../components/feedback/Toast.js";
import { isApiErrorResponse } from "../../utils/api-error.js";

export function useCreateTransaction() {
  const [idempotencyKey, setIdempotencyKey] = useState<string>(
    generateIdempotencyKey
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{
    message: string;
    code?: string;
    requestId?: string;
  } | null>(null);

  const isSubmittingRef = useRef(false);
  const router = useRouter();
  const invalidateTransactions = useInvalidateTransactions();
  const { showToast } = useToast();

  const resetIdempotencyKey = useCallback(() => {
    setIdempotencyKey(generateIdempotencyKey());
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const createTransaction = useCallback(
    async (
      payload: CreateTransactionRequest
    ): Promise<TransactionDto | null> => {
      // Guard against double tap in the same tick
      if (isSubmittingRef.current || isLoading) {
        return null;
      }

      isSubmittingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        const result = await createTransactionApi(payload, idempotencyKey);

        await invalidateTransactions();
        showToast("Transaction created successfully", "success");

        // Fresh key for subsequent submissions
        resetIdempotencyKey();

        // Navigate to details screen
        router.replace(`/(app)/transactions/${result.transactionId}`);
        return result;
      } catch (err) {
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 409) {
            setError({
              code: "CONFLICT",
              message:
                "An idempotency conflict occurred. Please start over.",
            });
            return null;
          }

          if (err.code === "ECONNABORTED" || !err.response) {
            setError({
              code: "NETWORK_ERROR",
              message:
                "Can't reach the server. Safe to retry with the same key.",
            });
            // Keep the same idempotency key for safe network retry!
            return null;
          }

          if (isApiErrorResponse(err.response?.data)) {
            const { code, message, requestId } = err.response.data.error;
            setError({ code, message, requestId });
            return null;
          }
        }

        setError({
          message: "Unable to create transaction. Please try again.",
        });
        return null;
      } finally {
        isSubmittingRef.current = false;
        setIsLoading(false);
      }
    },
    [
      idempotencyKey,
      isLoading,
      invalidateTransactions,
      showToast,
      resetIdempotencyKey,
      router,
    ]
  );

  return {
    createTransaction,
    idempotencyKey,
    resetIdempotencyKey,
    isLoading,
    error,
    clearError,
  };
}
