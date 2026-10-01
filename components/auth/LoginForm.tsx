'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Plane } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginForm() {
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center space-y-4 pb-2">
        <div className="flex justify-center">
          <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Plane className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div>
          <CardTitle className="text-2xl">Welcome to ApplyPilot</CardTitle>
          <CardDescription className="mt-2">
            AI-powered job application assistant.
            <br />
            Apply smarter, land faster.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <Button
          className="w-full gap-3 h-11"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {loading ? 'Signing in...' : 'Continue with Google'}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          By signing in, you agree to our{' '}
          <a href="/terms" className="underline hover:text-foreground">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </a>
          .
        </p>

        <div className="border-t pt-4 space-y-2">
          <p className="text-xs font-medium text-center text-muted-foreground">What you get:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            {[
              '🤖 AI extracts recruiter email from any job post',
              '📄 Tailored resume chosen + tweaked by AI',
              '✉️ Human-sounding email written in seconds',
              '📬 Sent from your own Gmail — replies come back to you',
              '📊 Track every application in one pipeline',
            ].map((item) => (
              <li key={item} className="flex items-start gap-1">
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
