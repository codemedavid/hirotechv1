import { ReactNode } from 'react';
import { Button } from './button';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-md">{description}</p>
      )}
      {action && (
        <>
          {action.href ? (
            <Button asChild className="mt-4">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button onClick={action.onClick} className="mt-4">
              {action.label}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

