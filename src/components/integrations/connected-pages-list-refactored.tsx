'use client';

import { useMemo, useCallback, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Facebook } from 'lucide-react';
import { toast } from 'sonner';
import type { ConnectedPage } from '@/hooks/use-connected-pages';
import { useConnectedPages } from '@/hooks/use-connected-pages';
import { useContactCounts } from '@/hooks/use-contact-counts';
import { useSyncJobs } from '@/hooks/use-sync-jobs';
import { useSearch } from '@/hooks/use-search';
import { usePagination } from '@/hooks/use-pagination';
import { useBulkOperations } from '@/hooks/use-bulk-operations';
import { ConnectedPageCard } from './connected-page-card';
import { BulkActionsBar } from './bulk-actions-bar';
import { PagesPagination } from './pages-pagination';

interface ConnectedPagesListProps {
  onRefresh?: () => void;
  onSyncComplete?: () => void;
}

export function ConnectedPagesList({ onRefresh, onSyncComplete }: ConnectedPagesListProps) {
  const { pages, isLoading, refetch, disconnectPage } = useConnectedPages();
  const pageIds = useMemo(() => pages.map((p) => p.id), [pages]);
  const { counts } = useContactCounts(pageIds);
  const { activeJobs, startSync, cancelSync } = useSyncJobs(pageIds);

  // Search functionality with debouncing
  const { searchQuery, setSearchQuery, filteredItems: filteredPages } = useSearch(
    pages,
    (page, query) =>
      page.pageName.toLowerCase().includes(query) ||
      page.pageId.includes(query) ||
      (page.instagramUsername?.toLowerCase().includes(query) ?? false)
  );

  // Pagination
  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedPages,
    startIndex,
    endIndex,
    nextPage,
    previousPage,
  } = usePagination(filteredPages, 5);

  // Bulk operations
  const {
    selectedPageIds,
    selectedCount,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    isSelected,
    selectedPages,
  } = useBulkOperations(pages);

  // State for disconnect dialogs
  const [pageToDisconnect, setPageToDisconnect] = useState<ConnectedPage | null>(null);
  const [showBulkDisconnectDialog, setShowBulkDisconnectDialog] = useState(false);
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);
  const [isBulkDisconnecting, setIsBulkDisconnecting] = useState(false);
  const [disconnectingPageId, setDisconnectingPageId] = useState<string | null>(null);

  // Monitor sync completion
  useEffect(() => {
    const completedJobs = Object.values(activeJobs).filter(
      (job) => job.status === 'COMPLETED' || job.status === 'FAILED'
    );
    if (completedJobs.length > 0) {
      onSyncComplete?.();
    }
  }, [activeJobs, onSyncComplete]);

  // Handle individual sync
  const handleSync = useCallback(
    (page: ConnectedPage) => {
      startSync(page.id);
    },
    [startSync]
  );

  // Handle cancel sync
  const handleCancelSync = useCallback(
    (page: ConnectedPage) => {
      const syncJob = activeJobs[page.id];
      if (syncJob) {
        cancelSync(syncJob.id);
      }
    },
    [activeJobs, cancelSync]
  );

  // Handle disconnect
  const handleDisconnect = useCallback(
    async (page: ConnectedPage) => {
      setDisconnectingPageId(page.id);
      try {
        disconnectPage(page.id);
        await refetch();
        onRefresh?.();
        setPageToDisconnect(null);
      } catch (error) {
        console.error('Error disconnecting page:', error);
      } finally {
        setDisconnectingPageId(null);
      }
    },
    [disconnectPage, refetch, onRefresh]
  );

  // Bulk sync
  const handleBulkSync = useCallback(async () => {
    if (selectedPageIds.size === 0) return;

    setIsBulkSyncing(true);
    const selected = selectedPages();
    let successCount = 0;
    let failCount = 0;

    for (const page of selected) {
      try {
        startSync(page.id);
        successCount++;
      } catch {
        failCount++;
      }
    }

    setIsBulkSyncing(false);
    clearSelection();

    if (successCount > 0) {
      toast.success(`Started syncing ${successCount} page${successCount !== 1 ? 's' : ''}`);
    }
    if (failCount > 0) {
      toast.error(`Failed to sync ${failCount} page${failCount !== 1 ? 's' : ''}`);
    }
  }, [selectedPageIds.size, selectedPages, startSync, clearSelection]);

  // Bulk disconnect
  const handleBulkDisconnect = useCallback(async () => {
    if (selectedPageIds.size === 0) return;

    setIsBulkDisconnecting(true);
    const selected = selectedPages();
    let successCount = 0;
    let failCount = 0;

    for (const page of selected) {
      try {
        disconnectPage(page.id);
        successCount++;
      } catch {
        failCount++;
      }
    }

    setIsBulkDisconnecting(false);
    clearSelection();
    setShowBulkDisconnectDialog(false);

    await refetch();
    onRefresh?.();

    if (successCount > 0) {
      toast.success(`Disconnected ${successCount} page${successCount !== 1 ? 's' : ''}`);
    }
    if (failCount > 0) {
      toast.error(`Failed to disconnect ${failCount} page${failCount !== 1 ? 's' : ''}`);
    }
  }, [selectedPageIds.size, selectedPages, disconnectPage, clearSelection, refetch, onRefresh]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connected Pages</CardTitle>
          <CardDescription>Manage your connected Facebook pages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner className="h-8 w-8" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connected Pages</CardTitle>
          <CardDescription>Manage your connected Facebook pages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Facebook className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No Facebook pages connected yet</p>
            <p className="text-sm mt-2">Click &quot;Connect with Facebook&quot; above to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Connected Pages ({filteredPages.length})</CardTitle>
          <CardDescription>
            Manage your connected Facebook pages and sync contacts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <Input
              type="text"
              placeholder="Search pages by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />

            {/* Bulk Actions */}
            <BulkActionsBar
              totalPages={filteredPages.length}
              selectedCount={selectedCount}
              isAllSelected={selectedCount === filteredPages.length && filteredPages.length > 0}
              isBulkSyncing={isBulkSyncing}
              isBulkDisconnecting={isBulkDisconnecting}
              onToggleSelectAll={() => toggleSelectAll(filteredPages)}
              onBulkSync={handleBulkSync}
              onBulkDisconnect={() => setShowBulkDisconnectDialog(true)}
            />

            {/* Pages List */}
            {paginatedPages.map((page) => {
              const syncJob = activeJobs[page.id];
              const isSyncing = !!syncJob && (syncJob.status === 'PENDING' || syncJob.status === 'IN_PROGRESS');
              const contactCount = counts[page.id] ?? 0;

              return (
                <ConnectedPageCard
                  key={page.id}
                  page={page}
                  contactCount={contactCount}
                  syncJob={syncJob}
                  isSelected={isSelected(page.id)}
                  isSyncing={isSyncing}
                  isDisconnecting={disconnectingPageId === page.id}
                  onToggleSelection={() => toggleSelection(page.id)}
                  onSync={() => handleSync(page)}
                  onCancelSync={() => handleCancelSync(page)}
                  onDisconnect={() => setPageToDisconnect(page)}
                />
              );
            })}

            {/* Pagination */}
            <PagesPagination
              currentPage={currentPage}
              totalPages={totalPages}
              startIndex={startIndex}
              endIndex={endIndex}
              totalItems={filteredPages.length}
              onPrevious={previousPage}
              onNext={nextPage}
            />
          </div>
        </CardContent>
      </Card>

      {/* Single Page Disconnect Dialog */}
      <AlertDialog
        open={!!pageToDisconnect}
        onOpenChange={(open) => !open && setPageToDisconnect(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Facebook Page?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect <strong>{pageToDisconnect?.pageName}</strong>? This will remove all associated contacts and campaigns.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pageToDisconnect && handleDisconnect(pageToDisconnect)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Disconnect Dialog */}
      <AlertDialog
        open={showBulkDisconnectDialog}
        onOpenChange={setShowBulkDisconnectDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Multiple Pages?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect <strong>{selectedCount} page{selectedCount !== 1 ? 's' : ''}</strong>?
              This will remove all associated contacts and campaigns from these pages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDisconnecting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDisconnect}
              disabled={isBulkDisconnecting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isBulkDisconnecting ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Disconnecting...
                </>
              ) : (
                `Disconnect ${selectedCount} Page${selectedCount !== 1 ? 's' : ''}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

