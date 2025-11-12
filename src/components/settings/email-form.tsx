'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required to change email'),
});

type EmailFormData = z.infer<typeof emailSchema>;

interface EmailFormProps {
  currentEmail: string;
}

export function EmailForm({ currentEmail }: EmailFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: currentEmail,
    },
  });

  const onSubmit = async (data: EmailFormData) => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/user/email', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update email');
      }

      toast.success('Email updated successfully. Please sign in again with your new email.');
      reset();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentEmail">Current Email</Label>
        <Input
          id="currentEmail"
          type="email"
          value={currentEmail}
          disabled
          className="bg-muted"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">New Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your new email address"
          {...register('email')}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Confirm Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password to confirm"
          {...register('password')}
          disabled={isLoading}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
        <p className="text-sm text-muted-foreground">
          For security, please enter your password to change your email
        </p>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Update Email
      </Button>
    </form>
  );
}
