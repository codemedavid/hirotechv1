'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Facebook, Instagram, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface FacebookPage {
  id: string;
  name: string;
  accessToken: string;
  isConnected: boolean;
}

interface FacebookPageSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userAccessToken: string;
  onPagesConnected: () => void;
}

export function FacebookPageSelectorDialog({
  open,
  onOpenChange,
  userAccessToken,
  onPagesConnected,
}: FacebookPageSelectorDialogProps) {
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch pages when dialog opens
  useEffect(() => {
    if (open && userAccessToken) {
      fetchPages();
    }
  }, [open, userAccessToken]);

  async function fetchPages() {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/facebook/pages?token=${encodeURIComponent(userAccessToken)}`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch pages');
      }

      const data = await response.json();
      setPages(data.pages);
    } catch (error: any) {
      console.error('Error fetching pages:', error);
      toast.error(error.message || 'Failed to fetch Facebook pages');
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  }

  function togglePage(pageId: string) {
    const newSelected = new Set(selectedPageIds);
    if (newSelected.has(pageId)) {
      newSelected.delete(pageId);
    } else {
      newSelected.add(pageId);
    }
    setSelectedPageIds(newSelected);
  }

  function toggleAll() {
    if (selectedPageIds.size === pages.filter(p => !p.isConnected).length) {
      // Unselect all
      setSelectedPageIds(new Set());
    } else {
      // Select all unconnected pages
      setSelectedPageIds(
        new Set(pages.filter(p => !p.isConnected).map(p => p.id))
      );
    }
  }

  async function handleSave() {
    if (selectedPageIds.size === 0) {
      toast.error('Please select at least one page');
      return;
    }

    setIsSaving(true);
    try {
      const selectedPages = pages.filter(p => selectedPageIds.has(p.id));

      const response = await fetch('/api/facebook/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedPages: selectedPages.map(p => ({ id: p.id, name: p.name })),
          userAccessToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save pages');
      }

      toast.success(
        `Successfully connected ${data.savedPages} page${data.savedPages > 1 ? 's' : ''}`
      );

      if (data.errors && data.errors.length > 0) {
        toast.error(
          `Failed to connect ${data.errors.length} page${data.errors.length > 1 ? 's' : ''}`
        );
      }

      onOpenChange(false);
      onPagesConnected();
    } catch (error: any) {
      console.error('Error saving pages:', error);
      toast.error(error.message || 'Failed to connect pages');
    } finally {
      setIsSaving(false);
    }
  }

  const availablePages = pages.filter(p => !p.isConnected);
  const connectedPages = pages.filter(p => p.isConnected);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5" />
            Select Facebook Pages
          </DialogTitle>
          <DialogDescription>
            Choose which Facebook pages you want to connect for messaging
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner className="h-8 w-8" />
          </div>
        ) : (
          <div className="space-y-4">
            {availablePages.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Available Pages ({availablePages.length})
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleAll}
                  >
                    {selectedPageIds.size === availablePages.length
                      ? 'Unselect All'
                      : 'Select All'}
                  </Button>
                </div>

                <ScrollArea className="h-[300px] rounded-md border p-4">
                  <div className="space-y-3">
                    {availablePages.map((page) => (
                      <div
                        key={page.id}
                        className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          id={`page-${page.id}`}
                          checked={selectedPageIds.has(page.id)}
                          onCheckedChange={() => togglePage(page.id)}
                        />
                        <div className="flex-1 space-y-1">
                          <Label
                            htmlFor={`page-${page.id}`}
                            className="flex items-center gap-2 font-medium cursor-pointer"
                          >
                            {page.name}
                            <Facebook className="h-3 w-3 text-blue-600" />
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            ID: {page.id}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}

            {connectedPages.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Already Connected ({connectedPages.length})
                </Label>
                <div className="space-y-2">
                  {connectedPages.map((page) => (
                    <div
                      key={page.id}
                      className="flex items-center justify-between rounded-lg border p-3 bg-muted/30"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">{page.name}</span>
                      </div>
                      <Badge variant="secondary">Connected</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pages.length === 0 && !isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                No Facebook pages found. Make sure you have pages you manage.
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={selectedPageIds.size === 0 || isSaving || isLoading}
          >
            {isSaving ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Connecting...
              </>
            ) : (
              `Connect ${selectedPageIds.size} Page${selectedPageIds.size !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

