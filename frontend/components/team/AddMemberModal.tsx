"use client";

import { FormEvent, useEffect, useState } from "react";
import { AlertCircle, Check, Copy, RefreshCw } from "lucide-react";
import { api, ApiError, errorMessage } from "@/lib/api";
import { ROLE_LABEL } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { Role } from "@/types";
import { ROLE_DESCRIPTION } from "./roleInfo";

type AssignableRole = Exclude<Role, "OWNER">;

function generatePassword() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const all = letters + digits;
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (b) => all[b % all.length]);
  chars[0] = letters[bytes[0] % letters.length];
  chars[1] = digits[bytes[1] % digits.length];
  return chars.join("");
}

type FieldErrors = Partial<Record<"name" | "email" | "password" | "role", string>>;

export function AddMemberModal({
  open,
  canAddAdmin,
  onClose,
  onSaved,
}: {
  open: boolean;
  canAddAdmin: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AssignableRole>("MEMBER");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{ name: string; email: string; password: string; role: AssignableRole } | null>(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    setName("");
    setEmail("");
    setPassword(generatePassword());
    setRole("MEMBER");
    setErrors({});
    setFormError(null);
    setSaving(false);
    setCreated(null);
    setCopied(false);
  }

  useEffect(() => {
    if (open) reset();
  }, [open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: FieldErrors = {};
    if (name.trim().length < 2) next.name = "Name must be at least 2 characters";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "Enter a valid email address";
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      next.password = "Use at least 8 characters, with a letter and a number";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setFormError(null);
    setSaving(true);
    try {
      await api.post("/team", { name: name.trim(), email: email.trim(), password, role });
      setCreated({ name: name.trim(), email: email.trim().toLowerCase(), password, role });
      toast.success(`${name.trim()} was added to the team.`);
      onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        setErrors({
          name: err.fieldErrors.name?.[0],
          email: err.fieldErrors.email?.[0],
          password: err.fieldErrors.password?.[0],
          role: err.fieldErrors.role?.[0],
        });
      }
      if (err instanceof ApiError && err.status === 409) setErrors((prev) => ({ ...prev, email: err.message }));
      setFormError(errorMessage(err, "Unable to add the member. Please check your connection and try again."));
    } finally {
      setSaving(false);
    }
  }

  async function copyDetails() {
    if (!created) return;
    const text = `Sign in: ${window.location.origin}/login\nEmail: ${created.email}\nTemporary password: ${created.password}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy automatically. Please select the text and copy it manually.");
    }
  }

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      title={created ? "Member added" : "Add team member"}
      description={created ? undefined : "Create an account for a teammate and choose their role."}
      footer={
        created ? (
          <>
            <Button variant="secondary" onClick={reset}>
              Add another
            </Button>
            <Button onClick={onClose}>Done</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="member-form" loading={saving}>
              Add member
            </Button>
          </>
        )
      }
    >
      {created ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            <Check className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              <span className="font-medium">{created.name}</span> joined as {ROLE_LABEL[created.role]}.
            </p>
          </div>
          <p className="text-sm text-slate-400">
            There is no email system yet, so share these sign-in details with them directly. They can sign in right away.
          </p>
          <dl className="space-y-3 rounded-xl border border-white/10 bg-ink-900 p-4 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wider text-slate-500">Email</dt>
              <dd className="mt-0.5 break-all font-mono text-slate-100">{created.email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-slate-500">Temporary password</dt>
              <dd className="mt-0.5 break-all font-mono text-slate-100">{created.password}</dd>
            </div>
          </dl>
          <Button variant="secondary" icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} onClick={copyDetails}>
            {copied ? "Copied" : "Copy details"}
          </Button>
        </div>
      ) : (
        <form id="member-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          {formError && (
            <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {formError}
            </div>
          )}
          <Input label="Full name" placeholder="Jordan Lee" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoFocus />
          <Input label="Email" type="email" placeholder="jordan@company.com" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
          <div>
            <Input
              label="Temporary password"
              autoComplete="off"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              hint="Shown once after you add them. They can keep using it."
            />
            <button
              type="button"
              onClick={() => setPassword(generatePassword())}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-brand-light transition hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Generate a new one
            </button>
          </div>
          <Select
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value as AssignableRole)}
            error={errors.role}
            hint={ROLE_DESCRIPTION[role]}
          >
            {canAddAdmin && <option value="ADMIN">{ROLE_LABEL.ADMIN}</option>}
            <option value="MEMBER">{ROLE_LABEL.MEMBER}</option>
            <option value="GUEST">{ROLE_LABEL.GUEST}</option>
          </Select>
        </form>
      )}
    </Modal>
  );
}