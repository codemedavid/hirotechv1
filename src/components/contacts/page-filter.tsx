'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Filter } from 'lucide-react';
import { useQueryState } from 'nuqs';

interface FacebookPage {
  id: string;
  pageName: string;
  instagramUsername: string | null;
}

interface PageFilterProps {
  pages: FacebookPage[];
}

export function PageFilter({ pages }: PageFilterProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedPageId, setSelectedPageId] = useQueryState('pageId', {
    defaultValue: '',
    shallow: false,
  });

  function handlePageChange(pageId: string) {
    startTransition(() => {
      setSelectedPageId(pageId || null);
      router.refresh();
    });
  }

  const selectedPage = pages.find((p) => p.id === selectedPageId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isPending}>
          <Filter className="h-4 w-4 mr-2" />
          {selectedPage ? selectedPage.pageName : 'All Pages'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Filter by Page</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handlePageChange('')}>
          <div className="flex items-center w-full">
            All Pages
            {!selectedPageId && (
              <Badge variant="secondary" className="ml-auto text-xs">
                Active
              </Badge>
            )}
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {pages.map((page) => (
          <DropdownMenuItem key={page.id} onClick={() => handlePageChange(page.id)}>
            <div className="flex flex-col w-full">
              <div className="flex items-center">
                {page.pageName}
                {selectedPageId === page.id && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Active
                  </Badge>
                )}
              </div>
              {page.instagramUsername && (
                <span className="text-xs text-muted-foreground">@{page.instagramUsername}</span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

