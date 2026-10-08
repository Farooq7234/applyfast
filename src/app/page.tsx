import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  Flame,
  Mail,
  MousePointerClick,
  Search,
  SendHorizontal,
  Sparkles,
  UserRound,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/navbar";

const workflowSteps = [
  {
    icon: UserRound,
    number: "01",
    title: "Set up your profile",
    description:
      "Add your contact details, portfolio links, and resume once. Reuse them every time you reach out.",
  },
  {
    icon: Search,
    number: "02",
    title: "Find the right contact",
    description:
      "Search a company domain for professional email addresses, then choose a contact to start an application.",
  },
  {
    icon: SendHorizontal,
    number: "03",
    title: "Personalize and send",
    description:
      "Review your template with the job details filled in, make edits, and send your resume with the email.",
  },
];

const featureCards = [
  {
    icon: Search,
    eyebrow: "FIND A WAY IN",
    title: "Find professional contacts",
    description:
      "Look up contacts by company domain with the combined email search, or use Hunter.io and Snov.io individually. Review the results and apply to a contact from the same flow.",
    className: "md:col-span-2",
  },
  {
    icon: Building2,
    eyebrow: "PLAN YOUR SEARCH",
    title: "Keep a list of target companies",
    description:
      "Research places you want to work and keep their contacts together on a target-company board, separate from applications you have already sent.",
    className: "",
  },
  {
    icon: FileText,
    eyebrow: "MAKE IT YOURS",
    title: "Write with reusable templates",
    description:
      "Create and manage your email templates. Personalize each message with details like the recruiter, role, company, portfolio, resume, and your name.",
    className: "",
  },
  {
    icon: BarChart3,
    eyebrow: "SEE YOUR PROGRESS",
    title: "Track every application",
    description:
      "Search your application history and check dashboard stats for sent applications, opens, clicks, failed sends, and follow-ups due.",
    className: "md:col-span-2",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex flex-1 flex-col">
        <section className="relative flex flex-col items-center overflow-hidden px-6 pb-20 pt-24 text-center sm:pb-28 sm:pt-32">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-80 max-w-4xl rounded-full bg-primary/5 blur-3xl" />
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground">
            <Zap className="h-3 w-3" />
            Less busywork. More thoughtful applications.
          </div>
          <h1 className="sm:max-w-4xl text-balance text-4xl font-bold tracking-tight sm:text-6xl">
            Your job search deserves more than another spreadsheet
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">
            Find contacts, send a personal application with your resume, and
            keep every opportunity organized. ApplyFast brings the moving parts
            of your job search together in one place.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/sign-in">
              <Button size="lg" className="gap-2">
                Start applying faster
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="gap-2">
                Explore what you can do
                <ArrowDown className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            {[
              "Reusable profile",
              "Editable email templates",
              "Application tracking",
            ].map((item) => (
              <span key={item} className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {item}
              </span>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="workflow-heading"
          className="border-y border-border bg-muted/30 px-6 py-20 sm:py-24"
        >
          <div className="mx-auto w-full max-w-5xl">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="mb-3 text-sm font-medium text-primary">
                A SIMPLE ROUTINE
              </p>
              <h2
                id="workflow-heading"
                className="text-balance text-3xl font-bold tracking-tight sm:text-4xl"
              >
                From first search to sent application
              </h2>
              <p className="mt-4 text-muted-foreground">
                Set up the essentials once, then spend less time repeating
                yourself every time you find a role worth pursuing.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {workflowSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <Card
                    key={step.number}
                    className="relative h-full border border-border p-6 transition-colors hover:border-primary/50"
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">
                        {step.number}
                      </span>
                    </div>
                    <h3 className="mb-2 font-semibold">{step.title}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {step.description}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-20 px-6 py-20 sm:py-28">
          <div className="mx-auto w-full max-w-5xl">
            <div className="mb-12 max-w-2xl">
              <p className="mb-3 text-sm font-medium text-primary">
                MORE THAN A SEND BUTTON
              </p>
              <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                The pieces of your job search, working together
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                Go from identifying a company to reaching out and keeping track
                of what happens next, without losing the details along the way.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {featureCards.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={feature.title}
                    className={`h-full border border-border p-6 transition-colors hover:border-primary/50 ${feature.className}`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <p className="mb-2 mt-5 text-xs font-medium tracking-wide text-primary">
                      {feature.eyebrow}
                    </p>
                    <h3 className="mb-2 text-lg font-semibold">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {feature.description}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-muted/30 px-6 py-20 sm:py-24">
          <div className="mx-auto grid w-full max-w-5xl items-center gap-12 md:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-medium text-primary">
                STAY IN THE LOOP
              </p>
              <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Know what you sent and what needs attention
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                Your dashboard turns outreach into a clear activity overview.
                See how many applications you have sent, which emails were
                opened or clicked, and whether a send failed or a follow-up is
                due.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Sent", "Opened", "Clicked", "Failed", "Follow-ups due"].map(
                  (status) => (
                    <span
                      key={status}
                      className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground"
                    >
                      {status}
                    </span>
                  ),
                )}
              </div>
            </div>

            <Card className="border border-border p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Your activity</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    A clearer view of your outreach
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Applications sent", icon: SendHorizontal },
                  { label: "Emails opened", icon: Mail },
                  { label: "Links clicked", icon: MousePointerClick },
                  { label: "Follow-ups due", icon: Clock3 },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="rounded-lg border border-border bg-background p-4"
                    >
                      <Icon className="mb-3 h-4 w-4 text-primary" />
                      <p className="text-xs leading-5 text-muted-foreground">
                        {item.label}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                Application history and progress charts in one dashboard
              </div>
            </Card>
          </div>
        </section>

        <section className="px-6 py-20 sm:py-28">
          <div className="mx-auto w-full max-w-5xl">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Save time without sounding like a template
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                Start with your own profile and reusable message, then review
                and edit the details for every opportunity. Your name, links,
                role, and company can be filled into your template, with your
                resume ready to attach.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {[
                {
                  icon: UserRound,
                  title: "Your details, ready",
                  description:
                    "Keep your name, contact information, portfolio, and resume in your profile.",
                },
                {
                  icon: FileText,
                  title: "A message that fits",
                  description:
                    "Use editable templates and fill-in details to give each email a relevant starting point.",
                },
                {
                  icon: Flame,
                  title: "You stay in control",
                  description:
                    "Preview and adjust your message before it goes out, instead of sending a black-box application.",
                },
              ].map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={feature.title}
                    className="border border-border p-6"
                  >
                    <Icon className="mb-4 h-5 w-5 text-primary" />
                    <h3 className="mb-2 font-semibold">{feature.title}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {feature.description}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-6 pb-24 pt-8 sm:pb-32">
          <div className="mx-auto w-full max-w-4xl rounded-2xl border border-border bg-muted/30 px-6 py-14 text-center sm:px-12">
            <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Make your next application a little easier
            </h2>
            <p className="mx-auto mb-8 mt-4 max-w-xl leading-7 text-muted-foreground">
              Keep your contacts, outreach, and application progress together.
              Set up your profile and get started with ApplyFast.
            </p>
            <Link href="/sign-in">
              <Button size="lg" className="gap-2">
                Get started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-center px-6">
          <p className="text-xs text-muted-foreground">
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
