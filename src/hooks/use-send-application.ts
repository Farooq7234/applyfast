"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  createApplication,
  createApplicationsBatch,
} from "@/actions/applications";
import { formatScheduledAt } from "@/lib/scheduling";
import type {
  ApplicationInput,
  BatchApplicationInput,
} from "@/lib/validations";

type BatchSendResult = {
  index: number;
  status: "sent" | "scheduled" | "failed";
  error?: string;
};

export function useSendApplication() {
  const [isPending, startTransition] = useTransition();

  const sendApplication = async (
    data: ApplicationInput,
    onSuccess?: () => void,
  ) => {
    startTransition(async () => {
      try {
        const result = await createApplication(data);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success(
          data.scheduledAt
            ? `Application scheduled for ${formatScheduledAt(data.scheduledAt)}`
            : "Application sent!",
        );
        onSuccess?.();
      } catch (error) {
        console.error("[Applications] send failed:", error);
        toast.error("Could not send the application. Please try again.");
      }
    });
  };

  const sendApplicationsBatch = (
    data: BatchApplicationInput,
    onResult?: (results: BatchSendResult[]) => void,
  ) => {
    startTransition(async () => {
      try {
        const result = await createApplicationsBatch(data);
        if (!("results" in result) || !result.results) {
          toast.error(result.error);
          return;
        }

        const scheduledCount = result.results.filter(
          (item) => item.status === "scheduled",
        ).length;
        const acceptedCount = result.results.filter(
          (item) => item.status !== "failed",
        ).length;
        const failedCount = result.results.length - acceptedCount;

        if (failedCount > 0) {
          toast.error(
            `Batch finished: ${acceptedCount} accepted, ${failedCount} failed. Review the recipient results.`,
          );
        } else if (scheduledCount > 0) {
          toast.success(`${scheduledCount} applications scheduled with Resend.`);
        } else {
          toast.success(`${acceptedCount} applications accepted by Resend.`);
        }

        onResult?.(result.results);
      } catch (error) {
        console.error("[Applications] batch send failed:", error);
        toast.error(
          "Could not confirm the batch result. Check Resend before retrying.",
        );
      }
    });
  };

  return { isPending, sendApplication, sendApplicationsBatch };
}
