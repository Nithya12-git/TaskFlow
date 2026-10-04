"use client";

import { Check, ChevronDown } from "lucide-react";
import { cn, TASK_STATUS_LABEL } from "@/lib/utils";
import { TaskStatusBadge } from "@/components/ui/Badges";
import { Popover } from "@/components/ui/Popover";
import type { TaskStatus } from "@/types";

const ORDER: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"];

export function StatusMenu({
  status,
  disabled,
  onChange,
}: {
  status: TaskStatus;
  disabled?: boolean;
  onChange: (status: TaskStatus) => void;
}) {
  if (disabled) return <TaskStatusBadge status={status} />;

  return (
    <Popover
      align="left"
      panelClassName="w-44 p-1.5"
      trigger={({ toggle }) => (
        <button
          onClick={toggle}
          aria-label="Change status"
          className="group inline-flex items-center gap-1 rounded-full transition hover:opacity-90"
        >
          <TaskStatusBadge status={status} />
          <ChevronDown className="h-3.5 w-3.5 text-slate-500 transition group-hover:text-slate-300" />
        </button>
      )}
    >
      {(close) => (
        <>
          {ORDER.map((s) => (
            <button
              key={s}
              onClick={() => {
                close();
                if (s !== status) onChange(s);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition hover:bg-white/[0.06]",
                s === status ? "text-white" : "text-slate-300"
              )}
            >
              {TASK_STATUS_LABEL[s]}
              {s === status && <Check className="h-4 w-4 text-brand-light" />}
            </button>
          ))}
        </>
      )}
    </Popover>
  );
}