import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 30, // 30 seconds
        gcTime: 1000 * 60 * 5, // 5 minutes
        retry: (failureCount, error) => {
          if (axios.isAxiosError(error) && error.response?.status) {
            const status = error.response.status;
            // Never retry validation, authentication, or conflict errors
            if ([400, 401, 403, 404, 409, 422].includes(status)) {
              return false;
            }
          }
          return failureCount < 2;
        },
      },
    },
  });
}

export function QueryProvider({
  children,
  client,
}: {
  children: React.ReactNode;
  client?: QueryClient;
}): React.JSX.Element {
  const [queryClient] = useState(() => client ?? createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
