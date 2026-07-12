"use client";

import { useState } from "react";
import { Search, Loader2, Mail, User, Briefcase, Globe, Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface EmailResult {
  email: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  confidence?: number;
  source: string;
}

export default function HunterEmailFinder() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [emails, setEmails] = useState<EmailResult[]>([]);
  const [error, setError] = useState("");
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const handleCopy = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail((current) => (current === email ? null : current)), 1500);
    } catch (err) {
      console.error("Failed to copy email:", err);
    }
  };

  async function handleSearch() {
    if (!domain.trim()) return;

    setLoading(true);
    setError("");
    setEmails([]);

    try {
      const res = await fetch("/api/email-finder/hunter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domain,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      setEmails(data.emails);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-0 py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Email Finder</h1>
        <p className="text-muted-foreground">
          Search company emails by domain.
        </p>
      </div>

      <div className="flex gap-3  sm:max-w-2xl">
        <Input
          placeholder="example.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />

        <Button onClick={handleSearch} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Search
        </Button>
      </div>

      {error && (
        <Card className="border-red-500">
          <CardContent className="py-4 text-red-500">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {emails.map((item) => (
          <Card key={item.email}>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {item.firstName || item.lastName
                    ? `${item.firstName ?? ""} ${item.lastName ?? ""}`.trim()
                    : "Unknown"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>{item.position || "N/A"}</span>
              </div>

              <div className="flex items-center gap-2 group">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{item.email}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopy(item.email)}
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                  aria-label="Copy email"
                >
                  {copiedEmail === item.email ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="capitalize">{item.source}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && emails.length === 0 && !error && (
        <div className="text-center text-muted-foreground py-10">
          Search a domain to find email addresses.
        </div>
      )}
    </div>
  );
}