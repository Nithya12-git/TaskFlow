"use client";

import { FormEvent, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api, ApiError, errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { RoleBadge } from "@/components/ui/Badges";
import { Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { SettingsCard } from "./SettingsCard";

export function ProfileForm() {
  const { session, refresh } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(session?.user.name ?? "");
  const [email, setEmail] = useState(session?.user.email ?? "");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!session) return null;

  const dirty = name.trim() !== session.user.name || email.trim().toLowerCase() !== session.user.email;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = "Name must be at least 2 characters";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "Enter a valid email address";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setFormError(null);
    setSaving(true);
    try {
      await api.put("/settings/profile", { name: name.trim(), email: email.trim() });
      await refresh();
      toast.success("Profile updated.");
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        setErrors({ name: err.fieldErrors.name?.[0], email: err.fieldErrors.email?.[0] });
      }
      if (err instanceof ApiError && err.status === 409) setErrors((p) => ({ ...p, email: err.message }));
      setFormError(errorMessage(err, "Unable to update your profile. Please check your connection and try again."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsCard title="Profile" description="Your personal details, visible to teammates in this workspace.">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {formError}
          </div>
        )}
        <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm">
          <span className="flex items-center gap-2 text-slate-400">
            Role <RoleBadge role={session.role} />
          </span>
          <span className="text-slate-400">Account created {formatDate(session.user.createdAt)}</span>
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={saving} disabled={!dirty}>
            Save changes
          </Button>
        </div>
      </form>
    </SettingsCard>
  );
}