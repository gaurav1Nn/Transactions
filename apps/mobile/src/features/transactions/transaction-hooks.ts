import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  listTransactionsApi,
  getTransactionApi,
  ListTransactionsParams,
} from "../../api/transactions.api.js";
import { transactionsQueryKeys } from "./query-keys.js";
import { TransactionDto } from "../../types/api.js";
import { getApiErrorMessage } from "../../utils/api-error.js";

export function useTransactions(params?: ListTransactionsParams) {
  const query = useQuery({
    queryKey: transactionsQueryKeys.list(params),
    queryFn: () => listTransactionsApi(params),
  });

  return {
    ...query,
    transactions: query.data?.items ?? [],
    pagination: query.data?.pagination,
    errorMessage: query.error ? getApiErrorMessage(query.error) : null,
  };
}

export function useInfiniteTransactions(
  params?: Omit<ListTransactionsParams, "page">
) {
  const query = useInfiniteQuery({
    queryKey: transactionsQueryKeys.list(params),
    queryFn: ({ pageParam = 1 }) =>
      listTransactionsApi({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
  });

  const allItems: TransactionDto[] =
    query.data?.pages.flatMap((page) => page.items) ?? [];
  const totalCount = query.data?.pages[0]?.pagination.total ?? 0;

  return {
    ...query,
    items: allItems,
    totalCount,
    errorMessage: query.error ? getApiErrorMessage(query.error) : null,
  };
}

export function useTransaction(id: string) {
  const query = useQuery({
    queryKey: transactionsQueryKeys.detail(id),
    queryFn: () => getTransactionApi(id),
    enabled: Boolean(id),
  });

  return {
    ...query,
    transaction: query.data,
    errorMessage: query.error ? getApiErrorMessage(query.error) : null,
  };
}

export function useStatusCounts() {
  const pendingQuery = useQuery({
    queryKey: transactionsQueryKeys.statusCount("PENDING"),
    queryFn: () => listTransactionsApi({ limit: 1, status: "PENDING" }),
    staleTime: 30000,
  });

  const successQuery = useQuery({
    queryKey: transactionsQueryKeys.statusCount("SUCCESS"),
    queryFn: () => listTransactionsApi({ limit: 1, status: "SUCCESS" }),
    staleTime: 30000,
  });

  const failedQuery = useQuery({
    queryKey: transactionsQueryKeys.statusCount("FAILED"),
    queryFn: () => listTransactionsApi({ limit: 1, status: "FAILED" }),
    staleTime: 30000,
  });

  const pending = pendingQuery.data?.pagination.total ?? 0;
  const success = successQuery.data?.pagination.total ?? 0;
  const failed = failedQuery.data?.pagination.total ?? 0;
  const total = pending + success + failed;

  const isLoading =
    pendingQuery.isLoading || successQuery.isLoading || failedQuery.isLoading;
  const isError =
    pendingQuery.isError || successQuery.isError || failedQuery.isError;
  const isRefetching =
    pendingQuery.isRefetching ||
    successQuery.isRefetching ||
    failedQuery.isRefetching;

  const refetch = async () => {
    await Promise.all([
      pendingQuery.refetch(),
      successQuery.refetch(),
      failedQuery.refetch(),
    ]);
  };

  return {
    pending,
    success,
    failed,
    total,
    isLoading,
    isError,
    isRefetching,
    refetch,
  };
}

export function useInvalidateTransactions() {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({
      queryKey: transactionsQueryKeys.all,
    });
  };
}
