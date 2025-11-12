'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Tag {
  id?: string;
  name: string;
  color: string;
}

interface ContactTagEditorProps {
  contactId: string;
  currentTags: string[];
  availableTags: Tag[];
}

export function ContactTagEditor({
  contactId,
  currentTags,
  availableTags,
}: ContactTagEditorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleAddTag(tag: string) {
    try {
      const response = await fetch(`/api/contacts/${contactId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag }),
      });

      if (response.ok) {
        toast.success('Tag added');
        router.refresh();
      } else {
        toast.error('Failed to add tag');
      }
    } catch (error) {
      console.error('Error adding tag:', error);
      toast.error('Failed to add tag');
    }
  }

  async function handleRemoveTag(tag: string) {
    try {
      const response = await fetch(`/api/contacts/${contactId}/tags`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag }),
      });

      if (response.ok) {
        toast.success('Tag removed');
        router.refresh();
      } else {
        toast.error('Failed to remove tag');
      }
    } catch (error) {
      console.error('Error removing tag:', error);
      toast.error('Failed to remove tag');
    }
  }

  const unassignedTags = availableTags.filter(
    (tag) => !currentTags.includes(tag.name)
  );

  return (
    <div className="flex flex-wrap gap-2">
      {currentTags.map((tagName) => {
        const tag = availableTags.find((t) => t.name === tagName);
        return (
          <Badge
            key={tagName}
            variant="secondary"
            className="gap-1"
            style={
              tag
                ? { backgroundColor: `${tag.color}20`, color: tag.color }
                : {}
            }
          >
            {tagName}
            <button
              onClick={() => handleRemoveTag(tagName)}
              className="ml-1 hover:bg-background/50 rounded-full"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        );
      })}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-7">
            <Plus className="h-3 w-3 mr-1" />
            Add Tag
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-56" align="start">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandEmpty>No tags found.</CommandEmpty>
            <CommandGroup>
              {unassignedTags.map((tag) => (
                <CommandItem
                  key={tag.name}
                  onSelect={async () => {
                    await handleAddTag(tag.name);
                    setOpen(false);
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

