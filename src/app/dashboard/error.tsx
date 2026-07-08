"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6 h-full">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <div className="text-center">
        <h2 className="text-sm font-medium">Something went wrong</h2>
        <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
      </div>
      <Button size="sm" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
