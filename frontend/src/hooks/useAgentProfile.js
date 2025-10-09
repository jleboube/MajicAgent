import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/client.js';
import { useAuthContext } from '../context/AuthContext.jsx';

export function useAgentProfile() {
  const { token } = useAuthContext();

  return useQuery({
    queryKey: ['agent'],
    queryFn: () => apiFetch('/api/agents/me', { token }),
    enabled: Boolean(token)
  });
}
