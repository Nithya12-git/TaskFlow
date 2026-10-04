"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

const DEMO_PASSWORD = "Password123!";
const DEMO = [
  { label: "Owner", email: "owner@taskflow.dev" },
  { label: "Admin", email: "admin@taskflow.dev" },
  { label: "Member", email: "member@taskflow.dev" },
  { label: "Guest", email: "guest@taskflow.dev" },
];

export default function LoginPage() {
  const { session, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && session) router.replace("/dashboard");
  }, [loading, session, router]);

  async function signIn(emailValue: string, passwordValue: string, key: string) {
    setFormError(null);
    setSubmitting(key);
    try {
      await login(emailValue, passwordValue);
      router.replace("/dashboard");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Unable to sign in. Please try again.");
      setSubmitting(null);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "Enter a valid email address";
    if (!password) next.password = "Password is required";
    setErrors(next);
    if (Object.keys(next).length === 0) signIn(email.trim(), password, "form");
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight text-white">Welcome back</h2>
      <p className="mt-1 text-sm text-slate-400">Sign in to your workspace.</p>

      {formError && (
        <div role="alert" className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <Button type="submit" className="w-full" loading={submitting === "form"} disabled={!!submitting}>
          Sign in <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <div className="mt-8">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="h-px flex-1 bg-white/[0.08]" />
          Try a demo account
          <span className="h-px flex-1 bg-white/[0.08]" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {DEMO.map((d) => (
            <Button
              key={d.email}
              variant="secondary"
              size="sm"
              loading={submitting === d.email}
              disabled={!!submitting}
              onClick={() => signIn(d.email, DEMO_PASSWORD, d.email)}
            >
              {d.label}
            </Button>
          ))}
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-slate-400">
        New to TaskFlow?{" "}
        <Link href="/register" className="font-medium text-brand-light transition hover:text-white">
          Create a workspace
        </Link>
      </p>
    </div>
  );
}