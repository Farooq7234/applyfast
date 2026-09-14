"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { createTarget } from "@/actions/targets"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function AddTargetDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (id: string) => void
}) {
  const [name, setName] = useState("")
  const [website, setWebsite] = useState("")
  const [isPending, startTransition] = useTransition()

  function reset() {
    setName("")
    setWebsite("")
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const result = await createTarget({ name, website })
      if (result.error) {
        toast.error(result.error)
        return
      }
      if (result.id) {
        toast.success("Company added")
        reset()
        onOpenChange(false)
        onCreated(result.id)
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Add target company</DialogTitle>
            <DialogDescription>
              Name and website are enough. You can fill research notes in the drawer.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="target-name">Name</Label>
            <Input
              id="target-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Acme"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="target-website">Website</Label>
            <Input
              id="target-website"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              placeholder="acme.com"
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding…" : "Add company"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
