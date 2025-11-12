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
import { Layers } from 'lucide-react';
import { useQueryState } from 'nuqs';

interface Stage {
  id: string;
  name: string;
  color: string;
}

interface Pipeline {
  id: string;
  name: string;
  stages: Stage[];
}

interface StageFilterProps {
  pipelines: Pipeline[];
}

export function StageFilter({ pipelines }: StageFilterProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [stageId, setStageId] = useQueryState('stageId', {
    defaultValue: '',
    shallow: false,
  });

  function handleStageChange(value: string) {
    startTransition(() => {
      setStageId(value || null);
      router.refresh();
    });
  }

  // Find the selected stage across all pipelines
  let selectedStage: Stage | undefined;
  let selectedPipeline: Pipeline | undefined;
  for (const pipeline of pipelines) {
    const stage = pipeline.stages.find((s) => s.id === stageId);
    if (stage) {
      selectedStage = stage;
      selectedPipeline = pipeline;
      break;
    }
  }

  const hasStages = pipelines.some((p) => p.stages.length > 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isPending}>
          <Layers className="h-4 w-4 mr-2" />
          {selectedStage ? selectedStage.name : 'All Stages'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Filter by Stage</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleStageChange('')}>
          <div className="flex items-center w-full">
            All Stages
            {!stageId && (
              <Badge variant="secondary" className="ml-auto text-xs">
                Active
              </Badge>
            )}
          </div>
        </DropdownMenuItem>

        {!hasStages ? (
          <div className="px-2 py-4 text-sm text-muted-foreground text-center">
            No stages available
          </div>
        ) : (
          <>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {pipelines.map((pipeline) => (
                <div key={pipeline.id}>
                  <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1.5">
                    {pipeline.name}
                  </DropdownMenuLabel>
                  {pipeline.stages.map((stage) => (
                    <DropdownMenuItem
                      key={stage.id}
                      onClick={() => handleStageChange(stage.id)}
                    >
                      <div className="flex items-center w-full">
                        <div
                          className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                          style={{ backgroundColor: stage.color }}
                        />
                        <span className="flex-1 truncate">{stage.name}</span>
                        {stageId === stage.id && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

