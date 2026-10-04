"use client";

import { Calendar, CheckCircle2, Circle } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { PriorityBadge } from "@/components/ui/Badges";
import type { Task, TaskStatus } from "@/types";
import { StatusMenu } from "./StatusMenu";
import { TaskActions } from "./TaskActions";

export function TaskListRow({
  task,
  canUpdate,
  canDelete,
  onStatusChange,
  onEdit,
  onDelete,
}: {
  task: Task;
  canUpdate: boolean;
  canDelete: boolean;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const done = task.status === "COMPLETED";

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 transition hover:bg-white/[0.04] md:flex-row md:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <button
          onClick={() => onStatusChange(task, done ? "TODO" : "COMPLETED")}
          disabled={!canUpdate}
          aria-label={done ? "Mark as not completed" : "Mark as completed"}
          className="mt-0.5 shrink-0 text-slate-600 transition enabled:hover:text-emerald-400 disabled:cursor-default"
        >
          {done ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <Circle className="h-5 w-5" />}
        </button>
        <div className="min-w-0">
          {canUpdate ? (
            <button
              onClick={() => onEdit(task)}
              className={cn(
                "text-left text-sm font-medium transition hover:text-white",
                done ? "text-slate-500 line-through" : "text-slate-100"
              )}
            >
              {task.title}
            </button>
          ) : (
            <p className={cn("text-sm font-medium", done ? "text-slate-500 line-through" : "text-slate-100")}>
              {task.title}
            </p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="text-slate-500">{task.project.name}</span>
            {task.dueDate && (
              <span className={cn("inline-flex items-center gap-1", task.isOverdue ? "font-medium text-red-400" : "text-slate-500")}>
                <Calendar className="h-3 w-3" />
                {task.isOverdue ? "Overdue \u00b7 " : ""}
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pl-8 md:pl-0">
        <PriorityBadge priority={task.priority} />
        <StatusMenu status={task.status} disabled={!canUpdate} onChange={(s) => onStatusChange(task, s)} />
        {task.assignee ? (
          <span className="flex items-center gap-2 text-xs text-slate-400" title={task.assignee.name}>
            <Avatar name={task.assignee.name} size="sm" />
            <span className="hidden max-w-[7rem] truncate lg:inline">{task.assignee.name}</span>
          </span>
        ) : (
          <span className="text-xs text-slate-600">Unassigned</span>
        )}
        <TaskActions task={task} canEdit={canUpdate} canDelete={canDelete} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </li>
  );
}