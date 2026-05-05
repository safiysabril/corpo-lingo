import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe, logout as logoutApi } from '@/api/authApi';

export const AUTH_QUERY_KEY = ['auth', 'me'] as const;

export function useAuth() {
  return useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: getMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return async () => {
    await logoutApi();
    queryClient.setQueryData(AUTH_QUERY_KEY, null);
    queryClient.removeQueries({ queryKey: ['history'] });
  };
}
