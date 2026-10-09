"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  createApplication,
  createApplicationsBatch,
} from "@/actions/applications";
import type {
  ApplicationInput,
  BatchApplicationInput,
} from "@/lib/validations";

type BatchSendResult = {
  index: number;
  status: "sent" | "failed";
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
        toast.success("Application sent!");
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

        const sentCount = result.results.filter(
          (item) => item.status === "sent",
        ).length;
        const failedCount = result.results.length - sentCount;

        if (failedCount > 0) {
          toast.error(
            `Batch finished: ${sentCount} accepted, ${failedCount} failed. Review the recipient results.`,
          );
        } else {
          toast.success(`${sentCount} applications accepted by Resend.`);
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
