/**
 * Email Verification Pending Page
 * Displayed when user tries to login without verifying email
 *
 * Features:
 * - Shows verification instructions
 * - Displays the email that needs verification
 * - Allows resending verification email
 * - Auto-redirects after successful verification
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';

export default function VerifyEmailPendingPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState('');

  // Get email from session storage on mount
  useEffect(() => {
    const pendingEmail = sessionStorage.getItem('pendingVerificationEmail');
    if (pendingEmail) {
      setEmail(pendingEmail);
    } else {
      // If no email in session storage, redirect to login
      router.push('/login');
    }
  }, [router]);

  /**
   * Resends verification email to the user
   */
  const handleResendEmail = async () => {
    if (!email) return;

    try {
      setIsResending(true);
      setError('');
      setResendSuccess(false);

      await api.resendVerificationEmail(email);

      setResendSuccess(true);
      // Clear success message after 5 seconds
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 px-4 py-12">
      <Card className="w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-purple-100 p-4 rounded-full">
              <Mail className="size-12 text-purple-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Verify Your Email</h1>
          <p className="text-slate-600">
            We've sent a verification link to your email address
          </p>
        </div>

        {/* Email Display */}
        {email && (
          <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">Verification email sent to:</p>
            <p className="font-medium text-slate-900">{email}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="mb-6 space-y-3 text-sm text-slate-600">
          <p className="flex items-start gap-2">
            <span className="text-purple-600 font-bold mt-0.5">1.</span>
            <span>Check your inbox for an email from TixPeer</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-purple-600 font-bold mt-0.5">2.</span>
            <span>Click the verification link in the email</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-purple-600 font-bold mt-0.5">3.</span>
            <span>You'll be redirected to login automatically</span>
          </p>
        </div>

        {/* Success Message */}
        {resendSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900">Email sent!</p>
              <p className="text-sm text-green-700 mt-1">
                Check your inbox for the verification link
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Resend Button */}
        <div className="space-y-4">
          <Button
            onClick={handleResendEmail}
            disabled={isResending}
            className="w-full"
            variant="outline"
          >
            {isResending ? 'Sending...' : 'Resend Verification Email'}
          </Button>

          {/* Help Text */}
          <div className="text-center text-sm text-slate-600">
            <p>Didn't receive the email? Check your spam folder</p>
          </div>

          {/* Back to Login Link */}
          <div className="pt-4 border-t">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              <ArrowLeft className="size-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
