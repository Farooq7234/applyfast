"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { replyToReceivedEmail } from "@/actions/inbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ReplyComposer({ receivedEmailId }: { receivedEmailId: string }) {
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSend() {
    startTransition(async () => {
      const result = await replyToReceivedEmail(receivedEmailId, body);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setBody("");
      toast.success("Reply sent");
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="reply-body">Reply</Label>
      <Textarea
        id="reply-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your reply…"
        disabled={isPending}
        className="min-h-28"
      />
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          onClick={handleSend}
          disabled={isPending || !body.trim()}
        >
          {isPending ? "Sending…" : "Send reply"}
        </Button>
      </div>
    </div>
  );
}
