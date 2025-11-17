'use client';

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Facebook, Users } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useFacebookOAuth } from '@/hooks/use-facebook-oauth';

// Code-split heavy components for better performance
const FacebookPageSelectorDialog = dynamic(
  () => import('@/components/integrations/facebook-page-selector-dialog').then(mod => ({ default: mod.FacebookPageSelectorDialog })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    ),
    ssr: false
  }
);

const ConnectedPagesList = dynamic(
  () => import('@/components/integrations/connected-pages-list').then(mod => ({ default: mod.ConnectedPagesList })),
  {
    loading: () => (
      <Card>
        <CardHeader>
          <CardTitle>Connected Pages</CardTitle>
          <CardDescription>Loading your connected pages...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner className="h-8 w-8" />
          </div>
        </CardContent>
      </Card>
    ),
    ssr: false
  }
);

const FacebookDiagnosticPanel = dynamic(
  () => import('@/components/settings/facebook-diagnostic-panel').then(mod => ({ default: mod.FacebookDiagnosticPanel })),
  {
    loading: () => (
      <Card>
        <CardHeader>
          <CardTitle>Diagnostics</CardTitle>
          <CardDescription>Loading diagnostic tools...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner className="h-8 w-8" />
          </div>
        </CardContent>
      </Card>
    ),
    ssr: false
  }
);

import type { ConnectedPage } from '@/hooks/use-connected-pages';
import type { SyncJob } from '@/hooks/use-sync-jobs';

interface IntegrationsClientProps {
  initialTotalContacts: number;
  initialPages?: ConnectedPage[];
  initialContactCounts?: Record<string, number>;
  initialActiveSyncJobs?: Record<string, SyncJob>;
}

export function IntegrationsClient({
  initialTotalContacts,
  initialPages = [],
  initialContactCounts = {},
  initialActiveSyncJobs = {},
}: IntegrationsClientProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [totalContacts, setTotalContacts] = useState<number>(initialTotalContacts);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [appOrigin, setAppOrigin] = useState('');

  // Use OAuth hook
  const {
    token: userAccessToken,
    showPageSelector,
    setShowPageSelector,
    connectFacebook,
    resetOAuth,
  } = useFacebookOAuth();

  // Set appOrigin after hydration to avoid mismatch
  useEffect(() => {
    setAppOrigin(window.location.origin);
  }, []);

  function handlePagesConnected() {
    resetOAuth();
    setRefreshKey(prev => prev + 1);
  }

  function handleRefresh() {
    setRefreshKey(prev => prev + 1);
    fetchTotalContacts();
  }

  // Fetch total contacts count
  async function fetchTotalContacts() {
    try {
      setIsLoadingContacts(true);
      const response = await fetch('/api/contacts/total-count');
      if (response.ok) {
        const data = await response.json();
        setTotalContacts(data.count);
      }
    } catch (error) {
      console.error('Error fetching total contacts:', error);
    } finally {
      setIsLoadingContacts(false);
    }
  }

  // Fetch total contacts on mount
  useEffect(() => {
    fetchTotalContacts();
  }, [refreshKey]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted-foreground mt-2">
          Connect your Facebook pages for Messenger bulk messaging
        </p>
      </div>

      {/* Diagnostic Panel */}
      <FacebookDiagnosticPanel />

      {/* Total Contacts Counter */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Total Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
            {isLoadingContacts ? (
              <span className="animate-pulse">...</span>
            ) : (
              totalContacts.toLocaleString()
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Synced contacts across all connected pages
          </p>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5 text-blue-600" />
            Facebook Messenger
          </CardTitle>
          <CardDescription>
            Connect your Facebook pages to send bulk messages via Messenger
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={connectFacebook} size="lg">
            <Facebook className="mr-2 h-5 w-5" />
            Connect with Facebook
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            You&apos;ll be redirected to Facebook to authorize access to your pages.
            You can select multiple pages at once.
          </p>
        </CardContent>
      </Card>

      <ConnectedPagesList
        key={refreshKey}
        onRefresh={handleRefresh}
        onSyncComplete={fetchTotalContacts}
        initialPages={initialPages}
        initialContactCounts={initialContactCounts}
        initialActiveSyncJobs={initialActiveSyncJobs}
      />

      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>
            Make sure your Facebook app is configured properly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">1. Create a Facebook App</h4>
            <p className="text-sm text-muted-foreground">
              Go to{' '}
              <a
                href="https://developers.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                developers.facebook.com
              </a>{' '}
              and create a new app with Messenger product
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">2. Add Required Permissions</h4>
            <p className="text-sm text-muted-foreground">
              Your app needs these permissions: pages_show_list, pages_messaging,
              pages_read_engagement, pages_manage_metadata
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">3. Configure OAuth Redirect</h4>
            <p className="text-sm text-muted-foreground">
              Add these URLs to your Facebook App&apos;s OAuth redirect URIs:
            </p>
            <code className="block bg-muted px-3 py-2 rounded text-sm mb-2">
              {appOrigin ? `${appOrigin}/api/facebook/callback` : 'Loading...'}
            </code>
            <code className="block bg-muted px-3 py-2 rounded text-sm">
              {appOrigin ? `${appOrigin}/api/facebook/callback-popup` : 'Loading...'}
            </code>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">4. Configure Webhook</h4>
            <p className="text-sm text-muted-foreground">
              Set up your webhook to receive messages:
            </p>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-medium">Callback URL:</span>
              </p>
              <code className="block bg-muted px-3 py-2 rounded text-sm">
                {appOrigin ? `${appOrigin}/api/webhooks/facebook` : 'Loading...'}
              </code>
              <p className="text-sm mt-2">
                <span className="font-medium">Verify Token:</span> Check your .env file
                for FACEBOOK_WEBHOOK_VERIFY_TOKEN
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {userAccessToken && (
        <FacebookPageSelectorDialog
          open={showPageSelector}
          onOpenChange={setShowPageSelector}
          userAccessToken={userAccessToken}
          onPagesConnected={handlePagesConnected}
        />
      )}
    </div>
  );
}

