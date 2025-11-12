'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Link from 'next/link';

interface Contact {
  id: string;
  firstName: string;
  lastName?: string;
  profilePicUrl?: string;
  leadScore: number;
  tags: string[];
}

interface Stage {
  id: string;
  name: string;
  color: string;
  type: string;
  contacts: Contact[];
  _count: {
    contacts: number;
  };
}

interface Pipeline {
  id: string;
  name: string;
  description?: string;
  color: string;
  stages: Stage[];
}

export default function PipelinePage() {
  const params = useParams();
  const router = useRouter();
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPipeline = async () => {
    try {
      const response = await fetch(`/api/pipelines/${params.id}`);
      const data = await response.json();
      if (response.ok) {
        setPipeline(data);
      }
    } catch (error) {
      console.error('Error fetching pipeline:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline().catch(console.error);
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!pipeline) {
    return <div>Pipeline not found</div>;
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.push('/pipelines')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Pipelines
      </Button>

      <div>
        <h1 className="text-3xl font-bold">{pipeline.name}</h1>
        {pipeline.description && (
          <p className="text-muted-foreground mt-2">{pipeline.description}</p>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {pipeline.stages.map((stage) => (
          <div key={stage.id} className="flex-shrink-0 w-80">
            <Card className="h-full">
              <CardHeader
                className="pb-3 border-t-2"
                style={{ borderTopColor: stage.color }}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{stage.name}</CardTitle>
                  <Badge variant="secondary">{stage._count.contacts}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {stage.contacts.map((contact) => (
                  <Link key={contact.id} href={`/contacts/${contact.id}`}>
                    <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={contact.profilePicUrl} />
                          <AvatarFallback>
                            {contact.firstName[0]}
                            {contact.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {contact.firstName} {contact.lastName}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {contact.leadScore}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
                {stage.contacts.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No contacts in this stage
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

