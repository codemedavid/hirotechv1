'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { RefreshCw, Unplug } from 'lucide-react';

interface BulkActionsBarProps {
  totalPages: number;
  selectedCount: number;
  isAllSelected: boolean;
  isBulkSyncing: boolean;
  isBulkDisconnecting: boolean;
  onToggleSelectAll: () => void;
  onBulkSync: () => void;
  onBulkDisconnect: () => void;
}

export const BulkActionsBar = memo(function BulkActionsBar({
  totalPages,
  selectedCount,
  isAllSelected,
  isBulkSyncing,
  isBulkDisconnecting,
  onToggleSelectAll,
  onBulkSync,
  onBulkDisconnect,
}: BulkActionsBarProps) {
  if (totalPages === 0) return null;

  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <Checkbox
          id="select-all"
          checked={isAllSelected}
          onCheckedChange={onToggleSelectAll}
        />
        <label
          htmlFor="select-all"
          className="text-sm font-medium cursor-pointer"
        >
          Select All ({selectedCount} selected)
        </label>
      </div>

      {selectedCount > 0 && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkSync}
            disabled={isBulkSyncing || isBulkDisconnecting}
          >
            {isBulkSyncing ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Selected ({selectedCount})
              </>
            )}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onBulkDisconnect}
            disabled={isBulkSyncing || isBulkDisconnecting}
          >
            {isBulkDisconnecting ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Disconnecting...
              </>
            ) : (
              <>
                <Unplug className="mr-2 h-4 w-4" />
                Disconnect Selected ({selectedCount})
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
});

