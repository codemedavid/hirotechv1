'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useQueryState } from 'nuqs';

interface ContactsPaginationProps {
  currentPage: number;
  totalPages: number;
  totalContacts: number;
  limit: number;
}

export function ContactsPagination({
  currentPage,
  totalPages,
  totalContacts,
  limit,
}: ContactsPaginationProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [, setPage] = useQueryState('page', {
    defaultValue: '1',
    shallow: false,
  });

  function handlePageChange(page: number) {
    startTransition(() => {
      setPage(page.toString());
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {(currentPage - 1) * limit + 1} to{' '}
        {Math.min(currentPage * limit, totalContacts)} of {totalContacts} contacts
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1 || isPending}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || isPending}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || isPending}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages || isPending}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

