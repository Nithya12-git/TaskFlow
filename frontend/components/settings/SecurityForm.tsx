"use client";

import { FormEvent, useState } from "react";
import { AlertCircle, Check, Circle, ShieldCheck } from "lucide-react";
import { api, ApiError, errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { SettingsCard } from "./SettingsCard";

type Errors = Partial<Record<"currentPassword" | "newPassword" | "confirm", string>>;

export function SecurityForm() {
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const checks = [
    { label: "At least 8 characters", ok: newPassword.length >= 8 },
    { label: "Contains a letter", ok: /[A-Za-z]/.test(newPassword) },
    { label: "Contains a number", ok: /\d/.test(newPassword) },
  ];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    if (!currentPassword) next.currentPassword = "Enter your current password";
    if (!checks.every((c) => c.ok)) next.newPassword = "Password doesn\u2019t meet the requirements";
    if (confirm !== newPassword) next.confirm = "Passwords don\u2019t match";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setFormError(null);
    setSaving(true);
    try {
      await api.put("/settings/password", { currentPassword, newPassword });
      toast.success("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        setErrors({
          currentPassword: err.fieldErrors.currentPassword?.[0],
          newPassword: err.fieldErrors.newPassword?.[0],
        });
      }
      setFormError(errorMessage(err, "Unable to update your password. Please check your connection and try again."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <SettingsCard title="Change password" description="Use a strong password you don't use anywhere else.">
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {formError && (
            <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {formError}
            </div>
          )}
          <Input label="Current password" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} error={errors.currentPassword} />
          <div>
            <Input label="New password" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} error={errors.newPassword} />
            <ul className="mt-2 space-y-1">
              {checks.map((c) => (
                <li key={c.label} className={cn("flex items-center gap-2 text-xs transition", c.ok ? "text-emerald-400" : "text-slate-500")}>
                  {c.ok ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                  {c.label}
                </li>
              ))}
            </ul>
          </div>
          <Input label="Confirm new password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} />
          <div className="flex justify-end">
            <Button type="submit" loading={saving}>
              Update password
            </Button>
          </div>
        </form>
      </SettingsCard>

      <SettingsCard title="How your account is protected">
        <ul className="space-y-3 text-sm text-slate-300">
          {[
            "Passwords are hashed with bcrypt and never stored in plain text.",
            "Your session lives in a secure httpOnly cookie that scripts can't read.",
            "Every request is checked against your role and your workspace on the server.",
          ].map((line) => (
            <li key={line} className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              {line}
            </li>
          ))}
        </ul>
      </SettingsCard>
    </div>
  );
}