import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/client.js';
import { useAuthContext } from '../context/AuthContext.jsx';

export function useStorageStatus() {
  const { token } = useAuthContext();

  return useQuery({
    queryKey: ['storage', 'status'],
    queryFn: () => apiFetch('/api/storage/status', { token }),
    enabled: Boolean(token),
    retry: false,
    refetchInterval: 60000,
    staleTime: 60000
  });
}
