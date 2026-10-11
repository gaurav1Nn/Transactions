import { ListTransactionsParams } from "../../api/transactions.api";
import { TransactionStatus } from "../../types/api";

export const transactionsQueryKeys = {
  all: ["transactions"] as const,
  lists: () => [...transactionsQueryKeys.all, "list"] as const,
  list: (params?: ListTransactionsParams) =>
    [...transactionsQueryKeys.lists(), params ?? {}] as const,
  details: () => [...transactionsQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...transactionsQueryKeys.details(), id] as const,
  statusCount: (status: TransactionStatus) =>
    [...transactionsQueryKeys.all, "count", status] as const,
};
