"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  MotionConfig,
  motion,
  useInView,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import {
  Building2,
  Check,
  FileText,
  Mail,
  MousePointerClick,
  Paperclip,
  Search,
  SendHorizontal,
  XCircle,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Sample data used only inside the mockups (not real people or companies)   */
/* -------------------------------------------------------------------------- */

type Status = "Sent" | "Delivered" | "Opened" | "Clicked" | "Failed";

const DOMAIN = "company.com";

const sampleContacts = [
  { name: "Priya Nair", email: "priya@company.com" },
  { name: "Daniel Okafor", email: "daniel@company.com" },
  { name: "Mei Tanaka", email: "mei@company.com" },
];

const sampleCompanies = [
  { name: "Acme", domain: "acme.com", contacts: 3 },
  { name: "Globex", domain: "globex.com", contacts: 2 },
  { name: "Initech", domain: "initech.com", contacts: 1 },
];

const sampleActivity: { who: string; company: string; status: Status }[] = [
  { who: "Priya Nair", company: "company.com", status: "Opened" },
  { who: "Daniel Okafor", company: "acme.com", status: "Clicked" },
  { who: "Mei Tanaka", company: "globex.com", status: "Sent" },
  { who: "Sam Rivera", company: "initech.com", status: "Failed" },
];

const sampleStats = [
  { label: "Sent", value: "42", icon: SendHorizontal },
  { label: "Opened", value: "19", icon: Mail },
  { label: "Clicked", value: "6", icon: MousePointerClick },
  { label: "Failed", value: "2", icon: XCircle },
];

const sampleWeeks = [20, 35, 25, 55, 40, 70, 60, 85];

const statusStyles: Record<Status, string> = {
  Sent: "bg-secondary text-secondary-foreground",
  Delivered: "bg-secondary text-secondary-foreground",
  Opened: "bg-primary/10 text-primary",
  Clicked: "bg-primary text-primary-foreground",
  Failed: "bg-destructive/10 text-destructive",
};

/* -------------------------------------------------------------------------- */
/*  Motion setup                                                              */
/*                                                                            */
/*  Rules for this page: every animation shows a step of the story, plays     */
/*  once when it scrolls into view, and is skipped for people who prefer      */
/*  reduced motion.                                                           */
/* -------------------------------------------------------------------------- */

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease } },
};

const popVariants: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { delay: 0.8, duration: 0.3, ease },
  },
};

const barVariants: Variants = {
  hidden: { scaleY: 0 },
  show: { scaleY: 1, transition: { duration: 0.5, ease } },
};

function groupVariants(delayChildren: number, staggerChildren: number): Variants {
  return {
    hidden: {},
    show: { transition: { delayChildren, staggerChildren } },
  };
}

const statsGroup = groupVariants(0, 0.08);
const barsGroup = groupVariants(0.25, 0.05);
const recentGroup = groupVariants(0.5, 0.1);

/** Wrap the page once so every motion component respects reduced motion. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

function useOnView(amount = 0.35) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount });
  return { ref, inView };
}

/**
 * Runs a short story once the element is on screen.
 * `times` are milliseconds after entering view. `phase` goes 0, 1, 2 ... as
 * each time passes. Keep `times` as a module level constant.
 */
function useStory(times: number[]) {
  const { ref, inView } = useOnView();
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!inView || reduce) return undefined;
    const ids = times.map((time, index) =>
      setTimeout(() => setPhase(index + 1), time),
    );
    return () => ids.forEach(clearTimeout);
  }, [inView, reduce, times]);

  return { ref, phase: reduce && inView ? times.length : phase };
}

/* -------------------------------------------------------------------------- */
/*  Small building blocks                                                     */
/* -------------------------------------------------------------------------- */

function StatusPill({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

/** A value filled in from the template. The highlight fades in after `delay`. */
function Filled({
  children,
  on = true,
  delay = 0,
}: {
  children: ReactNode;
  on?: boolean;
  delay?: number;
}) {
  return (
    <span
      className={`rounded px-1 font-medium transition-colors duration-500 ${
        on ? "bg-primary/10 text-primary" : "bg-transparent text-foreground"
      }`}
      style={{ transitionDelay: on ? `${delay}ms` : "0ms" }}
    >
      {children}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
      {initials}
    </div>
  );
}

function ContactRow({
  contact,
  active = false,
}: {
  contact: (typeof sampleContacts)[number];
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-2.5 transition-colors duration-300 ${
        active ? "border-primary/50 bg-primary/5" : "border-border bg-background"
      }`}
    >
      <Avatar name={contact.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{contact.name}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {contact.email}
        </p>
      </div>
      <motion.span
        animate={active ? { scale: [1, 0.92, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-medium transition-colors duration-300 ${
          active
            ? "bg-primary text-primary-foreground"
            : "border border-border text-muted-foreground"
        }`}
      >
        Apply
      </motion.span>
    </div>
  );
}

function ResumeChip() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-[11px]">
      <Paperclip className="h-3 w-3 text-muted-foreground" />
      Resume.pdf
    </span>
  );
}

function SendButton({ sent = false }: { sent?: boolean }) {
  return (
    <motion.div
      animate={sent ? { scale: [1, 0.95, 1] } : { scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-medium transition-colors duration-300 ${
        sent
          ? "bg-secondary text-secondary-foreground"
          : "bg-primary text-primary-foreground"
      }`}
    >
      {sent ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <SendHorizontal className="h-3.5 w-3.5" />
      )}
      {sent ? "Sent" : "Send"}
    </motion.div>
  );
}

function Frame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xl">
      <div className="flex items-center gap-1.5 border-b border-border bg-muted/50 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="ml-3 text-xs text-muted-foreground">{title}</span>
      </div>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Domain search: type a domain, emails appear, Apply is one click away      */
/* -------------------------------------------------------------------------- */

function Typed({ text }: { text: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let index = 0;
    const id = setInterval(() => {
      index += 1;
      setCount(index);
      if (index >= text.length) clearInterval(id);
    }, 60);
    return () => clearInterval(id);
  }, [text]);

  return <>{text.slice(0, count)}</>;
}

function Caret() {
  return (
    <motion.span
      aria-hidden="true"
      className="ml-px inline-block h-3 w-px bg-foreground align-middle"
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 1, repeat: Infinity }}
    />
  );
}

function DomainSearch({
  typing,
  results,
  applied,
  prefilled = false,
  compact = false,
}: {
  typing: boolean;
  results: boolean;
  applied: boolean;
  prefilled?: boolean;
  compact?: boolean;
}) {
  const contacts = compact ? sampleContacts.slice(0, 2) : sampleContacts;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs">
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        {prefilled || results ? (
          <span>{DOMAIN}</span>
        ) : typing ? (
          <span>
            <Typed text={DOMAIN} />
            <Caret />
          </span>
        ) : (
          <span className="text-muted-foreground">Enter a company domain</span>
        )}
      </div>

      {!compact && (
        <motion.p
          initial={false}
          animate={{ opacity: results ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="px-1 pt-1 text-[11px] text-muted-foreground"
        >
          {contacts.length} contacts found
        </motion.p>
      )}

      <motion.div
        className="space-y-2"
        variants={listVariants}
        initial="hidden"
        animate={results ? "show" : "hidden"}
      >
        {contacts.map((contact, index) => (
          <motion.div key={contact.email} variants={itemVariants}>
            <ContactRow contact={contact} active={applied && index === 0} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hero: the whole story in one frame                                        */
/*  type a domain > emails appear > Apply > draft fills in > Sent > Opened    */
/* -------------------------------------------------------------------------- */

const HERO_TIMES = [400, 1700, 2800, 3900, 5000];

function HeroDraft({ phase }: { phase: number }) {
  const on = phase >= 3;

  return (
    <div className="relative">
      <motion.p
        initial={false}
        animate={{ opacity: on ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground"
      >
        Choose a contact to start a draft
      </motion.p>

      <motion.div
        initial={false}
        animate={{ opacity: on ? 1 : 0, y: on ? 0 : 8 }}
        transition={{ duration: 0.45, ease }}
        className="space-y-4"
      >
        <div className="space-y-1.5 text-xs">
          <div className="flex gap-3 border-b border-border pb-1.5">
            <span className="w-14 text-muted-foreground">To</span>
            <span>priya@company.com</span>
          </div>
          <div className="flex gap-3 border-b border-border pb-1.5">
            <span className="w-14 text-muted-foreground">Subject</span>
            <span>Frontend Intern application</span>
          </div>
        </div>

        <p className="text-sm leading-7">
          Hi{" "}
          <Filled on={on} delay={500}>
            Priya
          </Filled>
          , I saw the{" "}
          <Filled on={on} delay={700}>
            Frontend Intern
          </Filled>{" "}
          opening at{" "}
          <Filled on={on} delay={900}>
            Company
          </Filled>{" "}
          and think I could be a good fit. My work is at{" "}
          <Filled on={on} delay={1100}>
            yourname.dev
          </Filled>{" "}
          and my resume is attached.
          <br />
          <br />
          Thanks,
          <br />
          <Filled on={on} delay={1300}>
            Your name
          </Filled>
        </p>

        <div className="flex items-center justify-between">
          <ResumeChip />
          <SendButton sent={phase >= 4} />
        </div>
      </motion.div>
    </div>
  );
}

export function HeroMock() {
  const { ref, phase } = useStory(HERO_TIMES);

  return (
    <div
      ref={ref}
      role="img"
      aria-label="ApplyFast preview: type a company domain, see its contacts, apply to one, and get an email draft with the recruiter, role and company filled in and your resume attached."
      className="relative mx-auto mt-14 w-full max-w-5xl text-left"
    >
      <Frame title="New application">
        <div className="grid md:grid-cols-5">
          <div className="border-b border-border bg-muted/30 p-4 md:col-span-2 md:border-b-0 md:border-r">
            <DomainSearch
              typing={phase >= 1}
              results={phase >= 2}
              applied={phase >= 3}
            />
          </div>
          <div className="p-5 sm:p-6 md:col-span-3">
            <HeroDraft phase={phase} />
          </div>
        </div>
      </Frame>

      <motion.div
        initial={false}
        animate={{ opacity: phase >= 5 ? 1 : 0, y: phase >= 5 ? 0 : 8 }}
        transition={{ duration: 0.4, ease }}
        className="absolute -bottom-5 right-4 hidden items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-lg sm:flex md:right-10"
      >
        <span className="h-2 w-2 rounded-full bg-primary" />
        <Mail className="h-3.5 w-3.5 text-primary" />
        Priya opened your email
      </motion.div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  How it works: one small story per step                                    */
/* -------------------------------------------------------------------------- */

export function ProfileVisual() {
  const { ref, inView } = useOnView();
  const fields = [
    ["Name", "Your name"],
    ["Email", "you@email.com"],
    ["Portfolio", "yourname.dev"],
  ];

  return (
    <motion.div
      ref={ref}
      className="space-y-1.5"
      variants={listVariants}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
    >
      {fields.map(([label, value]) => (
        <motion.div
          key={label}
          variants={itemVariants}
          className="flex items-center gap-3 rounded-md border border-border bg-background px-2.5 py-1.5 text-[11px]"
        >
          <span className="w-14 text-muted-foreground">{label}</span>
          <span className="truncate">{value}</span>
        </motion.div>
      ))}
      <motion.div
        variants={itemVariants}
        className="flex items-center gap-2 rounded-md border border-dashed border-primary/50 bg-primary/5 px-2.5 py-1.5 text-[11px]"
      >
        <FileText className="h-3.5 w-3.5 text-primary" />
        Resume.pdf
        <motion.span variants={popVariants} className="ml-auto">
          <Check className="h-3.5 w-3.5 text-primary" />
        </motion.span>
      </motion.div>
    </motion.div>
  );
}

const STEP_SEARCH_TIMES = [200, 1300, 2100];

export function SearchVisual() {
  const { ref, phase } = useStory(STEP_SEARCH_TIMES);

  return (
    <div ref={ref}>
      <DomainSearch
        compact
        typing={phase >= 1}
        results={phase >= 2}
        applied={phase >= 3}
      />
    </div>
  );
}

const STEP_SEND_TIMES = [300, 1500];

export function SendVisual() {
  const { ref, phase } = useStory(STEP_SEND_TIMES);

  return (
    <div
      ref={ref}
      className="space-y-3 rounded-md border border-border bg-background p-3"
    >
      <p className="text-[11px] leading-5">
        Hi <Filled on={phase >= 1}>Priya</Filled>, I saw the{" "}
        <Filled on={phase >= 1} delay={150}>
          Frontend Intern
        </Filled>{" "}
        role at{" "}
        <Filled on={phase >= 1} delay={300}>
          Company
        </Filled>
        . My resume is attached.
      </p>
      <div className="flex items-center justify-between">
        <ResumeChip />
        <SendButton sent={phase >= 2} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Feature card visuals                                                      */
/* -------------------------------------------------------------------------- */

const FIND_TIMES = [150, 1100];

export function FindVisual() {
  const { ref, phase } = useStory(FIND_TIMES);

  return (
    <div ref={ref}>
      <DomainSearch prefilled typing={false} results={phase >= 1} applied={phase >= 2} />
    </div>
  );
}

export function CompaniesVisual() {
  const { ref, inView } = useOnView();

  return (
    <motion.div
      ref={ref}
      className="space-y-2"
      variants={listVariants}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
    >
      {sampleCompanies.map((company) => (
        <motion.div
          key={company.domain}
          variants={itemVariants}
          className="flex items-center gap-3 rounded-lg border border-border bg-background p-2.5"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{company.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {company.domain}
            </p>
          </div>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {company.contacts}{" "}
            {company.contacts === 1 ? "contact" : "contacts"}
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
}

export function TemplateVisual() {
  const { ref, inView } = useOnView();

  return (
    <div
      ref={ref}
      className="rounded-md border border-border bg-background p-3 text-[11px] leading-6"
    >
      Hi <Filled on={inView}>Recruiter</Filled>, I saw the{" "}
      <Filled on={inView} delay={200}>
        Role
      </Filled>{" "}
      opening at{" "}
      <Filled on={inView} delay={400}>
        Company
      </Filled>
      . My work:{" "}
      <Filled on={inView} delay={600}>
        Portfolio
      </Filled>
      . Resume attached.
      <br />
      Thanks,{" "}
      <Filled on={inView} delay={800}>
        Your name
      </Filled>
    </div>
  );
}

const TRACK_TIMES = [300, 1000, 1700];

export function TrackVisual() {
  const { ref, phase } = useStory(TRACK_TIMES);
  const steps = ["Sent", "Delivered", "Opened", "Clicked"];

  return (
    <div ref={ref} className="space-y-5">
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <Mail className="h-3.5 w-3.5" />
        Email to priya@company.com
      </div>
      <div className="flex items-start">
        {steps.map((label, index) => {
          const done = phase > index;
          return (
            <div
              key={label}
              className="relative flex flex-1 flex-col items-center gap-2"
            >
              {index > 0 && (
                <span className="absolute left-[-50%] top-3 h-px w-full bg-border">
                  <motion.span
                    className="block h-full w-full origin-left bg-primary"
                    initial={false}
                    animate={{ scaleX: done ? 1 : 0 }}
                    transition={{ duration: 0.5, ease }}
                  />
                </span>
              )}
              <motion.span
                initial={false}
                animate={done ? { scale: [0.85, 1.08, 1] } : { scale: 1 }}
                transition={{ duration: 0.35 }}
                className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border transition-colors duration-300 ${
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background"
                }`}
              >
                {done && <Check className="h-3.5 w-3.5" />}
              </motion.span>
              <span
                className={`text-[11px] transition-colors duration-300 ${
                  done ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Dashboard: tiles appear, bars grow, recent activity lists in              */
/* -------------------------------------------------------------------------- */

export function DashboardMock() {
  const { ref, inView } = useOnView(0.25);

  return (
    <motion.div
      ref={ref}
      role="img"
      aria-label="ApplyFast dashboard preview with counts for sent, opened, clicked and failed emails, a weekly chart and a list of recent applications."
      className="mx-auto w-full max-w-4xl text-left"
      initial="hidden"
      animate={inView ? "show" : "hidden"}
    >
      <Frame title="Dashboard">
        <div className="space-y-5 p-5 sm:p-6">
          <motion.div
            className="grid grid-cols-2 gap-3 sm:grid-cols-4"
            variants={statsGroup}
          >
            {sampleStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  variants={itemVariants}
                  className="rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    {stat.label}
                  </div>
                  <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
                </motion.div>
              );
            })}
          </motion.div>

          <div className="grid gap-4 md:grid-cols-5">
            <div className="rounded-lg border border-border bg-background p-4 md:col-span-3">
              <p className="mb-4 text-xs font-medium">Applications per week</p>
              <motion.div
                className="flex h-32 items-end gap-2"
                variants={barsGroup}
              >
                {sampleWeeks.map((height, index) => (
                  <motion.div
                    key={index}
                    variants={barVariants}
                    style={{ height: `${height}%`, originY: 1 }}
                    className="flex-1 rounded-t bg-primary/80"
                  />
                ))}
              </motion.div>
            </div>

            <div className="rounded-lg border border-border bg-background p-4 md:col-span-2">
              <p className="mb-2 text-xs font-medium">Recent</p>
              <motion.div
                className="divide-y divide-border"
                variants={recentGroup}
              >
                {sampleActivity.map((row) => (
                  <motion.div
                    key={row.who}
                    variants={itemVariants}
                    className="flex items-center justify-between gap-2 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">{row.who}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {row.company}
                      </p>
                    </div>
                    <StatusPill status={row.status} />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </Frame>
    </motion.div>
  );
}