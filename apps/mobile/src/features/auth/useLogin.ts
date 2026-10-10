import { useState, useCallback } from "react";
import axios from "axios";
import { useRouter } from "expo-router";
import { loginApi, LoginParams } from "../../api/auth.api.js";
import { useAuth } from "../../providers/AuthProvider.js";
import { isApiErrorResponse } from "../../utils/api-error.js";

export function getLoginErrorMessage(err: unknown): {
  message: string;
  requestId?: string;
} {
  if (axios.isAxiosError(err)) {
    if (err.response?.status === 401) {
      return { message: "Email or password is incorrect." };
    }
    if (err.response?.status === 429) {
      return {
        message: "Too many attempts. Please wait a few minutes and try again.",
      };
    }
    if (err.code === "ECONNABORTED" || !err.response) {
      return {
        message: "Can't reach the server. Check your connection and try again.",
      };
    }
    if (isApiErrorResponse(err.response?.data)) {
      const { message, requestId } = err.response.data.error;
      return { message, requestId };
    }
  }

  return { message: "Something went wrong on our side. Please try again." };
}

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ message: string; requestId?: string } | null>(null);

  const { signIn } = useAuth();
  const router = useRouter();

  const clearError = useCallback(() => setError(null), []);

  const login = useCallback(
    async (params: LoginParams): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await loginApi(params);
        await signIn(data.accessToken, data.user);
        router.replace("/(app)");
        return true;
      } catch (err) {
        setError(getLoginErrorMessage(err));
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [signIn, router]
  );

  return {
    login,
    isLoading,
    error,
    clearError,
  };
}
