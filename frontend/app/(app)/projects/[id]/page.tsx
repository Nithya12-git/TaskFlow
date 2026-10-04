"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ListTodo, Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { api, errorMessage } from "@/lib/api";
import { cn, formatDate, TASK_STATUS_LABEL } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { PriorityBadge, ProjectStatusBadge, TaskStatusBadge } from "@/components/ui/Badges";
import { Button, LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ConfirmDialog } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { ProjectFormModal } from "@/components/projects/ProjectFormModal";
import type { Project, Task, TaskStatus } from "@/types";

const STATUS_ORDER: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"];

function TaskRow({ task }: { task: Task }) {
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-100">{task.title}</p>
        <p className={cn("mt-0.5 text-xs", task.isOverdue ? "font-medium text-red-400" : "text-slate-500")}>
          {task.dueDate ? `${task.isOverdue ? "Overdue \u00b7 " : "Due "}${formatDate(task.dueDate)}` : "No due date"}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <PriorityBadge priority={task.priority} />
        {task.assignee ? (
          <span className="flex items-center gap-2 text-xs text-slate-400">
            <Avatar name={task.assignee.name} size="sm" />
            <span className="hidden sm:inline">{task.assignee.name}</span>
          </span>
        ) : (
          <span className="text-xs text-slate-600">Unassigned</span>
        )}
      </div>
    </li>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { can } = useAuth();

  const project = useApi<Project>(`/projects/${id}`);
  const tasks = useApi<Task[]>(`/tasks?projectId=${id}&sort=dueDate`);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  async function confirmDelete() {
    setDeleteBusy(true);
    try {
      await api.delete(`/projects/${id}`);
      toast.success("Project deleted.");
      router.push("/projects");
    } catch (err) {
      toast.error(errorMessage(err, "Unable to delete the project. Please check your connection and try again."));
      setDeleteBusy(false);
    }
  }

  const back = (
    <Link href="/projects" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white">
      <ArrowLeft className="h-4 w-4" /> Projects
    </Link>
  );

  if (project.error) {
    return (
      <>
        {back}
        <ErrorState message={project.error} onRetry={project.retry} />
      </>
    );
  }

  if (project.loading || !project.data) {
    return (
      <>
        {back}
        <Skeleton className="mb-3 h-9 w-72" />
        <Skeleton className="mb-8 h-4 w-48" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </>
    );
  }

  const p = project.data;
  const taskList = tasks.data ?? [];
  const overdue = taskList.filter((t) => t.isOverdue).length;
  const open = p.taskCount - p.completedTaskCount;

  const people = new Map<string, { name: string; total: number; open: number }>();
  taskList.forEach((t) => {
    if (!t.assignee) return;
    const entry = people.get(t.assignee.id) ?? { name: t.assignee.name, total: 0, open: 0 };
    entry.total += 1;
    if (t.status !== "COMPLETED") entry.open += 1;
    people.set(t.assignee.id, entry);
  });

  const stats = [
    { label: "Total tasks", value: p.taskCount, tone: "text-white" },
    { label: "Completed", value: p.completedTaskCount, tone: "text-emerald-300" },
    { label: "Open", value: open, tone: "text-amber-300" },
    { label: "Overdue", value: overdue, tone: overdue > 0 ? "text-red-300" : "text-slate-300" },
  ];

  return (
    <>
      {back}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{p.name}</h1>
            <ProjectStatusBadge status={p.status} />
          </div>
          <p className="mt-1.5 text-sm text-slate-400">Created {formatDate(p.createdAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {can("task:create") && (
            <LinkButton href={`/tasks?new=1&projectId=${p.id}`} icon={<Plus className="h-4 w-4" />}>
              Add task
            </LinkButton>
          )}
          {can("project:update") && (
            <Button variant="secondary" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditOpen(true)}>
              Edit
            </Button>
          )}
          {can("project:delete") && (
            <Button variant="secondary" className="hover:!bg-red-500/10 hover:!text-red-400" icon={<Trash2 className="h-4 w-4" />} onClick={() => setDeleteOpen(true)}>
              Delete
            </Button>
          )}
        </div>
      </div>

      <section className="surface p-5 sm:p-6">
        <p className="max-w-3xl text-sm leading-relaxed text-slate-300">
          {p.description || "No description yet."}
        </p>
        <div className="mt-5">
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="text-slate-500">Overall progress</span>
            <span className="font-medium text-slate-200">{p.progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-brand-blue transition-all duration-700"
              style={{ width: `${p.progress}%` }}
            />
          </div>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {stats.map((s) => (
          <div key={s.label} className="surface p-4">
            <p className={cn("text-2xl font-semibold", s.tone)}>{s.value}</p>
            <p className="mt-0.5 text-sm text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="surface p-5 sm:p-6 lg:col-span-2">
          <h3 className="mb-4 text-base font-semibold text-white">Tasks</h3>
          {tasks.error ? (
            <ErrorState message={tasks.error} onRetry={tasks.retry} />
          ) : tasks.loading && !tasks.data ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : taskList.length === 0 ? (
            <EmptyState
              icon={<ListTodo className="h-6 w-6" />}
              title="No tasks in this project yet"
              description={can("task:create") ? "Add the first task to get things moving." : "Tasks will show up here once they're created."}
              action={
                can("task:create") ? (
                  <LinkButton href={`/tasks?new=1&projectId=${p.id}`} icon={<Plus className="h-4 w-4" />}>
                    Add task
                  </LinkButton>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-6">
              {STATUS_ORDER.map((status) => {
                const group = taskList.filter((t) => t.status === status);
                if (group.length === 0) return null;
                return (
                  <div key={status}>
                    <div className="mb-2 flex items-center gap-2">
                      <TaskStatusBadge status={status} />
                      <span className="text-xs text-slate-500">
                        {group.length} {TASK_STATUS_LABEL[status].toLowerCase()}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {group.map((t) => (
                        <TaskRow key={t.id} task={t} />
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="surface h-fit p-5">
          <h3 className="mb-4 text-base font-semibold text-white">People</h3>
          {people.size === 0 ? (
            <p className="text-sm text-slate-500">No one is assigned to tasks in this project yet.</p>
          ) : (
            <ul className="space-y-3">
              {Array.from(people.entries()).map(([userId, person]) => (
                <li key={userId} className="flex items-center gap-3">
                  <Avatar name={person.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-100">{person.name}</p>
                    <p className="text-xs text-slate-500">
                      {person.open} open &middot; {person.total} total
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <ProjectFormModal open={editOpen} project={p} onClose={() => setEditOpen(false)} onSaved={project.reload} />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete project?"
        message={`"${p.name}" and its ${p.taskCount} ${p.taskCount === 1 ? "task" : "tasks"} will be permanently deleted. This can\u2019t be undone.`}
        confirmLabel="Delete project"
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  );
}