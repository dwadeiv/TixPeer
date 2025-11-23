/**
 * Email Verification Page
 * Handles email verification when user clicks link from email
 *
 * Features:
 * - Automatically verifies email on page load using token from URL
 * - Shows success/error states with visual feedback
 * - Auto-redirects to login page after successful verification
 * - Handles expired/invalid tokens gracefully
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      // No token provided in URL
      if (!token) {
        setStatus('error');
        setErrorMessage('No verification token provided. Please check your email for the correct link.');
        return;
      }

      try {
        // Call backend verification endpoint
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/auth/verify-email?token=${token}`);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Verification failed');
        }

        const data = await response.json();
        setStatus('success');

        // Auto-redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } catch (error: any) {
        setStatus('error');
        setErrorMessage(error.message || 'Failed to verify email. The link may be expired or invalid.');
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 px-4 py-12">
      <Card className="w-full max-w-md p-8">
        {/* Loading State */}
        {status === 'loading' && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-purple-100 p-4 rounded-full">
                <Loader2 className="size-12 text-purple-600 animate-spin" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">Verifying Your Email</h1>
            <p className="text-slate-600">Please wait while we verify your email address...</p>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle className="size-12 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2 text-green-900">Email Verified!</h1>
            <p className="text-slate-600 mb-6">
              Your email has been successfully verified. You can now log in to your account.
            </p>
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                Redirecting to login page in 3 seconds...
              </p>
            </div>
            <Link href="/login" className="w-full">
              <Button className="w-full">
                Go to Login Now
              </Button>
            </Link>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 p-4 rounded-full">
                <AlertCircle className="size-12 text-red-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2 text-red-900">Verification Failed</h1>
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                The verification link may have expired or is invalid.
              </p>
              <Link href="/verify-email-pending" className="w-full block">
                <Button className="w-full">
                  Resend Verification Email
                </Button>
              </Link>
              <Link href="/login" className="w-full block">
                <Button variant="outline" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
