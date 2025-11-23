/**
 * Email Verification Page
 * Handles email verification via token in URL query parameter
 * Shows success/error states and allows resending verification email
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ticket, CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await axios.get(`${API_URL}/auth/verify-email`, {
        params: { token: verificationToken },
      });

      setStatus('success');
      setMessage(response.data.message || 'Email verified successfully!');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      setStatus('error');
      setMessage(
        error.response?.data?.message ||
        'Verification failed. The link may have expired or is invalid.'
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 px-4 py-12">
      <Card className="w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-3 rounded-2xl">
            <Ticket className="size-8 text-white" />
          </div>
        </div>

        {/* Verifying State */}
        {status === 'verifying' && (
          <div className="text-center">
            <Loader2 className="size-12 text-purple-600 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Verifying your email...</h1>
            <p className="text-slate-600">Please wait while we confirm your email address</p>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="text-center">
            <div className="bg-green-100 rounded-full p-3 w-fit mx-auto mb-4">
              <CheckCircle className="size-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-green-900">Email Verified!</h1>
            <p className="text-slate-600 mb-6">{message}</p>
            <p className="text-sm text-slate-500 mb-6">
              Redirecting you to login in a moment...
            </p>
            <Link href="/login">
              <Button className="w-full">
                Go to Login
              </Button>
            </Link>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="text-center">
            <div className="bg-red-100 rounded-full p-3 w-fit mx-auto mb-4">
              <XCircle className="size-12 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-red-900">Verification Failed</h1>
            <p className="text-slate-600 mb-6">{message}</p>

            <div className="space-y-3">
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Go to Login
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" className="w-full">
                  <Mail className="size-4 mr-2" />
                  Create New Account
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
