'use client';

import { memo } from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2 } from 'lucide-react';
import type { SyncJob } from '@/hooks/use-sync-jobs';

interface SyncStatusIndicatorProps {
  syncJob: SyncJob;
  isPageVisible?: boolean;
}

export const SyncStatusIndicator = memo(function SyncStatusIndicator({
  syncJob,
  isPageVisible = true,
}: SyncStatusIndicatorProps) {
  const syncProgress =
    syncJob.totalContacts > 0
      ? (syncJob.syncedContacts / syncJob.totalContacts) * 100
      : 0;

  return (
    <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-center justify-between text-sm">
        <span className="text-blue-700 dark:text-blue-300 font-medium flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          {syncJob.status === 'PENDING' ? 'Starting sync...' : 'Syncing contacts...'}
        </span>
        {syncJob.totalContacts > 0 && (
          <span className="font-medium text-blue-700 dark:text-blue-300">
            {syncJob.syncedContacts} / {syncJob.totalContacts}
          </span>
        )}
      </div>
      {syncJob.totalContacts > 0 && (
        <Progress value={syncProgress} className="h-2 bg-blue-100 dark:bg-blue-900" />
      )}
      <div className="flex items-start gap-2 text-xs text-blue-600 dark:text-blue-400">
        <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0" />
        <p>
          Syncing in background - safe to navigate away, refresh, or close this page.
          Progress will be saved automatically.
        </p>
      </div>
      {!isPageVisible && (
        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500"></span>
          Tab inactive - polling paused (sync continues on server)
        </p>
      )}
    </div>
  );
});

