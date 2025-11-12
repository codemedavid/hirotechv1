'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useQueryState } from 'nuqs';

export function ContactsSearch() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useQueryState('search', {
    defaultValue: '',
    shallow: false,
  });

  function handleSearch(value: string) {
    startTransition(() => {
      setSearch(value || null);
      router.refresh();
    });
  }

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search contacts..."
        className="pl-10"
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        disabled={isPending}
      />
    </div>
  );
}

