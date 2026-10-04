"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FolderKanban,
  Layers,
  ListTodo,
  Plus,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { LinkButton } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/dashboard/StatCard";
import { TaskOverview } from "@/components/dashboard/TaskOverview";
import { MyTasks } from "@/components/dashboard/MyTasks";
import { RecentProjects } from "@/components/dashboard/RecentProjects";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import type { DashboardData } from "@/types";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[124px] rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Skeleton className="h-[380px] rounded-2xl" />
          <Skeleton className="h-[260px] rounded-2xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[300px] rounded-2xl" />
          <Skeleton className="h-[340px] rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { session, can } = useAuth();
  const { data, error, loading, retry } = useApi<DashboardData>("/dashboard/stats");

  if (!session) return null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = session.user.name.split(" ")[0];

  const description = data
    ? `${data.stats.pendingTasks} open ${data.stats.pendingTasks === 1 ? "task" : "tasks"}, ${data.stats.overdueTasks} overdue, across ${data.stats.activeProjects} active ${data.stats.activeProjects === 1 ? "project" : "projects"}.`
    : `Here's what's happening in ${session.workspace.name}.`;

  const actions = (
    <>
      {can("project:create") && (
        <LinkButton href="/projects?new=1" variant="secondary" icon={<Plus className="h-4 w-4" />}>
          New project
        </LinkButton>
      )}
      {can("task:create") && (
        <LinkButton href="/tasks?new=1" icon={<Plus className="h-4 w-4" />}>
          New task
        </LinkButton>
      )}
    </>
  );

  return (
    <>
      <PageHeader title={`${greeting}, ${firstName}`} description={description} actions={actions} />

      {error ? (
        <ErrorState message={error} onRetry={retry} />
      ) : loading || !data ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Total projects" value={data.stats.totalProjects} icon={FolderKanban} tone="violet" href="/projects" />
            <StatCard label="Active projects" value={data.stats.activeProjects} icon={Layers} tone="blue" href="/projects?status=ACTIVE" />
            <StatCard label="Total tasks" value={data.stats.totalTasks} icon={ListTodo} tone="slate" href="/tasks" />
            <StatCard label="Completed" value={data.stats.completedTasks} icon={CheckCircle2} tone="emerald" href="/tasks?status=COMPLETED" />
            <StatCard label="Pending" value={data.stats.pendingTasks} icon={Clock} tone="amber" href="/tasks" />
            <StatCard
              label="Overdue"
              value={data.stats.overdueTasks}
              icon={AlertTriangle}
              tone="red"
              href="/tasks?overdue=true"
              alert={data.stats.overdueTasks > 0}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <TaskOverview
                total={data.stats.totalTasks}
                completionRate={data.stats.completionRate}
                byStatus={data.tasksByStatus}
                byPriority={data.tasksByPriority}
              />
              <RecentProjects projects={data.recentProjects} />
            </div>

            <div className="space-y-6">
              <MyTasks tasks={data.myTasks} />
              <section className="surface p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white">Recent activity</h3>
                  <Link href="/activity" className="text-xs font-medium text-brand-light transition hover:text-white">
                    View all
                  </Link>
                </div>
                <ActivityFeed items={data.recentActivity} />
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}