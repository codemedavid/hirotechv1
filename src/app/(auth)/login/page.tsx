'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('[Login] Attempting sign in...');
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/dashboard',
      });

      console.log('[Login] SignIn result:', result);

      if (result?.error) {
        console.error('[Login] Error:', result.error);
        setError('Invalid email or password');
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        console.log('[Login] Success! Redirecting...');
        // Force a hard redirect to ensure cookies are picked up
        window.location.href = '/dashboard';
      } else {
        setError('Login failed. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('[Login] Exception:', error);
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-border/50 shadow-xl backdrop-blur-sm">
      <CardHeader className="space-y-2 pb-6">
        <CardTitle className="text-3xl font-bold tracking-tight">Welcome back</CardTitle>
        <CardDescription className="text-base">
          Enter your credentials to access your account
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
              disabled={isLoading}
              className="h-11 rounded-xl border-border/50 focus-visible:ring-primary/30"
            />
          </div>

          <Button type="submit" className="w-full h-11 rounded-xl shadow-sm hover:shadow-md transition-all" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

