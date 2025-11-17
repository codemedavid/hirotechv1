'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Facebook, Instagram, RefreshCw, Unplug, CheckCircle2, Users, Settings, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import type { ConnectedPage } from '@/hooks/use-connected-pages';
import type { SyncJob } from '@/hooks/use-sync-jobs';
import { SyncStatusIndicator } from './sync-status-indicator';

interface ConnectedPageCardProps {
  page: ConnectedPage;
  contactCount: number;
  syncJob?: SyncJob;
  isSelected: boolean;
  isSyncing: boolean;
  isDisconnecting: boolean;
  onToggleSelection: () => void;
  onSync: () => void;
  onCancelSync: () => void;
  onDisconnect: () => void;
}

export const ConnectedPageCard = memo(function ConnectedPageCard({
  page,
  contactCount,
  syncJob,
  isSelected,
  isSyncing,
  isDisconnecting,
  onToggleSelection,
  onSync,
  onCancelSync,
  onDisconnect,
}: ConnectedPageCardProps) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border p-4 transition-all ${
        isSelected
          ? 'bg-primary/5 border-primary'
          : 'hover:bg-muted/50'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <Checkbox
            id={`page-${page.id}`}
            checked={isSelected}
            onCheckedChange={onToggleSelection}
            className="mt-1"
          />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Facebook className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold">{page.pageName}</h4>
              {page.isActive ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )}
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" />
                {contactCount} {contactCount === 1 ? 'contact' : 'contacts'}
              </Badge>
            </div>

            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Page ID: {page.pageId}</p>
              {page.instagramAccountId && (
                <div className="flex items-center gap-1">
                  <Instagram className="h-4 w-4 text-pink-600" />
                  <span>
                    Instagram: @{page.instagramUsername || 'Connected'}
                  </span>
                </div>
              )}
              {page.lastSyncedAt && (
                <p>
                  Last synced:{' '}
                  {formatDistanceToNow(new Date(page.lastSyncedAt), {
                    addSuffix: true,
                  })}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/facebook-pages/${page.id}/settings`}>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
          {isSyncing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancelSync}
              className="text-destructive hover:text-destructive"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Stop Sync
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={onSync}
              disabled={isDisconnecting}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onDisconnect}
            disabled={isDisconnecting || isSyncing}
          >
            {isDisconnecting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Disconnecting...
              </>
            ) : (
              <>
                <Unplug className="mr-2 h-4 w-4" />
                Disconnect
              </>
            )}
          </Button>
        </div>
      </div>

      {isSyncing && syncJob && (
        <SyncStatusIndicator syncJob={syncJob} />
      )}
    </div>
  );
});

