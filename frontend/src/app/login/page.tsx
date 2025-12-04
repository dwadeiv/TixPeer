/**
 * Login Page
 * Secure user authentication with bot protection
 *
 * Security Features:
 * - Honeypot field to catch bots (invisible field that bots fill out)
 * - Password fields are never exposed
 * - HTTPS-only in production (via backend)
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Ticket, Lock, Mail, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Bot trap field
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Get redirect URL from query parameters (set by protected pages)
  const [redirectPath, setRedirectPath] = useState('/profile');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect) {
      setRedirectPath(redirect);
    }
  }, []);

  // Only redirect if authenticated AND auth has finished loading
  // This prevents redirect loops when token is invalid
  useEffect(() => {
    if (!authLoading && isAuthenticated && shouldRedirect) {
      router.push(redirectPath);
    }
  }, [isAuthenticated, authLoading, shouldRedirect, redirectPath, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Bot protection: Check honeypot field (should be empty)
    // Bots typically auto-fill all fields, including hidden ones
    if (honeypot) {
      console.warn('Bot detected: honeypot filled');
      return;
    }

    // Validate inputs
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      await login(email, password);
      // Set flag to allow redirect after successful login
      setShouldRedirect(true);
      router.push(redirectPath);
    } catch (err: any) {
      // Check if the error is about email verification
      if (err.message && err.message.includes('verify your email')) {
        // Store email in session storage so the waiting page can use it
        sessionStorage.setItem('pendingVerificationEmail', email);
        router.push('/verify-email-pending');
      } else {
        setError(err.message || 'Invalid email or password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 px-4 py-12">
      <Card className="w-full max-w-md p-8">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-3 rounded-2xl">
              <Ticket className="size-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
          <p className="text-slate-600">Sign in to your TixPeer account</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-slate-400" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* Honeypot Field - Hidden from users, catches bots */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        {/* Register Link */}
        <div className="mt-6 text-center text-sm">
          <span className="text-slate-600">Don&apos;t have an account? </span>
          <Link href="/register" className="text-purple-600 hover:text-purple-700 font-medium">
            Create Account
          </Link>
        </div>
      </Card>
    </div>
  );
}
