"use client";

import { useState } from "react";
import { History } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { ActivityTimeline } from "@/components/activity/ActivityTimeline";
import type { ActivityItem } from "@/types";

const FILTERS = [
  { label: "All", value: "" },
  { label: "Projects", value: "PROJECT" },
  { label: "Tasks", value: "TASK" },
  { label: "Team", value: "USER" },
];

const PAGE = 30;
const MAX = 100;

export default function ActivityPage() {
  const [entityType, setEntityType] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const path = `/activity?limit=${limit}${entityType ? `&entityType=${entityType}` : ""}`;
  const { data, error, loading, retry } = useApi<ActivityItem[]>(path);

  const canLoadMore = !!data && data.length >= limit && limit < MAX;

  return (
    <>
      <PageHeader title="Activity" description="A full trail of what happened in your workspace." />

      <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {FILTERS.map((f) => (
          <button
            key={f.value || "all"}
            onClick={() => {
              setEntityType(f.value);
              setLimit(PAGE);
            }}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
              entityType === f.value
                ? "border-brand/50 bg-brand/15 text-white"
                : "border-white/10 text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={retry} />
      ) : loading && !data ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[68px] rounded-xl" />
          ))}
        </div>
      ) : data && data.length === 0 ? (
        <EmptyState
          icon={<History className="h-6 w-6" />}
          title="No activity yet"
          description="Actions like creating projects and tasks will be recorded here."
        />
      ) : (
        <div className={cn(loading && "opacity-60 transition-opacity")}>
          <ActivityTimeline items={data ?? []} />
          <div className="mt-6 flex flex-col items-center gap-2">
            {canLoadMore && (
              <Button variant="secondary" loading={loading} onClick={() => setLimit((l) => Math.min(l + PAGE, MAX))}>
                Show more
              </Button>
            )}
            {data && data.length >= MAX && (
              <p className="text-xs text-slate-500">Showing the latest {MAX} events.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}