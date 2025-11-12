'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Upload, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  image: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  user: {
    id: string;
    name?: string;
    email: string;
    image?: string;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(user.image || '');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || '',
      image: user.image || '',
    },
  });

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleImageUrlChange = (url: string) => {
    setPreviewImage(url);
    setValue('image', url);
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      toast.success('Profile updated successfully');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Profile Photo */}
      <div className="flex items-center gap-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src={previewImage} alt={user.name || 'User'} />
          <AvatarFallback className="text-2xl bg-primary/10 text-primary">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Label htmlFor="image">Profile Photo URL</Label>
          <div className="flex gap-2">
            <Input
              id="image"
              placeholder="https://example.com/photo.jpg"
              {...register('image')}
              onChange={(e) => handleImageUrlChange(e.target.value)}
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={isLoading}
              onClick={() => {
                const url = prompt('Enter image URL:');
                if (url) {
                  handleImageUrlChange(url);
                }
              }}
            >
              <Upload className="h-4 w-4" />
            </Button>
          </div>
          {errors.image && (
            <p className="text-sm text-destructive">{errors.image.message}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Enter a URL to your profile photo or use an image hosting service
          </p>
        </div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          placeholder="Enter your full name"
          {...register('name')}
          disabled={isLoading}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Email (read-only, shown for reference) */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={user.email}
          disabled
          className="bg-muted"
        />
        <p className="text-sm text-muted-foreground">
          To change your email, use the email change form below
        </p>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Changes
      </Button>
    </form>
  );
}

