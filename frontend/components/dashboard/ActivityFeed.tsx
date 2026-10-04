import { Avatar } from "@/components/ui/Avatar";
import { timeAgo } from "@/lib/utils";
import type { ActivityItem } from "@/types";

export function ActivityFeed({ items, emptyText = "No activity yet." }: { items: ActivityItem[]; emptyText?: string }) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-500">{emptyText}</p>;
  }

  return (
    <ul className="divide-y divide-white/[0.05]">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
          <Avatar name={item.user?.name ?? "System"} size="sm" className="mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-200">{item.message}</p>
            <p className="mt-0.5 text-xs text-slate-500">{timeAgo(item.createdAt)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}