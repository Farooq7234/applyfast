import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import {
  CompaniesVisual,
  DashboardMock,
  FindVisual,
  HeroMock,
  MotionProvider,
  ProfileVisual,
  SearchVisual,
  SendVisual,
  TemplateVisual,
  TrackVisual,
} from "@/components/landing";

const workflowSteps = [
  {
    number: "01",
    title: "Set up your profile",
    description:
      "Add your contact details, portfolio links, and resume once. Reuse them every time you reach out.",
    visual: <ProfileVisual />,
  },
  {
    number: "02",
    title: "Find the right contact",
    description:
      "Search a company domain for professional email addresses, then choose a contact to start an application.",
    visual: <SearchVisual />,
  },
  {
    number: "03",
    title: "Personalize and send",
    description:
      "Review your template with the job details filled in, make edits, and send your resume with the email.",
    visual: <SendVisual />,
  },
];

const features = [
  {
    title: "Find professional contacts",
    description:
      "Look up contacts by company domain with the combined email search, or use Hunter.io and Snov.io individually. Review the results and apply to a contact from the same flow.",
    visual: <FindVisual />,
    className: "md:col-span-2",
  },
  {
    title: "Keep a list of target companies",
    description:
      "Research places you want to work and keep their contacts together on a target-company board, separate from applications you have already sent.",
    visual: <CompaniesVisual />,
    className: "",
  },
  {
    title: "Write with reusable templates",
    description:
      "Create and manage your email templates. Personalize each message with details like the recruiter, role, company, portfolio, resume, and your name.",
    visual: <TemplateVisual />,
    className: "",
  },
  {
    title: "Track every application",
    description:
      "Search your application history and check dashboard stats for sent applications, opens, clicks, and failed sends.",
    visual: <TrackVisual />,
    className: "md:col-span-2",
  },
];

export default function LandingPage() {
  return (
    <MotionProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />

        <main className="flex flex-1 flex-col">
          <section className="relative flex flex-col items-center overflow-hidden px-6 pb-20 pt-24 text-center sm:pb-28 sm:pt-32">
            <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-80 max-w-4xl rounded-full bg-primary/5 blur-3xl" />
            <h1 className="text-balance text-3xl font-bold tracking-tight sm:max-w-4xl sm:text-6xl">
              Email recruiters. See who opens it
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">
               ApplyFast finds contacts at any company, fills in your email
              template, and tracks every send
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 sm:flex-nowrap">
              <Link href="/sign-in">
                <Button size="lg" className="gap-2">
                  Start applying faster
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
              {["Reusable profile", "Editable email templates", "Application tracking"].map(
                (item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {item}
                  </span>
                ),
              )}
            </div>

            <HeroMock />
          </section>

          <section className="border-y border-border bg-muted/30 px-6 py-20 sm:py-24">
            <div className="mx-auto w-full max-w-5xl">
              <div className="mx-auto mb-12 max-w-2xl text-center">
                <p className="mb-3 text-sm font-medium text-primary">
                  A SIMPLE ROUTINE
                </p>
                <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                  From first search to sent application
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Set up the essentials once, then spend less time repeating
                  yourself every time you find a role worth pursuing.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                {workflowSteps.map((step) => (
                  <div
                    key={step.number}
                    className="h-full rounded-xl border border-border bg-background p-6 transition-colors hover:border-primary/50"
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        {step.number}
                      </span>
                    </div>
                    <h3 className="mb-2 font-semibold">{step.title}</h3>
                    <p className="mb-5 text-sm leading-6 text-muted-foreground">
                      {step.description}
                    </p>
                    {step.visual}
                  </div>
                ))}
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
                  Go from identifying a company to reaching out and keeping
                  track of what happens next, without losing the details along
                  the way.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {features.map((feature) => (
                  <div
                    key={feature.title}
                    className={`h-full rounded-xl border border-border bg-background p-6 transition-colors hover:border-primary/50 ${feature.className}`}
                  >
                    <h3 className="mb-2 text-lg font-semibold">
                      {feature.title}
                    </h3>
                    <p className="mb-5 text-sm leading-6 text-muted-foreground">
                      {feature.description}
                    </p>
                    {feature.visual}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="border-y border-border bg-muted/30 px-6 py-20 sm:py-24">
            <div className="mx-auto w-full max-w-5xl">
              <div className="mx-auto mb-12 max-w-2xl text-center">
                <p className="mb-3 text-sm font-medium text-primary">
                  STAY IN THE LOOP
                </p>
                <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                  Know what you sent and what needs attention
                </h2>
                <p className="mt-4 leading-7 text-muted-foreground">
                  Your dashboard turns outreach into a clear activity overview.
                  See how many applications you have sent, which emails were
                  opened or clicked, and whether a send failed.
                </p>
              </div>
              <DashboardMock />
            </div>
          </section>

          <section className="px-6 pb-24 pt-20 sm:pb-32">
            <div className="mx-auto w-full max-w-4xl rounded-2xl border border-border bg-muted/30 px-6 py-14 text-center sm:px-12">
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
    </MotionProvider>
  );
}