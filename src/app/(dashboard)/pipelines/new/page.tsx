'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PIPELINE_TEMPLATES } from '@/lib/pipelines/templates';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function NewPipelinePage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!selectedTemplate) return;

    setCreating(true);
    const template = PIPELINE_TEMPLATES[selectedTemplate as keyof typeof PIPELINE_TEMPLATES];

    try {
      const response = await fetch('/api/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          color: template.color,
          stages: template.stages,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Pipeline created successfully');
        router.push(`/pipelines/${data.id}`);
      } else {
        toast.error('Failed to create pipeline');
      }
    } catch (error) {
      console.error('Create pipeline error:', error);
      toast.error('An error occurred');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Create Pipeline</h1>
        <p className="text-muted-foreground mt-2">
          Choose a template to get started quickly
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(PIPELINE_TEMPLATES).map(([key, template]) => (
          <Card
            key={key}
            className={`cursor-pointer transition-all ${
              selectedTemplate === key
                ? 'border-primary ring-2 ring-primary'
                : 'hover:border-primary/50'
            }`}
            onClick={() => setSelectedTemplate(key)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="text-3xl">{template.icon}</div>
                {selectedTemplate === key && (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                )}
              </div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {template.stages.length} stages
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Stages</CardTitle>
            <CardDescription>Preview of the stages in this pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {PIPELINE_TEMPLATES[selectedTemplate as keyof typeof PIPELINE_TEMPLATES].stages.map(
                (stage, index) => (
                  <div
                    key={index}
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: `${stage.color}20`,
                      color: stage.color,
                    }}
                  >
                    {stage.name}
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.push('/pipelines')}>
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          disabled={!selectedTemplate || creating}
          className="flex-1"
        >
          {creating ? 'Creating...' : 'Create Pipeline'}
        </Button>
      </div>
    </div>
  );
}

