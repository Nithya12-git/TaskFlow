"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List, ListTodo, Plus, SearchX } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { api, errorMessage } from "@/lib/api";
import { isOverdue } from "@/lib/dates";
import { cn, TASK_STATUS_LABEL } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ConfirmDialog } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskFilters, DEFAULT_FILTERS, countActiveFilters } from "@/components/tasks/TaskFilters";
import type { TaskFilterState } from "@/components/tasks/TaskFilters";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { TaskListRow } from "@/components/tasks/TaskListRow";
import type { Member, Project, Task, TaskPriority, TaskStatus } from "@/types";

type View = "list" | "board";
const VIEW_KEY = "taskflow:tasks-view";

function asPriority(v: string | null): "" | TaskPriority {
  return v === "LOW" || v === "MEDIUM" || v === "HIGH" || v === "URGENT" ? v : "";
}

function asStatus(v: string | null): "" | TaskStatus {
  return v === "TODO" || v === "IN_PROGRESS" || v === "REVIEW" || v === "COMPLETED" ? v : "";
}

// Applies filters from URL params (e.g. dashboard cards or the top-bar search).
function filtersFromParams(
  sp: { has(key: string): boolean; get(key: string): string | null },
  base: TaskFilterState
): TaskFilterState {
  const creating = sp.get("new") === "1";
  const next = { ...base };
  if (sp.has("search")) next.search = sp.get("search") ?? "";
  if (sp.has("projectId") && !creating) next.projectId = sp.get("projectId") ?? "";
  if (sp.has("assignedTo")) next.assignedTo = sp.get("assignedTo") ?? "";
  if (sp.has("priority")) next.priority = asPriority(sp.get("priority"));
  if (sp.has("status")) next.status = asStatus(sp.get("status"));
  if (sp.has("overdue")) next.overdue = sp.get("overdue") === "true";
  return next;
}

function TasksView() {
  const { can } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<TaskFilterState>(() => filtersFromParams(searchParams, DEFAULT_FILTERS));
  const [view, setView] = useState<View>("list");
  const debouncedSearch = useDebounce(filters.search);

  const paramKey = searchParams.toString();
  useEffect(() => {
    if (!paramKey) return;
    setFilters((f) => filtersFromParams(new URLSearchParams(paramKey), f));
  }, [paramKey]);

  useEffect(() => {
    const saved = localStorage.getItem(VIEW_KEY);
    if (saved === "list" || saved === "board") setView(saved);
  }, []);

  const path = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    if (filters.projectId) params.set("projectId", filters.projectId);
    if (filters.assignedTo) params.set("assignedTo", filters.assignedTo);
    if (filters.priority) params.set("priority", filters.priority);
    if (filters.status) params.set("status", filters.status);
    if (filters.overdue) params.set("overdue", "true");
    params.set("sort", filters.sort);
    return `/tasks?${params.toString()}`;
  }, [debouncedSearch, filters.projectId, filters.assignedTo, filters.priority, filters.status, filters.overdue, filters.sort]);

  const tasks = useApi<Task[]>(path);
  const projects = useApi<Project[]>("/projects");
  const members = useApi<Member[]>("/team");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [defaultProjectId, setDefaultProjectId] = useState<string | undefined>();
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const canCreate = can("task:create");
  const canUpdate = can("task:update");
  const canDelete = can("task:delete");

  // Support /tasks?new=1&projectId=... (dashboard and project page buttons)
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      if (canCreate) {
        setEditing(null);
        setDefaultProjectId(searchParams.get("projectId") ?? undefined);
        setFormOpen(true);
      }
      router.replace("/tasks");
    }
  }, [searchParams, canCreate, router]);

  function openCreate() {
    setEditing(null);
    setDefaultProjectId(filters.projectId || undefined);
    setFormOpen(true);
  }

  function openEdit(task: Task) {
    setEditing(task);
    setFormOpen(true);
  }

  function changeView(next: View) {
    setView(next);
    localStorage.setItem(VIEW_KEY, next);
    if (next === "board" && filters.status) setFilters((f) => ({ ...f, status: "" }));
  }

  async function changeStatus(task: Task, status: TaskStatus) {
    // Update the screen immediately, roll back if the server refuses.
    tasks.setData((prev) =>
      prev ? prev.map((t) => (t.id === task.id ? { ...t, status, isOverdue: isOverdue(t.dueDate, status) } : t)) : prev
    );
    try {
      await api.put(`/tasks/${task.id}`, { status });
      toast.success(status === "COMPLETED" ? "Task completed." : `Moved to ${TASK_STATUS_LABEL[status]}.`);
    } catch (err) {
      toast.error(errorMessage(err, "Unable to update the task. Please check your connection and try again."));
    } finally {
      tasks.reload();
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await api.delete(`/tasks/${deleting.id}`);
      toast.success("Task deleted.");
      setDeleting(null);
      tasks.reload();
    } catch (err) {
      toast.error(errorMessage(err, "Unable to delete the task. Please check your connection and try again."));
    } finally {
      setDeleteBusy(false);
    }
  }

  const data = tasks.data;
  const initialLoading = tasks.loading && !data;
  const filtersActive = countActiveFilters(filters) > 0;

  return (
    <>
      <PageHeader
        title="Tasks"
        description={
          data
            ? `${data.length} ${data.length === 1 ? "task" : "tasks"}${filtersActive ? " match your filters" : " in your workspace"}`
            : "Everything on your team's plate."
        }
        actions={
          <>
            <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1" role="group" aria-label="Switch view">
              {([
                { value: "list", label: "List", icon: List },
                { value: "board", label: "Board", icon: LayoutGrid },
              ] as const).map((v) => (
                <button
                  key={v.value}
                  onClick={() => changeView(v.value)}
                  aria-pressed={view === v.value}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition",
                    view === v.value ? "bg-white/[0.1] text-white" : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  <v.icon className="h-4 w-4" /> {v.label}
                </button>
              ))}
            </div>
            {canCreate && (
              <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                New task
              </Button>
            )}
          </>
        }
      />

      <TaskFilters
        filters={filters}
        onChange={setFilters}
        projects={projects.data ?? []}
        members={members.data ?? []}
        showStatus={view === "list"}
      />

      {tasks.error ? (
        <ErrorState message={tasks.error} onRetry={tasks.retry} />
      ) : initialLoading ? (
        view === "list" ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[68px] rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[300px] rounded-2xl" />
            ))}
          </div>
        )
      ) : data && data.length === 0 && view === "list" ? (
        filtersActive ? (
          <EmptyState
            icon={<SearchX className="h-6 w-6" />}
            title="No matching tasks"
            description="Try different filters or clear them to see everything."
            action={
              <Button variant="secondary" onClick={() => setFilters({ ...DEFAULT_FILTERS, sort: filters.sort })}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<ListTodo className="h-6 w-6" />}
            title="No tasks yet"
            description={canCreate ? "Create your first task to start tracking work." : "Tasks will show up here once someone creates them."}
            action={canCreate ? <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>New task</Button> : undefined}
          />
        )
      ) : (
        <div className={cn(tasks.loading && "opacity-60 transition-opacity")}>
          {view === "list" ? (
            <ul className="space-y-2">
              {data?.map((task) => (
                <TaskListRow
                  key={task.id}
                  task={task}
                  canUpdate={canUpdate}
                  canDelete={canDelete}
                  onStatusChange={changeStatus}
                  onEdit={openEdit}
                  onDelete={setDeleting}
                />
              ))}
            </ul>
          ) : (
            <TaskBoard
              tasks={data ?? []}
              canUpdate={canUpdate}
              canDelete={canDelete}
              onStatusChange={changeStatus}
              onEdit={openEdit}
              onDelete={setDeleting}
            />
          )}
        </div>
      )}

      <TaskFormModal
        open={formOpen}
        task={editing}
        defaultProjectId={defaultProjectId}
        projects={projects.data ?? []}
        members={members.data ?? []}
        onClose={() => setFormOpen(false)}
        onSaved={() => tasks.reload()}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Delete task?"
        message={deleting ? `"${deleting.title}" will be permanently deleted. This can\u2019t be undone.` : ""}
        confirmLabel="Delete task"
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={null}>
      <TasksView />
    </Suspense>
  );
}