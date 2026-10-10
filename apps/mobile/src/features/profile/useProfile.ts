import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getCurrentUser } from "../../api/users.api.js";
import { useAuth } from "../../providers/AuthProvider.js";
import { getApiErrorMessage } from "../../utils/api-error.js";

export function useProfile() {
  const { user: authUser, setUser } = useAuth();

  const query = useQuery({
    queryKey: ["user", "me"],
    queryFn: getCurrentUser,
    initialData: authUser || undefined,
  });

  useEffect(() => {
    if (query.data) {
      setUser(query.data);
    }
  }, [query.data, setUser]);

  const errorMessage = query.error ? getApiErrorMessage(query.error) : null;

  return {
    ...query,
    user: query.data || authUser,
    errorMessage,
  };
}
