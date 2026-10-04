"use client";

import { FormEvent, useState } from "react";
import { AlertCircle, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api, ApiError, errorMessage } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { SettingsCard } from "./SettingsCard";

export function WorkspaceForm() {
  const { session, can, refresh } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(session?.workspace.name ?? "");
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!session) return null;

  const canManage = can("settings:manage");
  const dirty = name.trim() !== session.workspace.name;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError("Workspace name must be at least 2 characters");
      return;
    }
    setError(undefined);
    setFormError(null);
    setSaving(true);
    try {
      await api.put("/settings/workspace", { name: name.trim() });
      await refresh();
      toast.success("Workspace updated.");
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors?.name) setError(err.fieldErrors.name[0]);
      setFormError(errorMessage(err, "Unable to update the workspace. Please check your connection and try again."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsCard title="Workspace" description="The name your whole team sees across TaskFlow.">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {formError}
          </div>
        )}
        <Input
          label="Workspace name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error}
          disabled={!canManage}
        />
        {canManage ? (
          <div className="flex justify-end">
            <Button type="submit" loading={saving} disabled={!dirty}>
              Save changes
            </Button>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-slate-400">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            Only owners and admins can change workspace settings.
          </div>
        )}
      </form>
    </SettingsCard>
  );
}