import { apiClient } from "./client.js";
import {
  TransactionDto,
  PaginatedTransactions,
  ApiResponse,
  CreateTransactionRequest,
  SimulateTransactionRequest,
  TransactionStatus,
} from "../types/api.js";

export interface ListTransactionsParams {
  page?: number;
  limit?: number;
  status?: TransactionStatus;
}

export async function listTransactionsApi(
  params?: ListTransactionsParams
): Promise<PaginatedTransactions> {
  const response = await apiClient.get<ApiResponse<PaginatedTransactions>>(
    "/api/transactions",
    { params }
  );
  return response.data.data;
}

export async function getTransactionApi(id: string): Promise<TransactionDto> {
  const response = await apiClient.get<ApiResponse<TransactionDto>>(
    `/api/transactions/${id}`
  );
  return response.data.data;
}

export async function createTransactionApi(
  data: CreateTransactionRequest,
  idempotencyKey: string
): Promise<TransactionDto> {
  const response = await apiClient.post<ApiResponse<TransactionDto>>(
    "/api/transactions",
    data,
    {
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    }
  );
  return response.data.data;
}

export async function simulateTransactionApi(
  id: string,
  outcome: "SUCCESS" | "FAILED"
): Promise<TransactionDto> {
  const payload: SimulateTransactionRequest = { outcome };
  const response = await apiClient.post<ApiResponse<TransactionDto>>(
    `/api/transactions/${id}/simulate`,
    payload
  );
  return response.data.data;
}

export const transactionsApi = {
  list: listTransactionsApi,
  get: getTransactionApi,
  create: createTransactionApi,
  simulate: simulateTransactionApi,
};
