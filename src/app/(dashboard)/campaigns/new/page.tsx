'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MESSAGE_TAGS } from '@/lib/facebook/message-tags';

export default function NewCampaignPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('MESSENGER');
  const [messageTag, setMessageTag] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [tags, setTags] = useState<Array<{ id: string; name: string; color: string; contactCount: number }>>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [facebookPages, setFacebookPages] = useState<Array<{ id: string; pageName: string; platform: string }>>([]);
  const [selectedPageId, setSelectedPageId] = useState('');
  const [creating, setCreating] = useState(false);
  const [loadingPages, setLoadingPages] = useState(true);

  useEffect(() => {
    fetchTags();
    fetchFacebookPages();
    const preselectedTags = searchParams.get('tags');
    if (preselectedTags) {
      setSelectedTags([preselectedTags]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags');
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }
      
      const data = await response.json();
      if (response.ok) {
        setTags(data);
      } else {
        toast.error(data.error || 'Failed to fetch tags');
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      const err = error as Error;
      toast.error(err.message || 'An error occurred while fetching tags');
    }
  };

  const fetchFacebookPages = async () => {
    setLoadingPages(true);
    try {
      const response = await fetch('/api/facebook/pages/connected');
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }
      
      const data = await response.json();
      if (response.ok && data.pages) {
        setFacebookPages(data.pages);
        // Auto-select first page if only one exists
        if (data.pages.length === 1) {
          setSelectedPageId(data.pages[0].id);
        }
      } else {
        console.error('Failed to fetch pages:', data.error);
        toast.error(data.error || 'Failed to load Facebook pages');
      }
    } catch (error) {
      console.error('Error fetching Facebook pages:', error);
      const err = error as Error;
      toast.error(err.message || 'An error occurred while loading Facebook pages');
    } finally {
      setLoadingPages(false);
    }
  };

  const handleCreate = async () => {
    if (!name || !messageContent) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!selectedPageId) {
      toast.error('Please select a Facebook page');
      return;
    }

    if (platform === 'MESSENGER' && !messageTag) {
      toast.error('Please select a message tag for Messenger campaigns');
      return;
    }

    setCreating(true);

    try {
      // First create template
      const templateRes = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${name} Template`,
          content: messageContent,
          platform,
        }),
      });

      // Check if response is JSON
      const templateContentType = templateRes.headers.get('content-type');
      if (!templateContentType?.includes('application/json')) {
        throw new Error('Server returned non-JSON response for template');
      }

      if (!templateRes.ok) {
        const errorData = await templateRes.json();
        toast.error(errorData.error || 'Failed to create template');
        setCreating(false);
        return;
      }

      const template = await templateRes.json();

      // Create campaign - if no tags selected, target all contacts
      const campaignRes = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          platform,
          messageTag: messageTag && messageTag !== 'NONE' ? messageTag : null,
          facebookPageId: selectedPageId,
          templateId: template.id,
          targetingType: selectedTags.length === 0 ? 'ALL_CONTACTS' : 'TAGS',
          targetTags: selectedTags,
        }),
      });

      // Check if response is JSON
      const campaignContentType = campaignRes.headers.get('content-type');
      if (!campaignContentType?.includes('application/json')) {
        throw new Error('Server returned non-JSON response for campaign');
      }

      if (campaignRes.ok) {
        const campaign = await campaignRes.json();
        toast.success('Campaign created successfully');
        router.push(`/campaigns/${campaign.id}`);
      } else {
        const data = await campaignRes.json();
        toast.error(data.error || 'Failed to create campaign');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      const err = error as Error;
      toast.error(err.message || 'An error occurred while creating campaign');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Create Campaign</h1>
        <p className="text-muted-foreground text-lg">Set up a new bulk messaging campaign</p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="space-y-1.5 pb-6">
          <CardTitle className="text-2xl">Campaign Details</CardTitle>
          <p className="text-sm text-muted-foreground">Configure your campaign settings and target audience</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2.5">
            <Label className="text-sm font-semibold">Campaign Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Summer Promotion"
              className="h-11 rounded-xl border-border/50 focus-visible:ring-primary/30"
            />
          </div>

          <div className="space-y-2.5">
            <Label className="text-sm font-semibold">Facebook Page *</Label>
            <Select 
              value={selectedPageId} 
              onValueChange={setSelectedPageId}
              disabled={loadingPages || facebookPages.length === 0}
            >
              <SelectTrigger className="h-11 rounded-xl border-border/50">
                <SelectValue placeholder={
                  loadingPages 
                    ? "Loading pages..." 
                    : facebookPages.length === 0 
                      ? "No pages connected"
                      : "Select a Facebook page..."
                } />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {facebookPages.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No Facebook pages connected
                  </div>
                ) : (
                  facebookPages.map((page) => (
                    <SelectItem key={page.id} value={page.id} className="rounded-lg">
                      {page.pageName}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {!loadingPages && facebookPages.length === 0 && (
              <div className="mt-3 p-4 bg-amber-50/50 border border-amber-200/50 rounded-xl">
                <p className="text-sm text-amber-900">
                  ⚠️ No Facebook pages connected. Please connect a Facebook page in{' '}
                  <Link href="/settings/integrations" className="underline font-semibold hover:text-amber-950">
                    Settings → Integrations
                  </Link>{' '}
                  before creating a campaign.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2.5">
            <Label className="text-sm font-semibold">Platform *</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="h-11 rounded-xl border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="MESSENGER" className="rounded-lg">Facebook Messenger</SelectItem>
                <SelectItem value="INSTAGRAM" className="rounded-lg">Instagram DM</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {platform === 'MESSENGER' && (
            <div className="space-y-2.5">
              <Label className="text-sm font-semibold">Message Tag *</Label>
              <p className="text-xs text-muted-foreground">
                Required by Facebook to send messages outside 24-hour window
              </p>
              <Select value={messageTag} onValueChange={setMessageTag}>
                <SelectTrigger className="h-11 rounded-xl border-border/50">
                  <SelectValue placeholder="Select a message tag..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {Object.values(MESSAGE_TAGS).map((tag) => (
                    <SelectItem key={tag.value} value={tag.value} className="rounded-lg">
                      {tag.icon} {tag.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="NONE" className="rounded-lg text-muted-foreground">
                    ⚠️ None (Only for contacts who messaged within 24hrs)
                  </SelectItem>
                </SelectContent>
              </Select>
              {messageTag === 'NONE' && (
                <div className="mt-2 p-3 bg-amber-50/50 border border-amber-200/50 rounded-xl">
                  <p className="text-xs text-amber-900">
                    ⚠️ <strong>Warning:</strong> Messages will only be sent to contacts who messaged your page within the last 24 hours. Use a message tag to send to all contacts.
                  </p>
                </div>
              )}
              {!messageTag && (
                <div className="mt-2 p-3 bg-blue-50/50 border border-blue-200/50 rounded-xl">
                  <p className="text-xs text-blue-900">
                    ℹ️ Facebook requires message tags to send messages outside the 24-hour window. Select a tag that matches your message purpose.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2.5">
            <Label className="text-sm font-semibold">Target Audience (Optional)</Label>
            <p className="text-xs text-muted-foreground">
              Select tags to target specific contacts, or leave empty to target all contacts
            </p>
            {selectedTags.length === 0 && tags.length > 0 && (
              <div className="mt-2 p-3 bg-blue-50/50 border border-blue-200/50 rounded-xl">
                <p className="text-xs text-blue-900">
                  ℹ️ No tags selected - campaign will be sent to <strong>all contacts</strong> on the selected page
                </p>
              </div>
            )}
            <div className="mt-3 space-y-2.5">
              {tags.length === 0 ? (
                <div className="p-6 border border-dashed border-border/50 rounded-xl text-center bg-muted/20">
                  <p className="text-sm text-muted-foreground mb-2 font-medium">No tags available</p>
                  <p className="text-xs text-muted-foreground">
                    Create tags in{' '}
                    <Link href="/tags" className="underline font-semibold hover:text-foreground transition-colors">
                      Tags page
                    </Link>{' '}
                    to organize your contacts
                  </p>
                </div>
              ) : (
                tags.map((tag) => (
                  <div
                    key={tag.id}
                    className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedTags.includes(tag.name) 
                        ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20' 
                        : 'border-border/50 hover:border-primary/50 hover:bg-accent/50'
                    }`}
                    onClick={() => {
                      if (selectedTags.includes(tag.name)) {
                        setSelectedTags(selectedTags.filter((t) => t !== tag.name));
                      } else {
                        setSelectedTags([...selectedTags, tag.name]);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3.5 h-3.5 rounded-full ring-2 ring-background shadow-sm"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="font-semibold text-sm">{tag.name}</span>
                      </div>
                      <Badge variant="secondary" className="rounded-lg">{tag.contactCount} contacts</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2.5">
            <Label className="text-sm font-semibold">Message Content *</Label>
            <Textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Enter your message... Use {firstName}, {lastName} for personalization"
              rows={6}
              className="rounded-xl border-border/50 resize-none focus-visible:ring-primary/30"
            />
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
              <span className="font-medium">Available variables:</span>
              <code className="px-1.5 py-0.5 rounded bg-muted text-foreground">{'{firstName}'}</code>
              <code className="px-1.5 py-0.5 rounded bg-muted text-foreground">{'{lastName}'}</code>
              <code className="px-1.5 py-0.5 rounded bg-muted text-foreground">{'{name}'}</code>
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/campaigns')}
              className="rounded-xl h-11 px-6"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={creating || facebookPages.length === 0} 
              className="flex-1 rounded-xl h-11 shadow-sm hover:shadow-md transition-all"
            >
              {creating ? 'Creating...' : 'Create Campaign'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

