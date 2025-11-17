import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface SyncJob {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  syncedContacts: number;
  failedContacts: number;
  totalContacts: number;
  tokenExpired: boolean;
  startedAt: string | null;
  completedAt: string | null;
}

interface SyncStatusResponse {
  status: SyncJob['status'];
  syncedContacts: number;
  failedContacts: number;
  totalContacts: number;
  tokenExpired: boolean;
}

/**
 * Hook for managing sync jobs with automatic polling
 */
export function useSyncJobs(pageIds: string[]) {
  const queryClient = useQueryClient();
  const [isPageVisible, setIsPageVisible] = useState(true);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check for active sync jobs
  const activeJobsQuery = useQuery<Record<string, SyncJob>>({
    queryKey: ['activeSyncJobs', pageIds],
    queryFn: async () => {
      const jobs: Record<string, SyncJob> = {};
      
      await Promise.all(
        pageIds.map(async (pageId) => {
          try {
            const response = await fetch(`/api/facebook/pages/${pageId}/latest-sync`);
            if (response.ok) {
              const data = await response.json();
              if (data.job && (data.job.status === 'PENDING' || data.job.status === 'IN_PROGRESS')) {
                jobs[pageId] = data.job;
              }
            }
          } catch (error) {
            console.error(`Error checking sync job for page ${pageId}:`, error);
          }
        })
      );

      return jobs;
    },
    enabled: pageIds.length > 0,
    refetchInterval: (query) => {
      const activeJobs = query.state.data;
      const hasActiveJobs = activeJobs && Object.keys(activeJobs).length > 0;
      // Only poll if there are active jobs and page is visible
      return hasActiveJobs && isPageVisible ? 2000 : false;
    },
    refetchOnWindowFocus: false,
  });

  // Poll individual sync job status
  const pollSyncJob = useCallback(async (pageId: string, jobId: string) => {
    try {
      const response = await fetch(`/api/facebook/sync-status/${jobId}`);
      if (!response.ok) return null;

      const data: SyncStatusResponse = await response.json();
      
      if (data.status === 'COMPLETED' || data.status === 'FAILED') {
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['connectedPages'] });
        queryClient.invalidateQueries({ queryKey: ['contactCounts', pageId] });
        queryClient.invalidateQueries({ queryKey: ['activeSyncJobs'] });

        return data;
      }

      return data;
    } catch (error) {
      console.error(`Error polling sync job ${jobId}:`, error);
      return null;
    }
  }, [queryClient]);

  // Start sync mutation
  const startSyncMutation = useMutation({
    mutationFn: async (pageId: string) => {
      const response = await fetch('/api/facebook/sync-background', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          facebookPageId: pageId,
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start sync');
      }

      return response.json();
    },
    onSuccess: (data, pageId) => {
      queryClient.invalidateQueries({ queryKey: ['activeSyncJobs'] });
      toast.info('Started syncing contacts', {
        description: 'Sync will continue in the background',
        duration: 3000,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start sync');
    },
  });

  // Cancel sync mutation
  const cancelSyncMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const response = await fetch('/api/facebook/sync-cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel sync');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeSyncJobs'] });
      queryClient.invalidateQueries({ queryKey: ['connectedPages'] });
      toast.success('Sync cancelled');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel sync');
    },
  });

  // Page Visibility API - pause/resume polling when tab is inactive/active
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    activeJobs: activeJobsQuery.data || {},
    isLoading: activeJobsQuery.isLoading,
    startSync: startSyncMutation.mutate,
    cancelSync: cancelSyncMutation.mutate,
    isStartingSync: startSyncMutation.isPending,
    isCancellingSync: cancelSyncMutation.isPending,
    pollSyncJob,
  };
}

