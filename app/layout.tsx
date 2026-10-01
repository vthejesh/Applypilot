import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'ApplyPilot — AI Job Application Assistant',
    template: '%s | ApplyPilot',
  },
  description:
    'AI-powered job application assistant. Paste a job post, get a tailored email, attach your best resume, and send — all with one click.',
  keywords: ['job application', 'AI', 'resume', 'email', 'job search', 'career'],
  authors: [{ name: 'ApplyPilot' }],
  creator: 'ApplyPilot',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://applypilot.vercel.app',
    title: 'ApplyPilot — AI Job Application Assistant',
    description: 'Apply smarter, not harder. Let AI handle your job applications.',
    siteName: 'ApplyPilot',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ApplyPilot — AI Job Application Assistant',
    description: 'Apply smarter, not harder.',
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased min-h-screen bg-background text-foreground`}
      >
        <SessionProvider>
          <QueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster richColors position="top-right" />
            </ThemeProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
