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
import { MessageCircle } from 'lucide-react';
import { useQueryState } from 'nuqs';

const PLATFORMS = [
  { value: 'messenger', label: 'Messenger' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'both', label: 'Both Platforms' },
];

export function PlatformFilter() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [platform, setPlatform] = useQueryState('platform', {
    defaultValue: '',
    shallow: false,
  });

  function handlePlatformChange(value: string) {
    startTransition(() => {
      setPlatform(value || null);
      router.refresh();
    });
  }

  const selectedPlatform = PLATFORMS.find((p) => p.value === platform);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isPending}>
          <MessageCircle className="h-4 w-4 mr-2" />
          {selectedPlatform ? selectedPlatform.label : 'All Platforms'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Filter by Platform</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handlePlatformChange('')}>
          <div className="flex items-center w-full">
            All Platforms
            {!platform && (
              <Badge variant="secondary" className="ml-auto text-xs">
                Active
              </Badge>
            )}
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {PLATFORMS.map((p) => (
          <DropdownMenuItem key={p.value} onClick={() => handlePlatformChange(p.value)}>
            <div className="flex items-center w-full">
              {p.label}
              {platform === p.value && (
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

