"use client";

import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";
import { ProjectStatusBadge } from "@/components/ui/Badges";
import { Popover } from "@/components/ui/Popover";
import type { Project } from "@/types";

export function ProjectCard({
  project,
  onEdit,
  onDelete,
}: {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}) {
  const { can } = useAuth();
  const canEdit = can("project:update");
  const canDelete = can("project:delete");

  return (
    <div className="surface group relative p-5 transition hover:z-20 hover:-translate-y-0.5 hover:border-white/15 focus-within:z-20">
      <div className="flex items-start justify-between gap-3">
        <ProjectStatusBadge status={project.status} />
        {(canEdit || canDelete) && (
          <div className="relative z-10 -mr-1.5 -mt-1">
            <Popover
              panelClassName="w-44 p-1.5"
              trigger={({ toggle }) => (
                <button
                  onClick={toggle}
                  aria-label={`Actions for ${project.name}`}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/[0.07] hover:text-white"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              )}
            >
              {(close) => (
                <>
                  {canEdit && (
                    <button
                      onClick={() => {
                        close();
                        onEdit(project);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      <Pencil className="h-4 w-4" /> Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => {
                        close();
                        onDelete(project);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  )}
                </>
              )}
            </Popover>
          </div>
        )}
      </div>

      <h3 className="mt-3 text-base font-semibold text-white">
        <Link href={`/projects/${project.id}`} className="after:absolute after:inset-0 after:content-['']">
          {project.name}
        </Link>
      </h3>
      <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm text-slate-400">
        {project.description || "No description yet."}
      </p>

      <div className="mt-5">
        <div className="mb-1.5 flex justify-between text-xs">
          <span className="text-slate-500">
            {project.completedTaskCount}/{project.taskCount} tasks done
          </span>
          <span className="font-medium text-slate-300">{project.progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand to-brand-blue transition-all duration-700"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">Created {formatDate(project.createdAt)}</p>
    </div>
  );
}