import { Resend } from "resend";
import type { ListReceivingEmail } from "resend";
import { format, formatDistanceToNow } from "date-fns";
import { InboxIcon } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

async function getEmails(): Promise<ListReceivingEmail[]> {
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const { data, error } = await resend.emails.receiving.list();
  if (error || !data) return [];
  return data.data ?? [];
}

export default async function ReceiveEmailsPage() {
  const emails = await getEmails();

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Inbox</h1>
        <p className="text-sm text-muted-foreground">
          {emails.length} email{emails.length !== 1 ? "s" : ""} received
        </p>
      </div>

      {/* Empty state */}
      {emails.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center">
          <InboxIcon className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">No emails yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Emails sent to your inbox will appear here
          </p>
        </div>
      ) : (
        /* Table */
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Received</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {emails.map((email) => {
                const date = new Date(email.created_at);
                const isRecent =
                  Date.now() - date.getTime() < 24 * 60 * 60 * 1000;

                return (
                  <TableRow key={email.id}>
                    <TableCell className="font-medium">{email.from}</TableCell>
                    <TableCell>
                      {email.subject ? (
                        email.subject
                      ) : (
                        <span className="italic text-muted-foreground">
                          (no subject)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {email.to.join(", ")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {isRecent
                        ? formatDistanceToNow(date, { addSuffix: true })
                        : format(date, "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                     
                           <Button variant="default" size={'sm'}>
                             <Link
                              href={`/receive-emails/${email.id}`}
                              className="flex items-center w-full"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Link>
                           </Button>
                
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
