export interface UserDto {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export type TransactionStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface TransactionDto {
  id: string;
  transactionId: string;
  amount: string;
  currency: string;
  description: string;
  status: TransactionStatus;
  failureReason: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedTransactions {
  items: TransactionDto[];
  pagination: PaginationMeta;
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
    requestId: string;
  };
}

export interface ApiResponse<T> {
  data: T;
}

export interface AuthResponseData {
  user: UserDto;
  accessToken: string;
}

export interface CreateTransactionRequest {
  amount: string;
  currency: string;
  description: string;
}

export interface SimulateTransactionRequest {
  outcome: "SUCCESS" | "FAILED";
}
