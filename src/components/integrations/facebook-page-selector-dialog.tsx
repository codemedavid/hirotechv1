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
import { Facebook, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

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
  
  // Pagination states for available pages
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 10;
  
  // Pagination states for connected pages
  const [connectedCurrentPage, setConnectedCurrentPage] = useState(1);
  const [connectedSearchQuery, setConnectedSearchQuery] = useState('');
  const connectedItemsPerPage = 5;

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
    } catch (error) {
      console.error('Error fetching pages:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch Facebook pages';
      toast.error(message);
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

  // Select all unconnected pages across all pagination pages
  function toggleAllPages() {
    const allUnconnectedIds = pages.filter(p => !p.isConnected).map(p => p.id);
    if (selectedPageIds.size === allUnconnectedIds.length) {
      // Unselect all
      setSelectedPageIds(new Set());
    } else {
      // Select all unconnected pages across all pages
      setSelectedPageIds(new Set(allUnconnectedIds));
    }
  }

  // Select only pages visible on current page
  function toggleCurrentPage() {
    const currentPageIds = paginatedPages.map(p => p.id);
    const allSelected = currentPageIds.every(id => selectedPageIds.has(id));
    
    const newSelected = new Set(selectedPageIds);
    if (allSelected) {
      // Deselect current page items
      currentPageIds.forEach(id => newSelected.delete(id));
    } else {
      // Select current page items
      currentPageIds.forEach(id => newSelected.add(id));
    }
    setSelectedPageIds(newSelected);
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
    } catch (error) {
      console.error('Error saving pages:', error);
      const message = error instanceof Error ? error.message : 'Failed to connect pages';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  // Filter and paginate available pages
  const availablePages = pages.filter(p => !p.isConnected);
  const connectedPages = pages.filter(p => p.isConnected);
  
  // Filter by search query (available pages)
  const filteredPages = searchQuery
    ? availablePages.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.includes(searchQuery)
      )
    : availablePages;
  
  // Pagination logic (available pages)
  const totalPages = Math.ceil(filteredPages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPages = filteredPages.slice(startIndex, endIndex);
  
  // Filter by search query (connected pages)
  const filteredConnectedPages = connectedSearchQuery
    ? connectedPages.filter(p => 
        p.name.toLowerCase().includes(connectedSearchQuery.toLowerCase()) ||
        p.id.includes(connectedSearchQuery)
      )
    : connectedPages;
  
  // Pagination logic (connected pages)
  const totalConnectedPages = Math.ceil(filteredConnectedPages.length / connectedItemsPerPage);
  const connectedStartIndex = (connectedCurrentPage - 1) * connectedItemsPerPage;
  const connectedEndIndex = connectedStartIndex + connectedItemsPerPage;
  const paginatedConnectedPages = filteredConnectedPages.slice(connectedStartIndex, connectedEndIndex);
  
  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);
  
  useEffect(() => {
    setConnectedCurrentPage(1);
  }, [connectedSearchQuery]);

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
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Available Pages ({filteredPages.length} of {availablePages.length})
                      {selectedPageIds.size > 0 && (
                        <span className="ml-2 text-primary">
                          • {selectedPageIds.size} selected
                        </span>
                      )}
                    </Label>
                    <div className="flex gap-2">
                      {totalPages > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={toggleCurrentPage}
                          className="text-xs"
                        >
                          {paginatedPages.every(p => selectedPageIds.has(p.id))
                            ? 'Deselect Page'
                            : 'Select Page'}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleAllPages}
                        className="text-xs font-semibold"
                      >
                        {selectedPageIds.size === availablePages.length
                          ? 'Deselect All'
                          : 'Select All Pages'}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Search bar */}
                  <Input
                    type="text"
                    placeholder="Search pages by name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>

                <ScrollArea className="h-[300px] rounded-md border p-4">
                  <div className="space-y-3">
                    {paginatedPages.map((page) => (
                      <div
                        key={page.id}
                        className={`flex items-start space-x-3 rounded-lg border p-3 transition-all cursor-pointer ${
                          selectedPageIds.has(page.id)
                            ? 'bg-primary/10 border-primary shadow-sm'
                            : 'hover:bg-muted/50 hover:border-muted-foreground/20'
                        }`}
                        onClick={() => togglePage(page.id)}
                      >
                        <Checkbox
                          id={`page-${page.id}`}
                          checked={selectedPageIds.has(page.id)}
                          onCheckedChange={() => togglePage(page.id)}
                          className="mt-1"
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
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t pt-3 bg-muted/30 -mx-4 px-4 py-3 rounded-b-lg">
                    <p className="text-sm font-medium text-muted-foreground">
                      Page {currentPage} of {totalPages} • Showing {startIndex + 1}-{Math.min(endIndex, filteredPages.length)} of {filteredPages.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="h-8"
                      >
                        First
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="h-8"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm font-semibold min-w-[60px] text-center">
                        {currentPage} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="h-8"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="h-8"
                      >
                        Last
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {connectedPages.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Already Connected ({filteredConnectedPages.length} of {connectedPages.length})
                  </Label>
                </div>
                
                {/* Search bar for connected pages */}
                <Input
                  type="text"
                  placeholder="Search connected pages..."
                  value={connectedSearchQuery}
                  onChange={(e) => setConnectedSearchQuery(e.target.value)}
                  className="w-full"
                />
                
                {/* Connected pages list with scroll */}
                <div className="max-h-[250px] overflow-y-auto space-y-2 rounded-lg border p-3 bg-muted/20">
                  {paginatedConnectedPages.length > 0 ? (
                    paginatedConnectedPages.map((page) => (
                      <div
                        key={page.id}
                        className="flex items-center justify-between rounded-lg border p-3 bg-background"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="text-sm font-medium truncate block">{page.name}</span>
                            <span className="text-xs text-muted-foreground">ID: {page.id}</span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="flex-shrink-0">Connected</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      No connected pages match your search
                    </p>
                  )}
                </div>
                
                {/* Pagination Controls for Connected Pages */}
                {totalConnectedPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t pt-3 bg-muted/20 px-3 py-2 rounded-b-lg">
                    <p className="text-xs font-medium text-muted-foreground">
                      Page {connectedCurrentPage} of {totalConnectedPages} • Showing {connectedStartIndex + 1}-{Math.min(connectedEndIndex, filteredConnectedPages.length)} of {filteredConnectedPages.length}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConnectedCurrentPage(1)}
                        disabled={connectedCurrentPage === 1}
                        className="h-7 px-2 text-xs"
                      >
                        First
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConnectedCurrentPage(p => Math.max(1, p - 1))}
                        disabled={connectedCurrentPage === 1}
                        className="h-7 px-2"
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <span className="text-xs font-semibold min-w-[50px] text-center px-2">
                        {connectedCurrentPage} / {totalConnectedPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConnectedCurrentPage(p => Math.min(totalConnectedPages, p + 1))}
                        disabled={connectedCurrentPage === totalConnectedPages}
                        className="h-7 px-2"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConnectedCurrentPage(totalConnectedPages)}
                        disabled={connectedCurrentPage === totalConnectedPages}
                        className="h-7 px-2 text-xs"
                      >
                        Last
                      </Button>
                    </div>
                  </div>
                )}
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

