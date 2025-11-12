'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Tag as TagIcon, X } from 'lucide-react';
import { useQueryState } from 'nuqs';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagsFilterProps {
  tags: Tag[];
}

export function TagsFilter({ tags }: TagsFilterProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedTags, setSelectedTags] = useQueryState('tags', {
    defaultValue: '',
    shallow: false,
  });

  const selectedTagsArray = selectedTags ? selectedTags.split(',') : [];

  function handleTagToggle(tagName: string) {
    startTransition(() => {
      const currentTags = selectedTagsArray;
      const newTags = currentTags.includes(tagName)
        ? currentTags.filter((t) => t !== tagName)
        : [...currentTags, tagName];

      setSelectedTags(newTags.length > 0 ? newTags.join(',') : null);
      router.refresh();
    });
  }

  function clearTags() {
    startTransition(() => {
      setSelectedTags(null);
      router.refresh();
    });
  }

  const hasFilters = selectedTagsArray.length > 0;

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={isPending}>
            <TagIcon className="h-4 w-4 mr-2" />
            Tags
            {hasFilters && (
              <Badge variant="secondary" className="ml-2">
                {selectedTagsArray.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Filter by Tags</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="max-h-64 overflow-y-auto">
            {tags.length === 0 ? (
              <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                No tags available
              </div>
            ) : (
              tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center gap-2 px-2 py-2 hover:bg-accent rounded-sm cursor-pointer"
                  onClick={() => handleTagToggle(tag.name)}
                >
                  <Checkbox
                    checked={selectedTagsArray.includes(tag.name)}
                    onCheckedChange={() => handleTagToggle(tag.name)}
                  />
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-sm flex-1">{tag.name}</span>
                </div>
              ))
            )}
          </div>
          {hasFilters && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={clearTags}
                >
                  Clear filters
                </Button>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {hasFilters && (
        <Button variant="ghost" size="icon" onClick={clearTags} disabled={isPending}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

