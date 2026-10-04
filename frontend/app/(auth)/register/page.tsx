"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Check, Circle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

type Errors = Partial<Record<"name" | "email" | "workspaceName" | "password", string>>;

export default function RegisterPage() {
  const { session, loading, register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", workspaceName: "", password: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) router.replace("/dashboard");
  }, [loading, session, router]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const checks = [
    { label: "At least 8 characters", ok: form.password.length >= 8 },
    { label: "Contains a letter", ok: /[A-Za-z]/.test(form.password) },
    { label: "Contains a number", ok: /\d/.test(form.password) },
  ];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const next: Errors = {};
    if (form.name.trim().length < 2) next.name = "Name must be at least 2 characters";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = "Enter a valid email address";
    if (form.workspaceName.trim().length < 2) next.workspaceName = "Workspace name must be at least 2 characters";
    if (!checks.every((c) => c.ok)) next.password = "Password doesn\u2019t meet the requirements";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        workspaceName: form.workspaceName.trim(),
        password: form.password,
      });
      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        const fe = err.fieldErrors;
        setErrors({
          name: fe.name?.[0],
          email: fe.email?.[0],
          workspaceName: fe.workspaceName?.[0],
          password: fe.password?.[0],
        });
      }
      setFormError(err instanceof ApiError ? err.message : "Unable to create your account. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight text-white">Create your workspace</h2>
      <p className="mt-1 text-sm text-slate-400">You&apos;ll be the owner. Invite your team afterwards.</p>

      {formError && (
        <div role="alert" className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <Input label="Your name" autoComplete="name" placeholder="Alex Morgan" value={form.name} onChange={set("name")} error={errors.name} />
        <Input label="Work email" type="email" autoComplete="email" placeholder="alex@company.com" value={form.email} onChange={set("email")} error={errors.email} />
        <Input label="Workspace name" placeholder="Acme Inc" value={form.workspaceName} onChange={set("workspaceName")} error={errors.workspaceName} />
        <div>
          <Input label="Password" type="password" autoComplete="new-password" placeholder="Create a password" value={form.password} onChange={set("password")} error={errors.password} />
          <ul className="mt-2 space-y-1">
            {checks.map((c) => (
              <li key={c.label} className={cn("flex items-center gap-2 text-xs transition", c.ok ? "text-emerald-400" : "text-slate-500")}>
                {c.ok ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                {c.label}
              </li>
            ))}
          </ul>
        </div>
        <Button type="submit" className="w-full" loading={submitting}>
          Create workspace <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-light transition hover:text-white">
          Sign in
        </Link>
      </p>
    </div>
  );
}