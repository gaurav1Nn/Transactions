export type TransactionDetailsState =
  | "loading"
  | "not-found"
  | "error"
  | "content";

export function getTransactionDetailsState({
  isLoading,
  isError,
  isNotFound,
  hasTransaction,
}: {
  isLoading: boolean;
  isError: boolean;
  isNotFound: boolean;
  hasTransaction: boolean;
}): TransactionDetailsState {
  if (isLoading && !hasTransaction) {
    return "loading";
  }

  if (isNotFound && !hasTransaction) {
    return "not-found";
  }

  if (isError && !hasTransaction) {
    return "error";
  }

  return hasTransaction ? "content" : "not-found";
}
