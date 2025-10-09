import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/client.js';
import { useAuthContext } from '../context/AuthContext.jsx';

export function useAiStatus() {
  const { token } = useAuthContext();

  return useQuery({
    queryKey: ['ai', 'status'],
    queryFn: () => apiFetch('/api/ai/status', { token }),
    enabled: Boolean(token),
    retry: false,
    staleTime: 60000,
    refetchInterval: 60000
  });
}
