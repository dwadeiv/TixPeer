/**
 * Registration Page
 * Secure user account creation with validation and bot protection
 *
 * Security Features:
 * - Password strength validation
 * - Honeypot field to catch bots (invisible field that bots fill out)
 * - Email validation
 * - Passwords hashed on backend (bcrypt)
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Ticket, Lock, Mail, User as UserIcon, AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/profile');
    }
  }, [isAuthenticated, router]);

  // Password strength checker
  const getPasswordStrength = (pwd: string): { score: number; text: string; color: string } => {
    if (!pwd) return { score: 0, text: '', color: '' };

    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score, text: 'Weak', color: 'text-red-600' };
    if (score <= 3) return { score, text: 'Fair', color: 'text-orange-600' };
    if (score <= 4) return { score, text: 'Good', color: 'text-blue-600' };
    return { score, text: 'Strong', color: 'text-green-600' };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleResendVerification = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registeredEmail }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to resend verification email');
      }

      // Show success message briefly
      alert('Verification email sent! Please check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email');
    } finally {
      setIsLoading(false);
    }
  };

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
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordStrength.score < 2) {
      setError('Please choose a stronger password');
      return;
    }

    try {
      setIsLoading(true);
      await register(email, password, name);
      // Show success message instead of redirecting
      setRegisteredEmail(email);
      setRegistrationSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Email may already be in use.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show success view after registration
  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 px-4 py-12">
        <Card className="w-full max-w-md p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-3 rounded-2xl">
              <Ticket className="size-8 text-white" />
            </div>
          </div>

          {/* Success State */}
          <div className="text-center">
            <div className="bg-green-100 rounded-full p-3 w-fit mx-auto mb-4">
              <CheckCircle className="size-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-green-900">Account Created!</h1>
            <p className="text-slate-600 mb-6">
              We&apos;ve sent a verification email to <strong>{registeredEmail}</strong>
            </p>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Mail className="size-4" />
                Next Steps
              </h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Check your email inbox for the verification link</li>
                <li>Click the link to verify your email address</li>
                <li>Return to login and access your account</li>
              </ol>
              <p className="text-xs text-blue-700 mt-3">
                💡 Don&apos;t see the email? Check your spam/junk folder
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Link href="/login">
                <Button className="w-full">
                  Go to Login
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResendVerification}
                disabled={isLoading}
              >
                <Mail className="size-4 mr-2" />
                {isLoading ? 'Sending...' : 'Resend Verification Email'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold mb-2">Create Account</h1>
          <p className="text-slate-600">Join TixPeer and start trading tickets</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Input */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-slate-700">
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-slate-400" />
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
                required
                autoComplete="name"
              />
            </div>
          </div>

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
                autoComplete="new-password"
              />
            </div>
            {/* Password Strength Indicator */}
            {password && (
              <div className="flex items-center gap-2 text-sm">
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      passwordStrength.score <= 2
                        ? 'bg-red-500'
                        : passwordStrength.score <= 3
                        ? 'bg-orange-500'
                        : passwordStrength.score <= 4
                        ? 'bg-blue-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
                <span className={`font-medium ${passwordStrength.color}`}>
                  {passwordStrength.text}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-slate-400" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
                required
                autoComplete="new-password"
              />
              {confirmPassword && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {password === confirmPassword ? (
                    <CheckCircle className="size-4 text-green-600" />
                  ) : (
                    <AlertCircle className="size-4 text-red-600" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Honeypot Field */}
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
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center text-sm">
          <span className="text-slate-600">Already have an account? </span>
          <Link href="/login" className="text-purple-600 hover:text-purple-700 font-medium">
            Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
}
