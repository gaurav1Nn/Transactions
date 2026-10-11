import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { UserDto } from "../types/api";
import { tokenStorage } from "../storage/token-storage";
import { setAccessTokenProvider, setUnauthorizedHandler } from "../api/client";
import { logoutApi } from "../api/auth.api";
import axios from "axios";

export type AuthStatus = "restoring" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  status: AuthStatus;
  user: UserDto | null;
  token: string | null;
  signIn: (token: string, user: UserDto) => Promise<void>;
  signOut: () => Promise<void>;
  restoreSession: () => Promise<void>;
  setUser: (user: UserDto) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [status, setStatus] = useState<AuthStatus>("restoring");
  const [user, setUserState] = useState<UserDto | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const tokenRef = useRef<string | null>(null);

  // Keep tokenRef in sync with state
  tokenRef.current = token;

  const clearLocalSession = useCallback(async () => {
    await tokenStorage.clearSession();
    tokenRef.current = null;
    setToken(null);
    setUserState(null);
    setStatus("unauthenticated");
    queryClient.clear();
  }, [queryClient]);

  const signOut = useCallback(async () => {
    if (tokenRef.current) {
      try {
        await logoutApi();
      } catch (error) {
        if (!axios.isAxiosError(error) || error.response?.status !== 401) {
          throw error;
        }
      }
    }
    await clearLocalSession();
  }, [clearLocalSession]);

  const signIn = useCallback(
    async (newToken: string, newUser: UserDto) => {
      await tokenStorage.saveToken(newToken);
      await tokenStorage.saveUser(newUser);
      tokenRef.current = newToken;
      setToken(newToken);
      setUserState(newUser);
      setStatus("authenticated");
    },
    []
  );

  const setUser = useCallback((updatedUser: UserDto) => {
    setUserState(updatedUser);
    void tokenStorage.saveUser(updatedUser);
  }, []);

  const restoreSession = useCallback(async () => {
    setStatus("restoring");
    try {
      const storedToken = await tokenStorage.getToken();
      const storedUser = await tokenStorage.getUser();

      if (storedToken && storedUser) {
        tokenRef.current = storedToken;
        setToken(storedToken);
        setUserState(storedUser);
        setStatus("authenticated");
      } else {
        tokenRef.current = null;
        setToken(null);
        setUserState(null);
        setStatus("unauthenticated");
      }
    } catch {
      tokenRef.current = null;
      setToken(null);
      setUserState(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    // Configure API client to fetch the latest token from ref
    setAccessTokenProvider(() => tokenRef.current);
    setUnauthorizedHandler(() => {
      void clearLocalSession();
    });

    // Run initial session restoration
    void restoreSession();

    return () => {
      setAccessTokenProvider(null);
      setUnauthorizedHandler(null);
    };
  }, [restoreSession, clearLocalSession]);

  const value: AuthContextValue = {
    status,
    user,
    token,
    signIn,
    signOut,
    restoreSession,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
