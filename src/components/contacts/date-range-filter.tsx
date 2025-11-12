'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { useQueryState } from 'nuqs';

export function DateRangeFilter() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dateFrom, setDateFrom] = useQueryState('dateFrom', {
    defaultValue: '',
    shallow: false,
  });
  const [dateTo, setDateTo] = useQueryState('dateTo', {
    defaultValue: '',
    shallow: false,
  });

  const [localDateFrom, setLocalDateFrom] = useState<Date | undefined>(
    dateFrom ? new Date(dateFrom) : undefined
  );
  const [localDateTo, setLocalDateTo] = useState<Date | undefined>(
    dateTo ? new Date(dateTo) : undefined
  );

  function applyDates(from: Date | undefined, to: Date | undefined) {
    startTransition(() => {
      setDateFrom(from ? from.toISOString() : null);
      setDateTo(to ? to.toISOString() : null);
      router.refresh();
    });
  }

  function clearDates() {
    setLocalDateFrom(undefined);
    setLocalDateTo(undefined);
    applyDates(undefined, undefined);
  }

  function setPreset(preset: 'thisMonth' | 'lastMonth') {
    const now = new Date();
    let from: Date;
    let to: Date;

    if (preset === 'thisMonth') {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else {
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    setLocalDateFrom(from);
    setLocalDateTo(to);
    applyDates(from, to);
  }

  const hasDateFilter = dateFrom || dateTo;

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="min-w-[240px] justify-start" disabled={isPending}>
            <CalendarIcon className="h-4 w-4 mr-2" />
            {localDateFrom && localDateTo ? (
              <>
                {format(localDateFrom, 'MMM d, yyyy')} - {format(localDateTo, 'MMM d, yyyy')}
              </>
            ) : (
              'Filter by date'
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4 space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">From Date</p>
              <Calendar
                mode="single"
                selected={localDateFrom}
                onSelect={(date) => {
                  setLocalDateFrom(date);
                  if (date && localDateTo) {
                    applyDates(date, localDateTo);
                  }
                }}
                initialFocus
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">To Date</p>
              <Calendar
                mode="single"
                selected={localDateTo}
                onSelect={(date) => {
                  setLocalDateTo(date);
                  if (localDateFrom && date) {
                    applyDates(localDateFrom, date);
                  }
                }}
                disabled={(date) => (localDateFrom ? date < localDateFrom : false)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={clearDates}>
                Clear
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setPreset('thisMonth')}>
                This Month
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setPreset('lastMonth')}>
                Last Month
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {hasDateFilter && (
        <Button variant="ghost" size="icon" onClick={clearDates} disabled={isPending}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </>
  );
}

