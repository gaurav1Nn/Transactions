import { describe, it, expect, beforeEach } from "vitest";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import {
  apiClient,
  BASE_URL,
  setAccessTokenProvider,
  setUnauthorizedHandler,
  authRequestInterceptor,
} from "../src/api/client.js";
import {
  getApiErrorMessage,
  getApiErrorCode,
  isApiErrorResponse,
} from "../src/utils/api-error.js";

describe("API Client & Error Utilities", () => {
  beforeEach(() => {
    setAccessTokenProvider(null);
    setUnauthorizedHandler(null);
  });

  it("configures base URL correctly", () => {
    expect(BASE_URL).toBeDefined();
    expect(apiClient.defaults.baseURL).toBe(BASE_URL);
    expect(apiClient.defaults.timeout).toBe(15000);
  });

  it("adds Bearer token via interceptor when present", async () => {
    const dummyToken = "jwt-test-token-12345";
    setAccessTokenProvider(() => dummyToken);

    const initialConfig = {
      headers: {},
    } as unknown as InternalAxiosRequestConfig;
    const config = await authRequestInterceptor(initialConfig);

    expect(config.headers.Authorization).toBe(`Bearer ${dummyToken}`);
  });

  it("omits authorization header when token provider returns null", async () => {
    setAccessTokenProvider(() => null);

    const initialConfig = {
      headers: {},
    } as unknown as InternalAxiosRequestConfig;
    const config = await authRequestInterceptor(initialConfig);

    expect(config.headers.Authorization).toBeUndefined();
  });

  it("translates structured API error response to user message", () => {
    const mockAxiosError = {
      isAxiosError: true,
      name: "AxiosError",
      message: "Request failed with status code 409",
      response: {
        status: 409,
        data: {
          error: {
            code: "EMAIL_EXISTS",
            message: "A user with this email address already exists",
            requestId: "test-req-123",
          },
        },
      },
    } as unknown as AxiosError;

    expect(isApiErrorResponse(mockAxiosError.response?.data)).toBe(true);
    expect(getApiErrorCode(mockAxiosError)).toBe("EMAIL_EXISTS");
    expect(getApiErrorMessage(mockAxiosError)).toBe(
      "A user with this email address already exists"
    );
  });

  it("translates timeout and network errors safely", () => {
    const timeoutError = {
      isAxiosError: true,
      code: "ECONNABORTED",
      message: "timeout of 15000ms exceeded",
    } as unknown as AxiosError;

    expect(getApiErrorMessage(timeoutError)).toContain("timed out");

    const networkError = {
      isAxiosError: true,
      message: "Network Error",
    } as unknown as AxiosError;

    expect(getApiErrorMessage(networkError)).toContain("Network error");
  });
});
