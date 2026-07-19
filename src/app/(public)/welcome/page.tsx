'use client'

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Zap, Clock, Mail, CheckCircle2, Flame, Sparkles, BarChart3, Code, User } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <header className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">ApplyFast</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button size="sm">Sign in with GitHub</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col">
        <section className="flex flex-col items-center justify-center px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground mb-6">
            <Zap className="h-3 w-3" />
            Apply in under 15 seconds
          </div>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl text-balance">
            Stop wasting time on job application emails
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Set up your profile once. Then apply to any job with one click  ApplyFast generates the email, attaches your resume, and sends it.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/sign-in">
              <Button size="lg">Start applying faster</Button>
            </Link>
          </div>
        </section>

        {/* Steps Section */}
        <section className="flex flex-col items-center px-6 py-12">
          <div className="w-full max-w-5xl">
            <div className="grid max-w-5xl mx-auto grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                {
                  icon: CheckCircle2,
                  title: "1. Set up your profile",
                  desc: "Add your name, links, and resume once. That's it.",
                },
                {
                  icon: Mail,
                  title: "2. Enter job details",
                  desc: "Company name, email, role. Takes 15 seconds.",
                },
                {
                  icon: Clock,
                  title: "3. Hit send",
                  desc: "ApplyFast generates and sends the email with your resume attached.",
                },
              ].map((step) => {
                const Icon = step.icon;
                return (
                  <Card key={step.title} className="p-5 border border-border hover:border-primary/50 transition-colors">
                    <Icon className="mb-3 h-5 w-5 text-primary" />
                    <h3 className="mb-1 text-sm font-semibold">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features Bento Grid Section */}
        <section className="flex flex-col items-center px-6 py-20">
          <div className="w-full max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight mb-3 text-balance">Why ApplyFast?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Built for developers who value their time and want to apply smarter, not harder.
              </p>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Large Card - Full Width */}
              <Card className="md:col-span-3 p-6 border border-border hover:border-primary/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Flame className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
                    <p className="text-sm text-muted-foreground">
                      One-click applications that would normally take 5 minutes. Save hours every week by automating repetitive email writing and resume attachments.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Small Card */}
              <Card className="p-6 border border-border hover:border-primary/50 transition-colors">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">Track Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    See all your applications in one place with stats and follow-up reminders.
                  </p>
                </div>
              </Card>

              {/* Small Card */}
              <Card className="p-6 border border-border hover:border-primary/50 transition-colors">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">Smart Templates</h3>
                  <p className="text-sm text-muted-foreground">
                    AI-powered email templates that personalize with company and role details.
                  </p>
                </div>
              </Card>

              {/* Small Card */}
              <Card className="p-6 border border-border hover:border-primary/50 transition-colors">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">Auto-Send</h3>
                  <p className="text-sm text-muted-foreground">
                    Generate and send professional emails directly without leaving the app.
                  </p>
                </div>
              </Card>

             
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="flex flex-col items-center px-6 py-16">
          <div className="w-full max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-4 text-balance">Ready to apply faster?</h2>
            <p className="text-muted-foreground mb-8">
              Join other developers who are saving hours on job applications every week.
            </p>
            <Link href="/sign-in">
              <Button size="lg" className="gap-2">
                <Zap className="h-4 w-4" />
                Get Started Free
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-center px-6">
          <p className="text-xs text-muted-foreground under">
            Built by{" "}
            <a
              href="https://farooqx.in"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline"
            >
              Umar Farooq
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
