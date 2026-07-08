"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type ProfileInput } from "@/lib/validations";
import { updateProfile } from "@/actions/profile";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Zap } from "lucide-react";
import Link from "next/link";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
  });

  async function onSubmit(data: ProfileInput) {
    setLoading(true);
    try {
      const result = await updateProfile(data);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Profile saved!");
      router.push("/dashboard/profile");
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-semibold">ApplyFast</span>
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set up your profile</CardTitle>
          <CardDescription>
            Fill this in once — it&apos;ll be used in every application you send.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" placeholder="Jane Smith" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="portfolio">Portfolio URL</Label>
              <Input id="portfolio" placeholder="https://janesmith.dev" {...register("portfolio")} />
              {errors.portfolio && <p className="text-xs text-destructive">{errors.portfolio.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="linkedin">LinkedIn URL</Label>
              <Input id="linkedin" placeholder="https://linkedin.com/in/janesmith" {...register("linkedin")} />
              {errors.linkedin && <p className="text-xs text-destructive">{errors.linkedin.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="github">GitHub URL</Label>
              <Input id="github" placeholder="https://github.com/janesmith" {...register("github")} />
              {errors.github && <p className="text-xs text-destructive">{errors.github.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" placeholder="+1 555 000 0000" {...register("phone")} />
            </div>
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              You can upload your resume from the Profile page after completing setup.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save and continue"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => router.push("/dashboard")}
            >
              Skip for now
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
