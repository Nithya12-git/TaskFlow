"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";

const tones = {
  violet: "bg-violet-500/15 text-violet-300 ring-violet-400/20",
  blue: "bg-blue-500/15 text-blue-300 ring-blue-400/20",
  emerald: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/20",
  amber: "bg-amber-500/15 text-amber-300 ring-amber-400/20",
  red: "bg-red-500/15 text-red-300 ring-red-400/20",
  slate: "bg-slate-500/15 text-slate-300 ring-slate-400/20",
} as const;

export function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  href,
  alert,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: keyof typeof tones;
  href: string;
  alert?: boolean;
}) {
  const shown = useCountUp(value);

  return (
    <Link
      href={href}
      className={cn(
        "surface group block p-4 transition hover:-translate-y-0.5 hover:border-white/15 sm:p-5",
        alert && "border-red-400/25"
      )}
    >
      <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl ring-1", tones[tone])}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-white">{shown}</p>
      <p className="mt-0.5 text-sm text-slate-400 transition group-hover:text-slate-300">{label}</p>
    </Link>
  );
}