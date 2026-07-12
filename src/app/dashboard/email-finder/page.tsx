"use client";

import { useState } from "react";
import {
  Search,
  Loader2,
  Mail,
  User,
  Briefcase,
  Globe,
  Check,
  Copy,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EmailResult {
  email: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  confidence?: number;
  source: string;
}

type Provider = "hunter" | "snov";

export default function EmailFinder() {
  const [provider, setProvider] = useState<Provider>("hunter");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [emails, setEmails] = useState<EmailResult[]>([]);
  const [error, setError] = useState("");
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const handleCopy = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);

      setTimeout(() => {
        setCopiedEmail((current) => (current === email ? null : current));
      }, 1500);
    } catch (err) {
      console.error("Failed to copy email:", err);
    }
  };

  async function handleSearch() {
    if (!domain.trim()) return;

    setLoading(true);
    setEmails([]);
    setError("");

    try {
      const res = await fetch(`/api/email-finder/${provider}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domain: domain.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      setEmails(data.emails);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Email Finder</h1>
        <p className="text-muted-foreground">
          Search company email addresses by domain.
        </p>
      </div>

      {/* Search */}
      <div className="mt-6 flex flex-col gap-3 sm:max-w-4xl sm:flex-row">
        <Select
          value={provider}
          onValueChange={(value) => setProvider(value as Provider)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Select Service" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="hunter">Hunter.io</SelectItem>
            <SelectItem value="snov">Snov.io</SelectItem>
          </SelectContent>
        </Select>

        <Input
          className="flex-1"
          placeholder="example.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />

        <Button
          onClick={handleSearch}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          Search
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card className="mt-6 border-destructive">
          <CardContent className="py-4 text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {emails.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

                <div className="group flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />

                  <span className="flex-1 break-all">{item.email}</span>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(item.email)}
                    className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    {copiedEmail === item.email ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="capitalize">{item.source}</span>
                  </div>

                  {item.confidence !== undefined && (
                    <span className="text-sm text-muted-foreground">
                      {item.confidence}% confidence
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && emails.length === 0 && !error && (
        <div className="py-16 text-center text-muted-foreground">
          Search a company domain to find professional email addresses.
        </div>
      )}
    </div>
  );
}