"use client";

import { FormEvent, useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { api, ApiError, errorMessage } from "@/lib/api";
import { PROJECT_STATUS_LABEL } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { Project, ProjectStatus } from "@/types";

const STATUSES = Object.keys(PROJECT_STATUS_LABEL) as ProjectStatus[];

export function ProjectFormModal({
  open,
  project,
  onClose,
  onSaved,
}: {
  open: boolean;
  project?: Project | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const editing = !!project;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("ACTIVE");
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(project?.name ?? "");
    setDescription(project?.description ?? "");
    setStatus(project?.status ?? "ACTIVE");
    setErrors({});
    setFormError(null);
    setSaving(false);
  }, [open, project]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setErrors({ name: "Project name must be at least 2 characters" });
      return;
    }
    setErrors({});
    setFormError(null);
    setSaving(true);

    const body = { name: trimmed, description: description.trim() || null, status };
    try {
      if (project) await api.put(`/projects/${project.id}`, body);
      else await api.post("/projects", body);
      toast.success(editing ? "Project updated." : "Project created.");
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        setErrors({ name: err.fieldErrors.name?.[0], description: err.fieldErrors.description?.[0] });
      }
      setFormError(
        errorMessage(
          err,
          `Unable to ${editing ? "update" : "create"} the project. Please check your connection and try again.`
        )
      );
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      title={editing ? "Edit project" : "New project"}
      description={editing ? "Update the details of this project." : "Set up a new project for your team."}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="project-form" loading={saving}>
            {editing ? "Save changes" : "Create project"}
          </Button>
        </>
      }
    >
      <form id="project-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {formError}
          </div>
        )}
        <Input
          label="Project name"
          placeholder="e.g. Website Redesign"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          autoFocus
        />
        <Textarea
          label="Description"
          placeholder="What is this project about?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={errors.description}
          maxLength={1000}
        />
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {PROJECT_STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
      </form>
    </Modal>
  );
}