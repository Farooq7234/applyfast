"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export default function Navbar() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold">ApplyFast</span>
        </div>

        <div className="flex items-center gap-3">
          {isPending ? null : session ? (
            <>
              <Button size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => authClient.signOut()}
              >
                Logout
              </Button>
            </>
          ) : (
            <Button size="sm">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}