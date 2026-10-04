"use client";

import { AlertTriangle, Search, X } from "lucide-react";
import { cn, PRIORITY_LABEL, TASK_STATUS_LABEL } from "@/lib/utils";
import type { Member, Project, TaskPriority, TaskStatus } from "@/types";

export interface TaskFilterState {
  search: string;
  projectId: string;
  assignedTo: string;
  priority: "" | TaskPriority;
  status: "" | TaskStatus;
  overdue: boolean;
  sort: "newest" | "oldest" | "dueDate" | "priority";
}

export const DEFAULT_FILTERS: TaskFilterState = {
  search: "",
  projectId: "",
  assignedTo: "",
  priority: "",
  status: "",
  overdue: false,
  sort: "newest",
};

export function countActiveFilters(f: TaskFilterState) {
  return [f.search.trim(), f.projectId, f.assignedTo, f.priority, f.status, f.overdue].filter(Boolean).length;
}

const selectClass = "field !py-2";

export function TaskFilters({
  filters,
  onChange,
  projects,
  members,
  showStatus,
}: {
  filters: TaskFilterState;
  onChange: (filters: TaskFilterState) => void;
  projects: Project[];
  members: Member[];
  showStatus: boolean;
}) {
  const set = <K extends keyof TaskFilterState>(key: K, value: TaskFilterState[K]) =>
    onChange({ ...filters, [key]: value });
  const active = countActiveFilters(filters);

  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
            placeholder="Search tasks..."
            aria-label="Search tasks"
            className="field pl-9"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => set("overdue", !filters.overdue)}
            aria-pressed={filters.overdue}
            className={cn(
              "inline-flex items-center gap-2 whitespace-nowrap rounded-xl border px-3.5 py-2 text-sm font-medium transition",
              filters.overdue
                ? "border-red-400/40 bg-red-500/15 text-red-300"
                : "border-white/10 text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
            )}
          >
            <AlertTriangle className="h-4 w-4" /> Overdue
          </button>
          {active > 0 && (
            <button
              onClick={() => onChange({ ...DEFAULT_FILTERS, sort: filters.sort })}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
            >
              <X className="h-4 w-4" /> Clear
            </button>
          )}
        </div>
      </div>

      <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-3", showStatus ? "xl:grid-cols-5" : "xl:grid-cols-4")}>
        <select aria-label="Filter by project" className={selectClass} value={filters.projectId} onChange={(e) => set("projectId", e.target.value)}>
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select aria-label="Filter by assignee" className={selectClass} value={filters.assignedTo} onChange={(e) => set("assignedTo", e.target.value)}>
          <option value="">All assignees</option>
          <option value="me">Assigned to me</option>
          <option value="unassigned">Unassigned</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.name}
            </option>
          ))}
        </select>

        <select aria-label="Filter by priority" className={selectClass} value={filters.priority} onChange={(e) => set("priority", e.target.value as TaskFilterState["priority"])}>
          <option value="">All priorities</option>
          {(Object.keys(PRIORITY_LABEL) as TaskPriority[]).map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABEL[p]}
            </option>
          ))}
        </select>

        {showStatus && (
          <select aria-label="Filter by status" className={selectClass} value={filters.status} onChange={(e) => set("status", e.target.value as TaskFilterState["status"])}>
            <option value="">All statuses</option>
            {(Object.keys(TASK_STATUS_LABEL) as TaskStatus[]).map((s) => (
              <option key={s} value={s}>
                {TASK_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        )}

        <select aria-label="Sort tasks" className={selectClass} value={filters.sort} onChange={(e) => set("sort", e.target.value as TaskFilterState["sort"])}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="dueDate">Due date</option>
          <option value="priority">Priority</option>
        </select>
      </div>
    </div>
  );
}