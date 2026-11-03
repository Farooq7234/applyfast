"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function SignInPage() {
  const [loadingProvider, setLoadingProvider] = useState<"google" | null>(null);

  async function handleSocialSignIn(provider: "google") {
    setLoadingProvider(provider);
    try {
      await signIn.social({
        provider,
        callbackURL: "/dashboard",
      });
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoadingProvider(null);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle>Welcome to ApplyFast</CardTitle>
        <CardDescription>
          Sign in to start applying in under 15 seconds
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          className="w-full gap-2"
          onClick={() => handleSocialSignIn("google")}
          disabled={loadingProvider !== null}
        >
          {loadingProvider === "google" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          {loadingProvider === "google"
            ? "Redirecting…"
            : "Continue with Google"}
        </Button>
      </CardContent>
    </Card>
  );
}

function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.7c3.9-3.6 6-8.8 6-15Z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.1c-1.8 1.2-4.1 2-6.8 2-5.2 0-9.6-3.5-11.2-8.2H5.9v5.2A20 20 0 0 0 24 44Z"
      />
      <path
        fill="#FBBC05"
        d="M12.8 27.8a12 12 0 0 1 0-7.6V15H5.9a20 20 0 0 0 0 18Z"
      />
      <path
        fill="#EA4335"
        d="M24 12c3 0 5.7 1 7.8 3.1l5.9-5.9C34.1 5.9 29.5 4 24 4A20 20 0 0 0 5.9 15l6.9 5.2C14.4 15.5 18.8 12 24 12Z"
      />
    </svg>
  );
}

