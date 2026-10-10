import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import Constants from "expo-constants";

export type TokenProvider = () => Promise<string | null> | string | null;
export type UnauthorizedHandler = () => void;

function resolveBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  const extraUrl = Constants.expoConfig?.extra?.apiUrl;
  if (typeof extraUrl === "string" && extraUrl.length > 0) {
    return extraUrl;
  }
  return "http://localhost:3000";
}

export const BASE_URL = resolveBaseUrl();

let tokenProvider: TokenProvider | null = null;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setAccessTokenProvider(provider: TokenProvider | null): void {
  tokenProvider = provider;
}

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function authRequestInterceptor(
  config: InternalAxiosRequestConfig
): Promise<InternalAxiosRequestConfig> {
  if (tokenProvider) {
    try {
      const token = await tokenProvider();
      if (token && typeof token === "string" && token.trim().length > 0) {
        config.headers.Authorization = `Bearer ${token.trim()}`;
      }
    } catch {
      // Continue request without token if provider fails
    }
  }
  return config;
}

export function authResponseErrorInterceptor(error: unknown): Promise<never> {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    unauthorizedHandler?.();
  }
  return Promise.reject(error);
}

apiClient.interceptors.request.use(authRequestInterceptor, (error) =>
  Promise.reject(error)
);
apiClient.interceptors.response.use(
  (response) => response,
  authResponseErrorInterceptor
);
