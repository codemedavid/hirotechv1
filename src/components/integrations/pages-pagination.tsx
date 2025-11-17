'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PagesPaginationProps {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalItems: number;
  onPrevious: () => void;
  onNext: () => void;
}

export const PagesPagination = memo(function PagesPagination({
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  totalItems,
  onPrevious,
  onNext,
}: PagesPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t pt-4 mt-4">
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages} • Showing {startIndex + 1}-{endIndex} of {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={currentPage === totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

