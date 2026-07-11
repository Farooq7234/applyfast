"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
} from "@/actions/templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Plus,
  Pencil,
  Trash2,
  Star,
  X,
  Loader2,
  FileText,
} from "lucide-react";
import { Template } from "@prisma/client";

// ─── Variable tokens shown as helpers ─────────────────────────────────────────
const VARIABLES = [
  "{{recruiter_name}}",
  "{{role}}",
  "{{company}}",
  "{{portfolio}}",
  "{{resume}}",
  "{{name}}",
];

// ─── Inline form (create or edit) ─────────────────────────────────────────────
interface TemplateFormProps {
  initial?: Template;
  onSave: (data: {
    name: string;
    subject: string;
    body: string;
    isDefault: boolean;
  }) => void | Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

function TemplateForm({ initial, onSave, onCancel, saving }: TemplateFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);

  // Insert a variable token at cursor position in the textarea
  function insertVariable(textarea: HTMLTextAreaElement | null, token: string) {
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const next = body.slice(0, start) + token + body.slice(end);
    setBody(next);
    // Restore cursor after token
    requestAnimationFrame(() => {
      textarea.selectionStart = textarea.selectionEnd = start + token.length;
      textarea.focus();
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ name, subject, body, isDefault });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tpl-name">Template Name *</Label>
          <Input
            id="tpl-name"
            placeholder="e.g. Active Opening"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tpl-subject">Subject *</Label>
          <Input
            id="tpl-subject"
            placeholder="e.g. Application for {{role}} at {{company}}"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Variable helpers */}
      <div className="flex flex-col gap-1.5">
        <Label>Insert Variable</Label>
        <div className="flex flex-wrap gap-1.5">
          {VARIABLES.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                const ta = document.getElementById("tpl-body") as HTMLTextAreaElement | null;
                insertVariable(ta, v);
              }}
              className="rounded border border-border bg-muted px-2 py-0.5 text-xs font-mono hover:bg-secondary transition-colors"
            >
              {v}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Click a variable to insert it at the cursor position in the body.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tpl-body">Body *</Label>
        <Textarea
          id="tpl-body"
          rows={14}
          placeholder="Write your email body here. Use {{role}}, {{company}}, {{recruiter_name}} etc."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="font-mono text-sm resize-y"
          required
        />
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="h-4 w-4 rounded border border-border accent-primary"
        />
        Set as default template
      </label>

      <div className="flex gap-2">
        <Button type="submit" disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {initial ? "Save Changes" : "Create Template"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ─── Main list ────────────────────────────────────────────────────────────────
interface TemplatesListProps {
  templates: Template[];
}

export function TemplatesList({ templates: initial }: TemplatesListProps) {
  const [templates, setTemplates] = useState<Template[]>(initial);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function refreshFromServer() {
    // Force a full server re-render to get fresh data
    window.location.reload();
  }

  function handleCreate(data: { name: string; subject: string; body: string; isDefault: boolean }) {
    startTransition(async () => {
      const result = await createTemplate(data);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Template created");
      setCreating(false);
      refreshFromServer();
    });
  }

  function handleUpdate(
    id: string,
    data: { name: string; subject: string; body: string; isDefault: boolean }
  ) {
    startTransition(async () => {
      const result = await updateTemplate(id, data);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Template updated");
      setEditingId(null);
      refreshFromServer();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteTemplate(id);
      if (result.error) {
        toast.error(result.error);
        setDeleteId(null);
        return;
      }
      toast.success("Template deleted");
      setDeleteId(null);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    });
  }

  function handleSetDefault(id: string) {
    startTransition(async () => {
      const result = await setDefaultTemplate(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Default template updated");
      setTemplates((prev) =>
        prev.map((t) => ({ ...t, isDefault: t.id === id }))
      );
    });
  }

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      {/* Create new button */}
      {!creating && (
        <Button
          onClick={() => { setCreating(true); setEditingId(null); }}
          size="sm"
          className="self-start gap-1.5"
        >
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      )}

      {/* Create form */}
      {creating && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">New Template</CardTitle>
          </CardHeader>
          <CardContent>
            <TemplateForm
              onSave={handleCreate}
              onCancel={() => setCreating(false)}
              saving={isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* Template cards */}
      {templates.length === 0 && !creating && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <FileText className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">No templates yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first template to get started
          </p>
        </div>
      )}

      {templates.map((template) => (
        <Card key={template.id} className="relative">
          {editingId === template.id ? (
            <>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Edit Template</CardTitle>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-md p-1 text-muted-foreground hover:bg-secondary"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <TemplateForm
                  initial={template}
                  onSave={(data) => handleUpdate(template.id, data)}
                  onCancel={() => setEditingId(null)}
                  saving={isPending}
                />
              </CardContent>
            </>
          ) : (
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{template.name}</span>
                    {template.isDefault && (
                      <Badge variant="secondary" className="text-xs">Default</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {template.subject}
                  </p>
                  <pre className="mt-2 max-h-32 overflow-hidden rounded-md bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap line-clamp-4">
                    {template.body}
                  </pre>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!template.isDefault && (
                    <button
                      onClick={() => handleSetDefault(template.id)}
                      disabled={isPending}
                      title="Set as default"
                      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => { setEditingId(template.id); setCreating(false); }}
                    title="Edit"
                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {!template.isDefault && (
                    <button
                      onClick={() => setDeleteId(template.id)}
                      disabled={isPending}
                      title="Delete"
                      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. The default template cannot be deleted.
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
    </div>
  );
}
