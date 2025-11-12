'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          organizationName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        setIsLoading(false);
        return;
      }

      // Auto-login after registration
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Account created but login failed. Please try logging in.');
        setIsLoading(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Registration error:', error);
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-border/50 shadow-xl backdrop-blur-sm">
      <CardHeader className="space-y-2 pb-6">
        <CardTitle className="text-3xl font-bold tracking-tight">Create an account</CardTitle>
        <CardDescription className="text-base">
          Enter your information to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200/50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="space-y-2.5">
            <Label htmlFor="organizationName" className="text-sm font-semibold">Organization Name</Label>
            <Input
              id="organizationName"
              type="text"
              placeholder="Acme Inc."
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              required
              disabled={isLoading}
              className="h-11 rounded-xl border-border/50 focus-visible:ring-primary/30"
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="name" className="text-sm font-semibold">Your Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
              className="h-11 rounded-xl border-border/50 focus-visible:ring-primary/30"
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="h-11 rounded-xl border-border/50 focus-visible:ring-primary/30"
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={isLoading}
              className="h-11 rounded-xl border-border/50 focus-visible:ring-primary/30"
            />
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters long
            </p>
          </div>

          <Button type="submit" className="w-full h-11 rounded-xl shadow-sm hover:shadow-md transition-all" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

