import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { ProjectStatusBadge } from "@/components/ui/Badges";
import type { Project } from "@/types";

export function RecentProjects({ projects }: { projects: Project[] }) {
  return (
    <section className="surface p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Recent projects</h3>
        <Link href="/projects" className="text-xs font-medium text-brand-light transition hover:text-white">
          View all
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <FolderKanban className="h-8 w-8 text-slate-600" />
          <p className="mt-3 text-sm font-medium text-slate-200">No projects yet</p>
          <p className="mt-0.5 text-xs text-slate-500">Projects you create will show up here.</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.04]"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium text-slate-100 transition group-hover:text-white">{p.name}</h4>
                <ProjectStatusBadge status={p.status} />
              </div>
              <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm text-slate-400">
                {p.description || "No description yet."}
              </p>
              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-slate-500">
                    {p.completedTaskCount}/{p.taskCount} tasks
                  </span>
                  <span className="font-medium text-slate-300">{p.progress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand to-brand-blue transition-all duration-700"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}