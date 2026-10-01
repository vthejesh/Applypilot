'use client';

import Link from 'next/link';
import { Plane, Zap, Shield, Mail, FileText, CheckCircle2, ArrowRight, Sparkles, BarChart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navigation */}
      <header className="border-b sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Plane className="h-5 w-5" />
            </div>
            ApplyPilot
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/login">
              <Button className="gap-2">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 md:py-28 text-center px-4">
          <div className="container mx-auto max-w-4xl space-y-6">
            <Badge variant="outline" className="px-3 py-1 text-sm border-primary/30 text-primary gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> AI Job Application Assistant for Students & Freshers
            </Badge>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-balance leading-tight">
              Paste a Job Post. <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                We Extract, Tailor & Send.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              ApplyPilot finds the recruiter's email, matches your best resume, crafts a human-sounding email, and sends it directly from your own Gmail after your approval.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link href="/login">
                <Button size="lg" className="h-12 px-8 text-base gap-2">
                  Launch ApplyPilot Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                  See How It Works
                </Button>
              </a>
            </div>

            <p className="text-xs text-muted-foreground">
              ⚡ No scraping &bull; 100% human-approved sends &bull; No fake resume data
            </p>
          </div>
        </section>

        {/* 3-Step Flow */}
        <section id="how-it-works" className="py-16 bg-muted/40 border-y">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">How ApplyPilot Works</h2>
              <p className="text-muted-foreground mt-2">From job post to sent application in under 60 seconds.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="relative border shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 font-bold">
                    1
                  </div>
                  <h3 className="text-xl font-bold">Paste or Upload</h3>
                  <p className="text-sm text-muted-foreground">
                    Drop a LinkedIn post, hiring screenshot, flyer, or PDF. AI extracts the recruiter's email, requirements, and special application rules.
                  </p>
                </CardContent>
              </Card>

              <Card className="relative border shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 font-bold">
                    2
                  </div>
                  <h3 className="text-xl font-bold">Pick & Draft</h3>
                  <p className="text-sm text-muted-foreground">
                    ApplyPilot selects your best resume, checks email validity, flags scams, and drafts a warm, personalized email using ONLY your genuine background.
                  </p>
                </CardContent>
              </Card>

              <Card className="relative border shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center text-green-600 font-bold">
                    3
                  </div>
                  <h3 className="text-xl font-bold">Approve & Send</h3>
                  <p className="text-sm text-muted-foreground">
                    Preview everything, edit if desired, and click Send. Sent from your own Gmail inbox with random delays so replies land straight in your threads.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-20">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold">Built for Real Results, Not Spam</h2>
              <p className="text-muted-foreground mt-2">Every feature is designed to protect your reputation and maximize interview invites.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Shield, title: 'Scam & Red Flag Radar', desc: 'Detects registration fee scams, fake recruiter emails, and unpaid masquerading positions.' },
                { icon: Zap, title: 'Smart Match Scoring', desc: 'Calculates ATS alignment, highlights your strengths, and spots missing skill gaps.' },
                { icon: Mail, title: 'Gmail OAuth Integration', desc: 'Emails are dispatched from your account; responses automatically update your tracking board.' },
                { icon: FileText, title: 'Multi-Resume Manager', desc: 'Store separate Frontend, Backend, or Data resumes. AI auto-routes the most relevant version.' },
                { icon: BarChart, title: 'Kanban Pipeline & Metrics', desc: 'Track applied, replied, and interview stages with visual response rates and statistics.' },
                { icon: Users, title: 'Contacts & Follow-Up Reminders', desc: 'Keep track of recruiter interactions with automated polite follow-up suggestions.' },
              ].map((f, i) => {
                const Icon = f.icon;
                return (
                  <Card key={i}>
                    <CardContent className="p-6 space-y-2">
                      <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary mb-3">
                        <Icon className="h-4 w-4" />
                      </div>
                      <h4 className="font-semibold text-lg">{f.title}</h4>
                      <p className="text-sm text-muted-foreground">{f.desc}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 bg-card text-xs text-muted-foreground">
        <div className="container mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Plane className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">ApplyPilot</span> &copy; 2026. All rights reserved.
          </div>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:underline">Terms</Link>
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/responsible-use" className="hover:underline">Responsible Use</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
