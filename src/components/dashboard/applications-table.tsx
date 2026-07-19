"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteApplication, resendApplication } from "@/actions/applications";
import { Input } from "@/components/ui/input";
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
import { MoreHorizontal, Trash2, RefreshCw, Eye, Search, SendHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Application } from "@prisma/client";

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  sent: "default",
  pending: "secondary",
  failed: "destructive",
};

interface ApplicationsTableProps {
  applications: Application[];
  searchQuery?: string;
}

export function ApplicationsTable({ applications, searchQuery }: ApplicationsTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchQuery ?? "");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewApp, setViewApp] = useState<Application | null>(null);

  function handleSearch(value: string) {
    setSearch(value);
    const params = new URLSearchParams();
    if (value) params.set("q", value);
    // reset to page 1 on new search
    router.push(`/applications${value ? `?${params}` : ""}`);
  }

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

  if (applications.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by company or role..."
            className="pl-9"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
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
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by company or role..."
          className="pl-9"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Table */}
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
                  {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
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
                      <DropdownMenuItem onClick={() => setViewApp(app)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleResend(app.id)}
                        disabled={isPending}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Resend
                      </DropdownMenuItem>
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

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete application?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
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

      {/* View dialog */}
      <Dialog  open={!!viewApp} onOpenChange={() => setViewApp(null)}>
        <DialogContent className="max-w-4xl sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {viewApp?.role} at {viewApp?.company}
            </DialogTitle>
            <DialogDescription>{viewApp?.companyEmail}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
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
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ApplicationsTableSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <Skeleton className="h-9 w-full" />
      </div>
      {/* Table */}
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
