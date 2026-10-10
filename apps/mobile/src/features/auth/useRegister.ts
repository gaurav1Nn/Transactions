import { useState, useCallback } from "react";
import axios from "axios";
import { useRouter } from "expo-router";
import { registerApi, RegisterParams } from "../../api/auth.api.js";
import { useAuth } from "../../providers/AuthProvider.js";
import { isApiErrorResponse } from "../../utils/api-error.js";

export function useRegister() {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<{ message: string; requestId?: string } | null>(null);
  const [serverFieldErrors, setServerFieldErrors] = useState<{ email?: string }>({});

  const { signIn } = useAuth();
  const router = useRouter();

  const clearErrors = useCallback(() => {
    setServerError(null);
    setServerFieldErrors({});
  }, []);

  const register = useCallback(
    async (params: RegisterParams): Promise<boolean> => {
      setIsLoading(true);
      setServerError(null);
      setServerFieldErrors({});

      try {
        const data = await registerApi({
          name: params.name.trim(),
          email: params.email.trim().toLowerCase(),
          password: params.password,
        });

        await signIn(data.accessToken, data.user);
        router.replace("/(app)");
        return true;
      } catch (err) {
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 409) {
            setServerFieldErrors({
              email: "A user with this email address already exists",
            });
            return false;
          }

          if (err.code === "ECONNABORTED" || !err.response) {
            setServerError({
              message: "Can't reach the server. Check your connection and try again.",
            });
            return false;
          }

          if (isApiErrorResponse(err.response?.data)) {
            const { message, requestId } = err.response.data.error;
            setServerError({ message, requestId });
            return false;
          }
        }

        setServerError({
          message: "Something went wrong on our side. Please try again.",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [signIn, router]
  );

  return {
    register,
    isLoading,
    serverError,
    serverFieldErrors,
    clearErrors,
  };
}
