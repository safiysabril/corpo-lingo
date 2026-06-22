import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe, logout as logoutApi } from "@/api/authApi";

export const AUTH_QUERY_KEY = ["auth", "me"] as const;

/**
 * Auth state derived from the backend cookie session (`GET /api/v1/auth/me`).
 * `getMe()` returns null on 401, so "signed out" is a normal value, not an error.
 */
export function useAuth() {
  const { data, isLoading } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: getMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return { user: data ?? null, loading: isLoading };
}

export function useLogout() {
  const queryClient = useQueryClient();
  return async () => {
    await logoutApi();
    queryClient.setQueryData(AUTH_QUERY_KEY, null);
    queryClient.removeQueries({ queryKey: ["history"] });
  };
}
