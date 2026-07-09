"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  searchQuery?: string;
}

function buildHref(page: number, searchQuery?: string) {
  const params = new URLSearchParams();
  if (searchQuery) params.set("q", searchQuery);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/dashboard/applications${qs ? `?${qs}` : ""}`;
}

export function Pagination({ currentPage, totalPages, searchQuery }: PaginationProps) {
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  // Build page number window: always show first, last, current ±1
  const pages = new Set<number>();
  pages.add(1);
  pages.add(totalPages);
  for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
    pages.add(i);
  }
  const pageList = Array.from(pages).sort((a, b) => a - b);

  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-muted-foreground">
        Page {currentPage} of {totalPages}
      </p>

      <div className="flex items-center gap-1">
        {/* Prev */}
        <Link
          href={buildHref(currentPage - 1, searchQuery)}
          aria-disabled={!hasPrev}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md border border-border text-sm transition-colors",
            hasPrev
              ? "hover:bg-secondary"
              : "pointer-events-none opacity-40"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>

        {/* Page numbers */}
        {pageList.map((p, i) => {
          const prev = pageList[i - 1];
          const gap = prev !== undefined && p - prev > 1;

          return (
            <span key={p} className="flex items-center gap-1">
              {gap && (
                <span className="flex h-8 w-6 items-center justify-center text-xs text-muted-foreground">
                  …
                </span>
              )}
              <Link
                href={buildHref(p, searchQuery)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md border text-xs font-medium transition-colors",
                  p === currentPage
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-secondary"
                )}
              >
                {p}
              </Link>
            </span>
          );
        })}

        {/* Next */}
        <Link
          href={buildHref(currentPage + 1, searchQuery)}
          aria-disabled={!hasNext}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md border border-border text-sm transition-colors",
            hasNext
              ? "hover:bg-secondary"
              : "pointer-events-none opacity-40"
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
