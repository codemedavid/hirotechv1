import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

interface ContactCountResponse {
  count: number;
}

/**
 * Hook for fetching contact counts for Facebook pages
 */
export function useContactCounts(pageIds: string[]) {
  const queryClient = useQueryClient();

  // Fetch all contact counts in parallel using useQueries
  const queries = useQueries({
    queries: pageIds.map((pageId) => ({
      queryKey: ['contactCounts', pageId],
      queryFn: async (): Promise<ContactCountResponse> => {
        const response = await fetch(`/api/facebook/pages/${pageId}/contacts-count`);
        if (!response.ok) {
          throw new Error('Failed to fetch contact count');
        }
        return response.json();
      },
      enabled: pageIds.length > 0,
      staleTime: 60 * 1000, // 1 minute
    })),
  });

  // Combine results into a map
  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    queries.forEach((query, index) => {
      if (query.data) {
        result[pageIds[index]] = query.data.count;
      }
    });
    return result;
  }, [queries, pageIds]);

  const isLoading = queries.some((query) => query.isLoading);

  return {
    counts,
    isLoading,
    refetchAll: () => {
      pageIds.forEach((pageId) => {
        queryClient.invalidateQueries({ queryKey: ['contactCounts', pageId] });
      });
    },
  };
}

