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
  Send,
} from "lucide-react";
import type { Template } from "@prisma/client";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NewApplicationForm } from "@/components/dashboard/new-application-form";

interface EmailResult {
  email: string;
  name: string;
  title: string;
  category: "founder" | "engineering" | "recruiter" | "hr" | "people_ops" | "other";
  priorityScore: number;
  confidence?: number;
  source: string;
}

interface EmailFinderClientProps {
  templates: Template[];
  profile: {
    id: string;
    name: string;
    email: string;
    portfolio: string | null;
    linkedin: string | null;
    github: string | null;
    phone: string | null;
    resumeUrl: string | null;
    createdAt: Date;
  } | null;
}

type Provider = "hunter" | "snov" | "combined";

function extractCompanyFromEmail(email: string) {
  const domain = email.split("@")[1] ?? "";
  const companySegment = domain.split(".")[0] ?? "";
  return companySegment
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function extractRecruiterName(name: string) {
  return name === "Unknown" ? "" : name;
}

export function EmailFinderClient({
  templates,
  profile,
}: EmailFinderClientProps) {
  const [provider, setProvider] = useState<Provider>("combined");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [emails, setEmails] = useState<EmailResult[]>([]);
  const [error, setError] = useState("");
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailResult | null>(null);

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
      const endpoint =
        provider === "combined"
          ? "/api/email-finder/combined"
          : `/api/email-finder/${provider}`;

      const res = await fetch(endpoint, {
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
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Email Finder</h1>
        <p className="text-muted-foreground">
          Search company email addresses by domain and apply right away.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:max-w-4xl sm:flex-row">
        <Select
          value={provider}
          onValueChange={(value) => setProvider(value as Provider)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Select Service" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="combined">Combined (Recommended)</SelectItem>
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

      {error && (
        <Card className="mt-6 border-destructive">
          <CardContent className="py-4 text-destructive">{error}</CardContent>
        </Card>
      )}

      {emails.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {emails.map((item) => (
            <Card key={item.email}>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{item.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{item.title || "N/A"}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      item.category === "founder"
                        ? "bg-purple-100 text-purple-800"
                        : item.category === "engineering"
                          ? "bg-blue-100 text-blue-800"
                          : item.category === "recruiter"
                            ? "bg-green-100 text-green-800"
                            : item.category === "hr" ||
                                item.category === "people_ops"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {item.category.replace("_", " ")}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Priority: {item.priorityScore}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 break-all">{item.email}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(item.email)}
                    className="h-7 w-7 shrink-0"
                  >
                    {copiedEmail === item.email ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between gap-3">
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

                <Button
                  className="w-full gap-2"
                  onClick={() => setSelectedEmail(item)}
                >
                  <Send className="h-4 w-4" />
                  Apply
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && emails.length === 0 && !error && (
        <div className="py-16 text-center text-muted-foreground">
          Search a company domain to find professional email addresses.
        </div>
      )}

      <Dialog
        open={!!selectedEmail}
        onOpenChange={(open) => {
          if (!open) setSelectedEmail(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Apply from Email Finder</DialogTitle>
            <DialogDescription>
              Send a new application using the selected contact details.
            </DialogDescription>
          </DialogHeader>

          {selectedEmail && (
            <NewApplicationForm
              templates={templates}
              profile={profile}
              showPreview={false}
              initialValues={{
                companyEmail: selectedEmail.email,
                company:
                  extractCompanyFromEmail(selectedEmail.email) || selectedEmail.name,
                recruiterName: extractRecruiterName(selectedEmail.name) || undefined,
              }}
              onSuccess={() => setSelectedEmail(null)}
              onClose={() => setSelectedEmail(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
