"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { createApplication } from "@/actions/applications";
import type { ApplicationInput } from "@/lib/validations";

export function useSendApplication() {
  const [isPending, startTransition] = useTransition();

  const sendApplication = async (
    data: ApplicationInput,
    onSuccess?: () => void,
  ) => {
    startTransition(async () => {
      const result = await createApplication(data);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Application sent!");
      onSuccess?.();
    });
  };

  return { isPending, sendApplication };
}
