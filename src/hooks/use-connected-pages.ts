import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface ConnectedPage {
  id: string;
  pageId: string;
  pageName: string;
  instagramAccountId: string | null;
  instagramUsername: string | null;
  isActive: boolean;
  lastSyncedAt: string | null;
  autoSync: boolean;
}

interface ConnectedPagesResponse {
  pages: ConnectedPage[];
}

/**
 * Hook for fetching and managing connected Facebook pages
 */
export function useConnectedPages(initialData?: ConnectedPage[]) {
  const queryClient = useQueryClient();

  const query = useQuery<ConnectedPagesResponse>({
    queryKey: ['connectedPages'],
    queryFn: async () => {
      const response = await fetch('/api/facebook/pages/connected');
      
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch connected pages');
      }

      return response.json();
    },
    initialData: initialData ? { pages: initialData } : undefined,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  const disconnectMutation = useMutation({
    mutationFn: async (pageId: string) => {
      const response = await fetch(`/api/facebook/pages?pageId=${pageId}`, {
        method: 'DELETE',
      });

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to disconnect page');
      }

      return response.json();
    },
    onSuccess: (_, pageId) => {
      queryClient.invalidateQueries({ queryKey: ['connectedPages'] });
      queryClient.invalidateQueries({ queryKey: ['contactCounts'] });
      toast.success('Page disconnected successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to disconnect page');
    },
  });

  return {
    pages: query.data?.pages || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    disconnectPage: disconnectMutation.mutate,
    isDisconnecting: disconnectMutation.isPending,
  };
}

