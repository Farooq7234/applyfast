"use client";

import { useState, useRef, useEffect, useId } from "react";
import { cn } from "@/lib/utils";

// ─── Role suggestions list ─────────────────────────────────────────────────────
const ROLES = [
  // Frontend
  "Frontend Developer",
  "Frontend Engineer",
  "Junior Frontend Developer",
  "Senior Frontend Developer",
  "Senior Frontend Engineer",
  "Lead Frontend Engineer",
  "React Developer",
  "Next.js Developer",
  "UI Developer",
  "UI Engineer",
  // Backend
  "Backend Developer",
  "Backend Engineer",
  "Junior Backend Developer",
  "Senior Backend Developer",
  "Senior Backend Engineer",
  "Node.js Developer",
  "Python Developer",
  "Java Developer",
  "Go Developer",
  // Full Stack
  "Full Stack Developer",
  "Full Stack Engineer",
  "Junior Full Stack Developer",
  "Senior Full Stack Developer",
  "Senior Full Stack Engineer",
  "MERN Stack Developer",
  "MEAN Stack Developer",
  // Mobile
  "iOS Developer",
  "Android Developer",
  "React Native Developer",
  "Flutter Developer",
  "Mobile Developer",
  "Mobile Engineer",
  // DevOps / Cloud
  "DevOps Engineer",
  "Site Reliability Engineer",
  "Cloud Engineer",
  "Platform Engineer",
  "Infrastructure Engineer",
  "AWS Engineer",
  "Kubernetes Engineer",
  // Data
  "Data Engineer",
  "Data Scientist",
  "Machine Learning Engineer",
  "AI Engineer",
  "ML Engineer",
  // General
  "Software Engineer",
  "Software Developer",
  "Junior Software Engineer",
  "Senior Software Engineer",
  "Staff Software Engineer",
  "Principal Software Engineer",
  "Software Architect",
  "Solutions Architect",
  "Technical Lead",
  "Tech Lead",
  "Engineering Manager",
  // QA
  "QA Engineer",
  "SDET",
  "Test Engineer",
  "Automation Engineer",
  // Security
  "Security Engineer",
  "Application Security Engineer",
  "Cybersecurity Engineer",
];

// ─── Component ────────────────────────────────────────────────────────────────
interface RoleComboboxProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
}

export function RoleCombobox({
  value,
  onChange,
  onBlur,
  placeholder = "e.g. Senior Frontend Engineer",
  error,
}: RoleComboboxProps) {
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = value.trim()
    ? ROLES.filter((r) =>
        r.toLowerCase().includes(value.trim().toLowerCase())
      ).slice(0, 8)
    : [];

  const shouldShow = open && filtered.length > 0;

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!shouldShow) {
      if (e.key === "ArrowDown" && filtered.length > 0) {
        setOpen(true);
        setActiveIndex(0);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        e.preventDefault();
        break;
      case "ArrowUp":
        setActiveIndex((i) => Math.max(i - 1, 0));
        e.preventDefault();
        break;
      case "Enter":
        if (activeIndex >= 0 && filtered[activeIndex]) {
          onChange(filtered[activeIndex]);
          setOpen(false);
          setActiveIndex(-1);
          e.preventDefault();
        }
        break;
      case "Escape":
        setOpen(false);
        setActiveIndex(-1);
        break;
      case "Tab":
        setOpen(false);
        setActiveIndex(-1);
        break;
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={shouldShow}
        aria-haspopup="listbox"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => {
          if (filtered.length > 0) setOpen(true);
        }}
        onBlur={() => {
          // Delay so click on item registers first
          setTimeout(() => {
            setOpen(false);
            setActiveIndex(-1);
            onBlur?.();
          }, 120);
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex h-9 w-full border border-input bg-transparent px-3 py-1 text-sm  transition-colors",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive focus-visible:ring-destructive"
        )}
      />

      {shouldShow && (
        <ul
          ref={listRef}
          role="listbox"
          className={cn(
            "absolute left-0 top-full z-50 mt-1 w-full overflow-hidden border border-border bg-popover text-popover-foreground",
            "max-h-52 overflow-y-auto"
          )}
        >
          {filtered.map((role, i) => (
            <li
              key={role}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => {
                // prevent blur before click
                e.preventDefault();
                onChange(role);
                setOpen(false);
                setActiveIndex(-1);
                inputRef.current?.focus();
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={cn(
                "cursor-pointer px-3 py-2 text-sm",
                i === activeIndex
                  ? "bg-secondary text-foreground"
                  : "hover:bg-secondary/60"
              )}
            >
              {/* Bold the matching portion */}
              <HighlightMatch text={role} query={value} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Helper: bold the matched substring ───────────────────────────────────────
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const idx = text.toLowerCase().indexOf(query.trim().toLowerCase());
  if (idx === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, idx)}
      <span className="font-semibold">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}
