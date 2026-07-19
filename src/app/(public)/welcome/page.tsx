import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap, Clock, Mail, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
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
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground mb-6">
          <Zap className="h-3 w-3" />
          Apply in under 15 seconds
        </div>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Stop wasting time on job application emails
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Set up your profile once. Then apply to any job with one click — ApplyFast generates the email, attaches your resume, and sends it.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/sign-in">
            <Button size="lg">Start applying faster</Button>
          </Link>
        </div>

        {/* Steps */}
        <div className="mt-20 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3 text-left">
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
              <div key={step.title} className="rounded-lg border border-border p-5">
                <Icon className="mb-3 h-5 w-5 text-primary" />
                <h3 className="mb-1 text-sm font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </main>
      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-center px-6">
          <p className="text-xs text-muted-foreground">
            Built by{" "}
            <a
              href="https://farooqx.in"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:underline"
            >
              Umar Farooq
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
