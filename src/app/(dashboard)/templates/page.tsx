'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Pencil, Trash2, X, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useDebouncedCallback } from 'use-debounce';

interface Template {
  id: string;
  name: string;
  content: string;
  platform: string;
  category?: string;
  recommendedTag?: string;
  usageCount: number;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async (search = '') => {
    try {
      const url = search 
        ? `/api/templates?search=${encodeURIComponent(search)}`
        : '/api/templates';
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setTemplates(data);
        setFilteredTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search function
  const debouncedSearch = useDebouncedCallback((value: string) => {
    setLoading(true);
    fetchTemplates(value);
  }, 500);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    debouncedSearch(value);
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate({ ...template });
  };

  const handleSave = async () => {
    if (!editingTemplate) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingTemplate.name,
          content: editingTemplate.content,
          platform: editingTemplate.platform,
          category: editingTemplate.category || null,
          recommendedTag: editingTemplate.recommendedTag || null,
        }),
      });

      if (response.ok) {
        const updatedTemplate = await response.json();
        setTemplates((prev) =>
          prev.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t))
        );
        setEditingTemplate(null);
        toast.success('Template updated successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update template');
      }
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSelect = (templateId: string) => {
    setSelectedTemplates((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(templateId)) {
        newSet.delete(templateId);
      } else {
        newSet.add(templateId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedTemplates.size === filteredTemplates.length) {
      setSelectedTemplates(new Set());
    } else {
      setSelectedTemplates(new Set(filteredTemplates.map((t) => t.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTemplates.size === 0) return;

    setDeleting(true);
    try {
      const response = await fetch('/api/templates/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateIds: Array.from(selectedTemplates),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setTemplates((prev) =>
          prev.filter((t) => !selectedTemplates.has(t.id))
        );
        setSelectedTemplates(new Set());
        setShowDeleteDialog(false);
        toast.success(
          `Successfully deleted ${result.deletedCount} template${
            result.deletedCount !== 1 ? 's' : ''
          }`
        );
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete templates');
        if (error.templatesInUse) {
          toast.error(
            `Templates in use: ${error.templatesInUse.join(', ')}`,
            { duration: 5000 }
          );
        }
      }
    } catch (error) {
      console.error('Error deleting templates:', error);
      toast.error('Failed to delete templates');
    } finally {
      setDeleting(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedTemplates(new Set());
  };

  if (loading && templates.length === 0) {
    return <div>Loading...</div>;
  }

  const selectedCount = selectedTemplates.size;
  const allSelected = filteredTemplates.length > 0 && selectedCount === filteredTemplates.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates</h1>
          <p className="text-muted-foreground mt-2">
            Manage your message templates for campaigns
          </p>
        </div>
        {templates.length > 0 && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={allSelected}
              onCheckedChange={handleSelectAll}
            />
            <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
              Select All
            </Label>
          </div>
        )}
      </div>

      {/* Search Bar */}
      {templates.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search templates by name, content, or category..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSearch('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Bulk Action Toolbar */}
      {selectedCount > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-medium">
              {selectedCount} template{selectedCount !== 1 ? 's' : ''} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="h-8"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Selection
            </Button>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="h-8"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      )}

      {templates.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="No templates yet"
          description="Templates will be created automatically when you create campaigns"
        />
      ) : filteredTemplates.length === 0 ? (
        <EmptyState
          icon={<Search className="h-12 w-12" />}
          title="No templates found"
          description={`No templates match "${searchQuery}". Try a different search term.`}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => {
            const isSelected = selectedTemplates.has(template.id);
            return (
              <Card
                key={template.id}
                className={`transition-all ${
                  isSelected ? 'ring-2 ring-primary border-primary' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <Checkbox
                        id={`template-${template.id}`}
                        checked={isSelected}
                        onCheckedChange={() => handleToggleSelect(template.id)}
                        className="mt-1"
                      />
                      <CardTitle className="text-base truncate flex-1">
                        {template.name}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => handleEdit(template)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {template.content}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{template.platform}</Badge>
                    {template.category && (
                      <Badge variant="secondary">{template.category}</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Used {template.usageCount} times
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update your message template. Variables can be added using curly braces (e.g., {'{firstName}'})
            </DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={editingTemplate.name}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, name: e.target.value })
                  }
                  placeholder="Enter template name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Message Content</Label>
                <Textarea
                  id="content"
                  value={editingTemplate.content}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, content: e.target.value })
                  }
                  placeholder="Enter message content"
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Use variables like {'{firstName}'}, {'{lastName}'}, or {'{email}'} for personalization
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Select
                    value={editingTemplate.platform}
                    onValueChange={(value) =>
                      setEditingTemplate({ ...editingTemplate, platform: value })
                    }
                  >
                    <SelectTrigger id="platform">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MESSENGER">Messenger</SelectItem>
                      <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category (Optional)</Label>
                  <Input
                    id="category"
                    value={editingTemplate.category || ''}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, category: e.target.value })
                    }
                    placeholder="e.g., Welcome, Follow-up"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recommendedTag">Recommended Tag (Optional)</Label>
                <Select
                  value={editingTemplate.recommendedTag || 'none'}
                  onValueChange={(value) =>
                    setEditingTemplate({
                      ...editingTemplate,
                      recommendedTag: value === 'none' ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger id="recommendedTag">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="CONFIRMED_EVENT_UPDATE">Confirmed Event Update</SelectItem>
                    <SelectItem value="POST_PURCHASE_UPDATE">Post-Purchase Update</SelectItem>
                    <SelectItem value="ACCOUNT_UPDATE">Account Update</SelectItem>
                    <SelectItem value="HUMAN_AGENT">Human Agent</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Message tags help bypass the 24-hour messaging window on Facebook
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingTemplate(null)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedCount} template
              {selectedCount !== 1 ? 's' : ''}. This action cannot be undone.
            </AlertDialogDescription>
            {selectedCount > 0 && (
              <div className="mt-4 space-y-2">
                <p className="font-semibold text-sm">Selected templates:</p>
                <ul className="list-disc list-inside text-sm max-h-32 overflow-y-auto">
                  {Array.from(selectedTemplates)
                    .slice(0, 10)
                    .map((id) => {
                      const template = templates.find((t) => t.id === id);
                      return template ? (
                        <li key={id}>
                          {template.name}
                          {template.usageCount > 0 && (
                            <span className="text-yellow-600 ml-2">
                              (used {template.usageCount} time{template.usageCount !== 1 ? 's' : ''})
                            </span>
                          )}
                        </li>
                      ) : null;
                    })}
                  {selectedCount > 10 && (
                    <li className="text-muted-foreground">
                      ...and {selectedCount - 10} more
                    </li>
                  )}
                </ul>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : `Delete ${selectedCount} Template${selectedCount !== 1 ? 's' : ''}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

