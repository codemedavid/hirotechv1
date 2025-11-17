import { useState, useMemo } from 'react';
import { useDebounce } from 'use-debounce';

/**
 * Generic search hook with debouncing
 */
export function useSearch<T>(
  items: T[],
  searchFn: (item: T, query: string) => boolean,
  debounceMs: number = 300
) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, debounceMs);

  const filteredItems = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return items;
    }

    return items.filter((item) => searchFn(item, debouncedQuery.toLowerCase()));
  }, [items, debouncedQuery, searchFn]);

  return {
    searchQuery,
    setSearchQuery,
    filteredItems,
    debouncedQuery,
  };
}

