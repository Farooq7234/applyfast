"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type ProfileInput } from "@/lib/validations";
import { updateProfile, updateResumeUrl } from "@/actions/profile";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, CheckCircle2, FileText } from "lucide-react";

interface ProfileFormProps {
  profile: {
    name: string;
    email: string;
    portfolio: string | null;
    linkedin: string | null;
    github: string | null;
    phone: string | null;
    resumeUrl: string | null;
  } | null;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [resumeUrl, setResumeUrl] = useState(profile?.resumeUrl ?? "");
  const [resumeLoading, setResumeLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name ?? "",
      portfolio: profile?.portfolio ?? "",
      linkedin: profile?.linkedin ?? "",
      github: profile?.github ?? "",
      phone: profile?.phone ?? "",
    },
  });

  function onSubmit(data: ProfileInput) {
    startTransition(async () => {
      const result = await updateProfile(data);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Profile updated");
      }
    });
  }

  async function handleResumeUrlSave() {
    setResumeLoading(true);
    try {
      const result = await updateResumeUrl(resumeUrl);
      if (result.error) {
        toast.error(result.error as string);
      } else {
        toast.success("Resume URL saved");
      }
    } catch {
      toast.error("Failed to save resume URL");
    } finally {
      setResumeLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      {/* Profile info */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Info</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" placeholder="Jane Smith" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Email</Label>
              <Input value={profile?.email ?? ""} disabled className="bg-muted/50 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" placeholder="+1 555 000 0000" {...register("phone")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="portfolio">Portfolio URL</Label>
              <Input id="portfolio" placeholder="https://yoursite.dev" {...register("portfolio")} />
              {errors.portfolio && <p className="text-xs text-destructive">{errors.portfolio.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="linkedin">LinkedIn URL</Label>
              <Input id="linkedin" placeholder="https://linkedin.com/in/you" {...register("linkedin")} />
              {errors.linkedin && <p className="text-xs text-destructive">{errors.linkedin.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="github">GitHub URL</Label>
              <Input id="github" placeholder="https://github.com/you" {...register("github")} />
              {errors.github && <p className="text-xs text-destructive">{errors.github.message}</p>}
            </div>

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      </form>

      {/* Resume */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resume</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {profile?.resumeUrl ? (
            <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2.5">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <a
                href={profile.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 truncate text-sm hover:underline"
              >
                {profile.resumeUrl}
              </a>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-2.5">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">No resume uploaded</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="resumeUrl">Resume URL</Label>
            <p className="text-xs text-muted-foreground">
              Upload your resume to a public URL (Google Drive, Dropbox, etc.) and paste the link here.
            </p>
            <div className="flex gap-2">
              <Input
                id="resumeUrl"
                placeholder="https://drive.google.com/..."
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleResumeUrlSave}
                disabled={resumeLoading}
              >
                {resumeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
