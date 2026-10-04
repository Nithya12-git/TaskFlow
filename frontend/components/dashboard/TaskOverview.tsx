import { cn, PRIORITY_LABEL, TASK_STATUS_LABEL } from "@/lib/utils";
import type { TaskPriority, TaskStatus } from "@/types";
import { CompletionRing } from "./CompletionRing";

const STATUS_ORDER: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"];
const PRIORITY_ORDER: TaskPriority[] = ["URGENT", "HIGH", "MEDIUM", "LOW"];

const statusBar: Record<TaskStatus, string> = {
  TODO: "bg-slate-500",
  IN_PROGRESS: "bg-blue-500",
  REVIEW: "bg-amber-400",
  COMPLETED: "bg-emerald-500",
};

const priorityBar: Record<TaskPriority, string> = {
  LOW: "bg-slate-500",
  MEDIUM: "bg-blue-500",
  HIGH: "bg-orange-500",
  URGENT: "bg-red-500",
};

export function TaskOverview({
  total,
  completionRate,
  byStatus,
  byPriority,
}: {
  total: number;
  completionRate: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
}) {
  const maxPriority = Math.max(1, ...Object.values(byPriority));

  return (
    <section className="surface p-5 sm:p-6">
      <div className="flex items-baseline justify-between">
        <h3 className="text-base font-semibold text-white">Task overview</h3>
        <span className="text-xs text-slate-500">{total} total</span>
      </div>

      <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center">
        <CompletionRing percent={completionRate} label="complete" />

        <div className="flex-1 space-y-4">
          <div className="flex h-3 overflow-hidden rounded-full bg-white/[0.06]">
            {total > 0 &&
              STATUS_ORDER.map((s) => (
                <div
                  key={s}
                  className={cn("h-full transition-all duration-700", statusBar[s])}
                  style={{ width: `${(byStatus[s] / total) * 100}%` }}
                />
              ))}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {STATUS_ORDER.map((s) => (
              <div key={s} className="flex items-center gap-2.5 text-sm">
                <span className={cn("h-2.5 w-2.5 rounded-full", statusBar[s])} />
                <span className="text-slate-400">{TASK_STATUS_LABEL[s]}</span>
                <span className="ml-auto font-medium text-slate-100">{byStatus[s]}</span>
              </div>
            ))}
          </div>
          {total === 0 && <p className="text-xs text-slate-500">No tasks yet. Create one to see progress here.</p>}
        </div>
      </div>

      <div className="mt-6 border-t border-white/[0.06] pt-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">Open tasks by priority</p>
        <div className="space-y-2.5">
          {PRIORITY_ORDER.map((p) => (
            <div key={p} className="flex items-center gap-3 text-sm">
              <span className="w-16 text-slate-400">{PRIORITY_LABEL[p]}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={cn("h-full rounded-full transition-all duration-700", priorityBar[p])}
                  style={{ width: `${(byPriority[p] / maxPriority) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right font-medium text-slate-100">{byPriority[p]}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}