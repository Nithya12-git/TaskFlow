"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { PriorityBadge, TaskStatusBadge } from "@/components/ui/Badges";
import type { Task, TaskStatus } from "@/types";
import { StatusMenu } from "./StatusMenu";
import { TaskActions } from "./TaskActions";

const COLUMNS: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"];

export function TaskBoard({
  tasks,
  canUpdate,
  canDelete,
  onStatusChange,
  onEdit,
  onDelete,
}: {
  tasks: Task[];
  canUpdate: boolean;
  canDelete: boolean;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {COLUMNS.map((status) => {
        const column = tasks.filter((t) => t.status === status);
        const highlighted = overColumn === status && dragId !== null;

        return (
          <section
            key={status}
            onDragOver={(e) => {
              if (!canUpdate) return;
              e.preventDefault();
              setOverColumn(status);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverColumn(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/plain") || dragId;
              setOverColumn(null);
              setDragId(null);
              const task = tasks.find((t) => t.id === id);
              if (task && task.status !== status) onStatusChange(task, status);
            }}
            className={cn(
              "flex min-h-[160px] flex-col rounded-2xl border p-3 transition",
              highlighted ? "border-brand/50 bg-brand/[0.06]" : "border-white/[0.07] bg-ink-800/50"
            )}
          >
            <header className="mb-3 flex items-center justify-between px-1">
              <TaskStatusBadge status={status} />
              <span className="text-xs font-medium text-slate-500">{column.length}</span>
            </header>

            <div className="flex flex-1 flex-col gap-2.5">
              {column.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-white/[0.08] px-3 py-6 text-center text-xs text-slate-600">
                  {canUpdate ? "Drop a task here" : "No tasks"}
                </div>
              ) : (
                column.map((task) => (
                  <article
                    key={task.id}
                    draggable={canUpdate}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", task.id);
                      e.dataTransfer.effectAllowed = "move";
                      setDragId(task.id);
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverColumn(null);
                    }}
                    className={cn(
                      "rounded-xl border border-white/[0.08] bg-ink-700/80 p-3.5 shadow-sm transition hover:border-white/20",
                      canUpdate && "cursor-grab active:cursor-grabbing",
                      dragId === task.id && "opacity-40"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      {canUpdate ? (
                        <button
                          onClick={() => onEdit(task)}
                          className={cn(
                            "text-left text-sm font-medium transition hover:text-white",
                            task.status === "COMPLETED" ? "text-slate-500 line-through" : "text-slate-100"
                          )}
                        >
                          {task.title}
                        </button>
                      ) : (
                        <p className="text-sm font-medium text-slate-100">{task.title}</p>
                      )}
                      <div className="-mr-1.5 -mt-1 shrink-0">
                        <TaskActions task={task} canEdit={canUpdate} canDelete={canDelete} onEdit={onEdit} onDelete={onDelete} />
                      </div>
                    </div>

                    <p className="mt-1 truncate text-xs text-slate-500">{task.project.name}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <PriorityBadge priority={task.priority} />
                      {task.dueDate && (
                        <span className={cn("inline-flex items-center gap-1 text-xs", task.isOverdue ? "font-medium text-red-400" : "text-slate-500")}>
                          <Calendar className="h-3 w-3" />
                          {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
                      <StatusMenu status={task.status} disabled={!canUpdate} onChange={(s) => onStatusChange(task, s)} />
                      {task.assignee ? (
                        <span title={task.assignee.name}>
                          <Avatar name={task.assignee.name} size="sm" />
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">Unassigned</span>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}