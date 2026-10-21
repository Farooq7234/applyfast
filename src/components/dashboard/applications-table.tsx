"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  cancelScheduledApplication,
  deleteApplication,
  getApplication,
  rescheduleApplication,
  resendApplication,
} from "@/actions/applications";
import { formatScheduledAt, fromDateTimeLocalValue, getScheduleBounds, toDateTimeLocalValue } from "@/lib/scheduling";
import { SchedulePresetButtons } from "@/components/dashboard/schedule-presets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MoreHorizontal,
  Trash2,
  RefreshCw,
  Eye,
  Search,
  SendHorizontal,
  CalendarClock,
  Ban,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Application } from "@prisma/client";

type ApplicationListItem = Pick<
  Application,
  | "id"
  | "company"
  | "companyEmail"
  | "role"
  | "recruiterName"
  | "status"
  | "scheduledAt"
  | "sentAt"
  | "createdAt"
>;

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  scheduled: "secondary",
  cancelled: "secondary",
  sent: "default",
  pending: "secondary",
  failed: "destructive",
};

interface ApplicationsTableProps {
  applications: ApplicationListItem[];
  searchQuery?: string;
}

export function ApplicationsTable({ applications, searchQuery }: ApplicationsTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchQuery ?? "");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [viewApp, setViewApp] = useState<Application | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [rescheduleApp, setRescheduleApp] = useState<ApplicationListItem | null>(
    null,
  );
  const [rescheduleValue, setRescheduleValue] = useState("");
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const rescheduleBounds = getScheduleBounds();
  const deleteApp = applications.find((app) => app.id === deleteId);

  useEffect(() => {
    const next = search.trim();
    const current = (searchQuery ?? "").trim();
    if (next === current) return;

    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (next) params.set("q", next);
      const qs = params.toString();
      startTransition(() => {
        router.replace(`/applications${qs ? `?${qs}` : ""}`);
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, searchQuery, router]);

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteApplication(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Application deleted");
      }
      setDeleteId(null);
    });
  }

  function handleResend(id: string) {
    startTransition(async () => {
      const result = await resendApplication(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Email resent successfully");
      }
    });
  }

  function handleCancelSchedule(id: string) {
    startTransition(async () => {
      const result = await cancelScheduledApplication(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Scheduled email cancelled");
      }
      setCancelId(null);
    });
  }

  function openReschedule(app: ApplicationListItem) {
    setRescheduleApp(app);
    setRescheduleValue(
      app.scheduledAt
        ? toDateTimeLocalValue(new Date(app.scheduledAt))
        : "",
    );
    setRescheduleError(null);
  }

  function handleReschedule() {
    if (!rescheduleApp) return;
    if (!rescheduleValue) {
      setRescheduleError("Choose a date and time");
      return;
    }

    const scheduledAt = fromDateTimeLocalValue(rescheduleValue);
    startTransition(async () => {
      const result = await rescheduleApplication(rescheduleApp.id, scheduledAt);
      if (result.error) {
        setRescheduleError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success(`Email rescheduled for ${formatScheduledAt(scheduledAt)}`);
      setRescheduleApp(null);
      setRescheduleValue("");
      setRescheduleError(null);
    });
  }

  async function handleView(id: string) {
    setViewLoading(true);
    setViewApp(null);
    const app = await getApplication(id);
    setViewLoading(false);
    if (!app) {
      toast.error("Application not found");
      return;
    }
    setViewApp(app);
  }

  const searchInput = (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search by company or role..."
        className="pl-9"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
  );

  if (applications.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {searchInput}
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <SendHorizontal className="mb-3 h-8 w-8 text-muted-foreground" />
          <h3 className="text-sm font-medium">
            {searchQuery ? "No results found" : "No applications yet"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchQuery ? "Try a different search term" : "Start by sending your first application"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {searchInput}

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Recruiter</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app) => (
              <TableRow key={app.id}>
                <TableCell className="font-medium">{app.company}</TableCell>
                <TableCell>{app.role.slice(0, 7)}...</TableCell>
                <TableCell className="text-muted-foreground text-sm">{app.companyEmail}</TableCell>
                <TableCell className="text-sm">{app.recruiterName ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {app.status === "scheduled" && app.scheduledAt
                    ? `Scheduled for ${formatScheduledAt(app.scheduledAt)}`
                    : formatDistanceToNow(
                        new Date(app.sentAt ?? app.createdAt),
                        { addSuffix: true },
                      )}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant[app.status] ?? "secondary"}>
                    {app.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(app.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      {app.status === "scheduled" ? (
                        <>
                          <DropdownMenuItem
                            onClick={() => openReschedule(app)}
                            disabled={isPending}
                          >
                            <CalendarClock className="mr-2 h-4 w-4" />
                            Reschedule
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setCancelId(app.id)}
                            disabled={isPending}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Cancel schedule
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => handleResend(app.id)}
                          disabled={isPending}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Resend
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteId(app.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete application?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteApp?.status === "scheduled"
                ? "This will also cancel the scheduled email in Resend. This action cannot be undone."
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel scheduled email?</AlertDialogTitle>
            <AlertDialogDescription>
              This cancels the email in Resend. A cancelled email cannot be
              rescheduled, so you would need to create a new application to send
              it again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep schedule</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => cancelId && handleCancelSchedule(cancelId)}
            >
              Cancel email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!rescheduleApp}
        onOpenChange={(open) => {
          if (open) return;
          setRescheduleApp(null);
          setRescheduleValue("");
          setRescheduleError(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule email</DialogTitle>
            <DialogDescription>
              Choose a new send time for the application to{" "}
              {rescheduleApp?.companyEmail ?? "this recipient"}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reschedule-at">New date and time *</Label>
              <SchedulePresetButtons
                value={rescheduleValue}
                onChange={(value) => {
                  setRescheduleValue(value);
                  setRescheduleError(null);
                }}
                disabled={isPending}
              />
              <Input
                id="reschedule-at"
                type="datetime-local"
                min={rescheduleBounds.min}
                max={rescheduleBounds.max}
                value={rescheduleValue}
                disabled={isPending}
                onChange={(event) => {
                  setRescheduleValue(event.target.value);
                  setRescheduleError(null);
                }}
              />
              {rescheduleError && (
                <p className="text-xs text-destructive">{rescheduleError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Times use your local timezone. Resend allows scheduling up to 30
                days ahead.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => setRescheduleApp(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="gap-2"
                disabled={isPending}
                onClick={handleReschedule}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CalendarClock className="h-4 w-4" />
                )}
                Reschedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!viewApp || viewLoading}
        onOpenChange={() => {
          setViewApp(null);
          setViewLoading(false);
        }}
      >
        <DialogContent className="max-w-4xl sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {viewLoading ? "Loading…" : `${viewApp?.role} at ${viewApp?.company}`}
            </DialogTitle>
            <DialogDescription>{viewApp?.companyEmail ?? " "}</DialogDescription>
          </DialogHeader>
          {viewLoading ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {viewApp?.scheduledAt && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Scheduled for
                  </p>
                  <p className="text-sm">
                    {formatScheduledAt(viewApp.scheduledAt)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Subject</p>
                <p className="text-sm">{viewApp?.subject}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Body</p>
                <div
                  className="rounded-md border border-border p-4 text-sm"
                  dangerouslySetInnerHTML={{ __html: viewApp?.body || "" }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ApplicationsTableSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-4 w-32" />
      <div className="relative">
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3 border-b border-border last:border-0">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
