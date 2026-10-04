import Link from "next/link";
import { CheckCheck } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { PriorityBadge } from "@/components/ui/Badges";
import type { MyTask } from "@/types";

export function MyTasks({ tasks }: { tasks: MyTask[] }) {
  return (
    <section className="surface p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">My tasks</h3>
        <Link href="/tasks?assignedTo=me" className="text-xs font-medium text-brand-light transition hover:text-white">
          View all
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <CheckCheck className="h-8 w-8 text-emerald-400/80" />
          <p className="mt-3 text-sm font-medium text-slate-200">You&apos;re all caught up</p>
          <p className="mt-0.5 text-xs text-slate-500">No open tasks are assigned to you.</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {tasks.map((task) => {
            const overdue = !!task.dueDate && new Date(task.dueDate) < new Date();
            return (
              <li key={task.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition hover:bg-white/[0.04]">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-slate-100">{task.title}</p>
                  <PriorityBadge priority={task.priority} />
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-3 text-xs">
                  <span className="truncate text-slate-500">{task.project.name}</span>
                  <span className={cn("shrink-0", overdue ? "font-medium text-red-400" : "text-slate-400")}>
                    {task.dueDate ? (overdue ? "Overdue \u00b7 " : "Due ") + formatDate(task.dueDate) : "No due date"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}