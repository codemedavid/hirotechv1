import { useState, useCallback } from 'react';
import type { ConnectedPage } from './use-connected-pages';

/**
 * Hook for managing bulk selection and operations
 */
export function useBulkOperations(pages: ConnectedPage[]) {
  const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());

  const toggleSelection = useCallback((pageId: string) => {
    setSelectedPageIds((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(pageId)) {
        newSelected.delete(pageId);
      } else {
        newSelected.add(pageId);
      }
      return newSelected;
    });
  }, []);

  const toggleSelectAll = useCallback((filteredPages: ConnectedPage[]) => {
    setSelectedPageIds((prev) => {
      if (prev.size === filteredPages.length && filteredPages.length > 0) {
        return new Set();
      } else {
        return new Set(filteredPages.map((p) => p.id));
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedPageIds(new Set());
  }, []);

  const isSelected = useCallback(
    (pageId: string) => selectedPageIds.has(pageId),
    [selectedPageIds]
  );

  const getSelectedPages = useCallback(() => {
    return pages.filter((p) => selectedPageIds.has(p.id));
  }, [pages, selectedPageIds]);

  return {
    selectedPageIds,
    selectedCount: selectedPageIds.size,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    isSelected,
    selectedPages: getSelectedPages,
  };
}

