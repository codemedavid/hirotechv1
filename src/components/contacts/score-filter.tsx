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
import { TrendingUp } from 'lucide-react';
import { useQueryState } from 'nuqs';

const SCORE_RANGES = [
  { value: '0-20', label: 'Low (0-20)', min: 0, max: 20 },
  { value: '21-50', label: 'Medium (21-50)', min: 21, max: 50 },
  { value: '51-80', label: 'High (51-80)', min: 51, max: 80 },
  { value: '81-100', label: 'Very High (81-100)', min: 81, max: 100 },
];

export function ScoreFilter() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [scoreRange, setScoreRange] = useQueryState('scoreRange', {
    defaultValue: '',
    shallow: false,
  });

  function handleScoreChange(value: string) {
    startTransition(() => {
      setScoreRange(value || null);
      router.refresh();
    });
  }

  const selectedScore = SCORE_RANGES.find((s) => s.value === scoreRange);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isPending}>
          <TrendingUp className="h-4 w-4 mr-2" />
          {selectedScore ? selectedScore.label : 'All Scores'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Filter by Score</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleScoreChange('')}>
          <div className="flex items-center w-full">
            All Scores
            {!scoreRange && (
              <Badge variant="secondary" className="ml-auto text-xs">
                Active
              </Badge>
            )}
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {SCORE_RANGES.map((range) => (
          <DropdownMenuItem key={range.value} onClick={() => handleScoreChange(range.value)}>
            <div className="flex items-center w-full">
              {range.label}
              {scoreRange === range.value && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  Active
                </Badge>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

