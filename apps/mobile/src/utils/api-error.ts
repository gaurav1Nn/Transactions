import axios, { AxiosError } from "axios";
import { ApiErrorResponse } from "../types/api.js";

export function isApiErrorResponse(data: unknown): data is ApiErrorResponse {
  if (!data || typeof data !== "object" || !("error" in data)) {
    return false;
  }
  const errorObj = data.error;
  if (!errorObj || typeof errorObj !== "object") {
    return false;
  }
  return (
    "code" in errorObj &&
    typeof errorObj.code === "string" &&
    "message" in errorObj &&
    typeof errorObj.message === "string"
  );
}
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;

    // Timeout or abort
    if (axiosError.code === "ECONNABORTED" || axiosError.message.includes("timeout")) {
      return "Request timed out. Please check your connection and try again.";
    }

    // Network connectivity failure (no response received)
    if (!axiosError.response) {
      return "Network error. Please check your connection and try again.";
    }

    // Backend returned structured error response
    if (isApiErrorResponse(axiosError.response.data)) {
      const { message, details } = axiosError.response.data.error;
      if (details && details.length > 0) {
        return `${message}: ${details[0].message}`;
      }
      return message;
    }

    // HTTP status specific messages
    if (axiosError.response.status === 401) {
      return "Session expired or invalid credentials.";
    }
    if (axiosError.response.status === 404) {
      return "Requested resource was not found.";
    }
    if (axiosError.response.status === 429) {
      return "Too many requests. Please wait a moment and try again.";
    }
    if (axiosError.response.status >= 500) {
      return "Server error. Our engineers have been notified.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}

export function getApiErrorCode(error: unknown): string | null {
  if (axios.isAxiosError(error) && isApiErrorResponse(error.response?.data)) {
    return error.response.data.error.code;
  }
  return null;
}
