"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FolderKanban, Plus, Search, SearchX } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { api, errorMessage } from "@/lib/api";
import { cn, PROJECT_STATUS_LABEL } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectFormModal } from "@/components/projects/ProjectFormModal";
import type { Project, ProjectStatus } from "@/types";

type StatusFilter = "" | ProjectStatus;

const FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: "", label: "All" },
  { value: "ACTIVE", label: PROJECT_STATUS_LABEL.ACTIVE },
  { value: "ON_HOLD", label: PROJECT_STATUS_LABEL.ON_HOLD },
  { value: "COMPLETED", label: PROJECT_STATUS_LABEL.COMPLETED },
  { value: "ARCHIVED", label: PROJECT_STATUS_LABEL.ARCHIVED },
];

function isStatus(value: string | null): value is ProjectStatus {
  return value === "ACTIVE" || value === "ON_HOLD" || value === "COMPLETED" || value === "ARCHIVED";
}

function ProjectsView() {
  const { can } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [status, setStatus] = useState<StatusFilter>(() => {
    const s = searchParams.get("status");
    return isStatus(s) ? s : "";
  });
  const debouncedSearch = useDebounce(search);

  const path = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    if (status) params.set("status", status);
    const qs = params.toString();
    return `/projects${qs ? `?${qs}` : ""}`;
  }, [debouncedSearch, status]);

  const { data, error, loading, retry, reload } = useApi<Project[]>(path);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const canCreate = can("project:create");

  // Support links like /projects?new=1 (used by the dashboard button)
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      if (canCreate) {
        setEditing(null);
        setFormOpen(true);
      }
      router.replace("/projects");
    }
  }, [searchParams, canCreate, router]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(project: Project) {
    setEditing(project);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await api.delete(`/projects/${deleting.id}`);
      toast.success(`"${deleting.name}" was deleted.`);
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err, "Unable to delete the project. Please check your connection and try again."));
    } finally {
      setDeleteBusy(false);
    }
  }

  const filtersActive = !!search.trim() || !!status;
  const initialLoading = loading && !data;

  return (
    <>
      <PageHeader
        title="Projects"
        description={data ? `${data.length} ${data.length === 1 ? "project" : "projects"}${filtersActive ? " found" : " in your workspace"}` : "Create and track your team's projects."}
        actions={
          canCreate && (
            <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
              New project
            </Button>
          )
        }
      />

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            aria-label="Search projects"
            className="field pl-9"
          />
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0 lg:pb-0">
          {FILTERS.map((f) => (
            <button
              key={f.value || "all"}
              onClick={() => setStatus(f.value)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
                status === f.value
                  ? "border-brand/50 bg-brand/15 text-white"
                  : "border-white/10 text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={retry} />
      ) : initialLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[220px] rounded-2xl" />
          ))}
        </div>
      ) : data && data.length === 0 ? (
        filtersActive ? (
          <EmptyState
            icon={<SearchX className="h-6 w-6" />}
            title="No matching projects"
            description="Try a different search term or clear the filters."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch("");
                  setStatus("");
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<FolderKanban className="h-6 w-6" />}
            title="No projects yet"
            description={canCreate ? "Create your first project to start organizing work." : "Projects will show up here once someone creates them."}
            action={canCreate ? <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>New project</Button> : undefined}
          />
        )
      ) : (
        <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3", loading && "opacity-60 transition-opacity")}>
          {data?.map((p) => (
            <ProjectCard key={p.id} project={p} onEdit={openEdit} onDelete={setDeleting} />
          ))}
        </div>
      )}

      <ProjectFormModal open={formOpen} project={editing} onClose={() => setFormOpen(false)} onSaved={reload} />

      <ConfirmDialog
        open={!!deleting}
        title="Delete project?"
        message={
          deleting
            ? `"${deleting.name}" and its ${deleting.taskCount} ${deleting.taskCount === 1 ? "task" : "tasks"} will be permanently deleted. This can\u2019t be undone.`
            : ""
        }
        confirmLabel="Delete project"
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={null}>
      <ProjectsView />
    </Suspense>
  );
}