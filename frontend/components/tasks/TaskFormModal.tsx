"use client";

import { FormEvent, useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { api, ApiError, errorMessage } from "@/lib/api";
import { fromDateInputValue, toDateInputValue } from "@/lib/dates";
import { PRIORITY_LABEL, ROLE_LABEL, TASK_STATUS_LABEL } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { Member, Project, Task, TaskPriority, TaskStatus } from "@/types";

const STATUSES = Object.keys(TASK_STATUS_LABEL) as TaskStatus[];
const PRIORITIES = Object.keys(PRIORITY_LABEL) as TaskPriority[];

type FieldErrors = Partial<Record<"title" | "projectId" | "description" | "dueDate" | "assignedTo", string>>;

interface FormState {
  title: string;
  description: string;
  projectId: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assignedTo: string;
}

export function TaskFormModal({
  open,
  task,
  defaultProjectId,
  projects,
  members,
  onClose,
  onSaved,
}: {
  open: boolean;
  task?: Task | null;
  defaultProjectId?: string;
  projects: Project[];
  members: Member[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const editing = !!task;

  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    projectId: "",
    status: "TODO",
    priority: "MEDIUM",
    dueDate: "",
    assignedTo: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      title: task?.title ?? "",
      description: task?.description ?? "",
      projectId: task?.projectId ?? defaultProjectId ?? "",
      status: task?.status ?? "TODO",
      priority: task?.priority ?? "MEDIUM",
      dueDate: toDateInputValue(task?.dueDate),
      assignedTo: task?.assignedTo ?? "",
    });
    setErrors({});
    setFormError(null);
    setSaving(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task?.id, defaultProjectId]);

  // If projects finish loading after the modal opened, pick a sensible default.
  useEffect(() => {
    if (open && !editing && !form.projectId && projects.length > 0) {
      setForm((f) => ({ ...f, projectId: projects[0].id }));
    }
  }, [open, editing, form.projectId, projects]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: FieldErrors = {};
    if (form.title.trim().length < 2) next.title = "Title must be at least 2 characters";
    if (!editing && !form.projectId) next.projectId = "Choose a project";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setFormError(null);
    setSaving(true);

    const body = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate ? fromDateInputValue(form.dueDate) : null,
      assignedTo: form.assignedTo || null,
    };

    try {
      if (task) await api.put(`/tasks/${task.id}`, body);
      else await api.post("/tasks", { ...body, projectId: form.projectId });
      toast.success(editing ? "Task updated." : "Task created.");
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        setErrors({
          title: err.fieldErrors.title?.[0],
          projectId: err.fieldErrors.projectId?.[0],
          description: err.fieldErrors.description?.[0],
          dueDate: err.fieldErrors.dueDate?.[0],
          assignedTo: err.fieldErrors.assignedTo?.[0],
        });
      }
      setFormError(
        errorMessage(
          err,
          `Unable to ${editing ? "update" : "create"} the task. Please check your connection and try again.`
        )
      );
      setSaving(false);
    }
  }

  const noProjects = !editing && projects.length === 0;

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      title={editing ? "Edit task" : "New task"}
      description={editing ? "Update the details of this task." : "Add a task and assign it to a teammate."}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="task-form" loading={saving} disabled={noProjects}>
            {editing ? "Save changes" : "Create task"}
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {formError}
          </div>
        )}
        {noProjects && (
          <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Create a project first. Every task belongs to a project.
          </div>
        )}

        <Input
          label="Title"
          placeholder="e.g. Design the pricing page"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          error={errors.title}
          autoFocus
        />
        <Textarea
          label="Description"
          placeholder="Add some detail (optional)"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          error={errors.description}
          maxLength={2000}
        />

        <Select
          label="Project"
          value={form.projectId}
          onChange={(e) => set("projectId", e.target.value)}
          error={errors.projectId}
          disabled={editing}
          hint={editing ? "A task can't be moved to another project." : undefined}
        >
          {!form.projectId && <option value="">Select a project</option>}
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Status" value={form.status} onChange={(e) => set("status", e.target.value as TaskStatus)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {TASK_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
          <Select label="Priority" value={form.priority} onChange={(e) => set("priority", e.target.value as TaskPriority)}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </option>
            ))}
          </Select>
          <Input
            label="Due date"
            type="date"
            value={form.dueDate}
            onChange={(e) => set("dueDate", e.target.value)}
            error={errors.dueDate}
          />
          <Select
            label="Assignee"
            value={form.assignedTo}
            onChange={(e) => set("assignedTo", e.target.value)}
            error={errors.assignedTo}
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.name} ({ROLE_LABEL[m.role]})
              </option>
            ))}
          </Select>
        </div>
      </form>
    </Modal>
  );
}