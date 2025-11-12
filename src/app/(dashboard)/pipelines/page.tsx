'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, GitBranch } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Pipeline {
  id: string;
  name: string;
  description?: string;
  color: string;
  stages: Array<{
    id: string;
    name: string;
    _count: {
      contacts: number;
    };
  }>;
}

export default function PipelinesPage() {
  const router = useRouter();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPipelines();
  }, []);

  const fetchPipelines = async () => {
    try {
      const response = await fetch('/api/pipelines');
      const data = await response.json();
      if (response.ok) {
        setPipelines(data);
      }
    } catch (error) {
      console.error('Error fetching pipelines:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pipelines</h1>
          <p className="text-muted-foreground mt-2">
            Manage your sales and support pipelines
          </p>
        </div>

        <Button onClick={() => router.push('/pipelines/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Pipeline
        </Button>
      </div>

      {pipelines.length === 0 ? (
        <EmptyState
          icon={<GitBranch className="h-12 w-12" />}
          title="No pipelines yet"
          description="Create a pipeline to track contacts through stages"
          action={{
            label: 'Create Pipeline',
            onClick: () => router.push('/pipelines/new'),
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pipelines.map((pipeline) => {
            const totalContacts = pipeline.stages.reduce(
              (sum, stage) => sum + stage._count.contacts,
              0
            );
            return (
              <Link key={pipeline.id} href={`/pipelines/${pipeline.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: pipeline.color }}
                      />
                      <CardTitle className="text-lg">{pipeline.name}</CardTitle>
                    </div>
                    {pipeline.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {pipeline.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {pipeline.stages.length} stages
                      </span>
                      <Badge variant="secondary">{totalContacts} contacts</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

