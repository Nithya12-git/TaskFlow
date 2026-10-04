"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: Array<{ value: T; label: string; icon?: LucideIcon }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist">
      <div className="inline-flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              role="tab"
              aria-selected={value === tab.value}
              onClick={() => onChange(tab.value)}
              className={cn(
                "inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition",
                value === tab.value ? "bg-white/[0.1] text-white" : "text-slate-400 hover:text-slate-200"
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}