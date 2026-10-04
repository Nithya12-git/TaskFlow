import {
  CheckCircle2,
  FolderKanban,
  Pencil,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserMinus,
  UserPlus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import type { ActivityItem } from "@/types";

const ICONS: Record<string, { icon: LucideIcon; tone: string }> = {
  PROJECT_CREATED: { icon: FolderKanban, tone: "bg-violet-500/15 text-violet-300" },
  PROJECT_UPDATED: { icon: Pencil, tone: "bg-blue-500/15 text-blue-300" },
  PROJECT_DELETED: { icon: Trash2, tone: "bg-red-500/15 text-red-300" },
  TASK_CREATED: { icon: Plus, tone: "bg-violet-500/15 text-violet-300" },
  TASK_UPDATED: { icon: Pencil, tone: "bg-blue-500/15 text-blue-300" },
  TASK_COMPLETED: { icon: CheckCircle2, tone: "bg-emerald-500/15 text-emerald-300" },
  TASK_DELETED: { icon: Trash2, tone: "bg-red-500/15 text-red-300" },
  MEMBER_ADDED: { icon: UserPlus, tone: "bg-emerald-500/15 text-emerald-300" },
  MEMBER_ROLE_CHANGED: { icon: ShieldCheck, tone: "bg-amber-500/15 text-amber-300" },
  MEMBER_REMOVED: { icon: UserMinus, tone: "bg-red-500/15 text-red-300" },
  WORKSPACE_CREATED: { icon: Sparkles, tone: "bg-violet-500/15 text-violet-300" },
  WORKSPACE_UPDATED: { icon: Pencil, tone: "bg-blue-500/15 text-blue-300" },
};

const FALLBACK = { icon: Sparkles, tone: "bg-slate-500/15 text-slate-300" };

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function timeOfDay(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  const groups: Array<{ label: string; items: ActivityItem[] }> = [];
  items.forEach((item) => {
    const label = dayLabel(item.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  });

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.label}>
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">{group.label}</h3>
          <ul className="surface divide-y divide-white/[0.05]">
            {group.items.map((item) => {
              const { icon: Icon, tone } = ICONS[item.action] ?? FALLBACK;
              return (
                <li key={item.id} className="flex items-start gap-3.5 p-4">
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", tone)}>
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-200">{item.message}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {item.user?.name ?? "System"} &middot; {timeAgo(item.createdAt)}
                    </p>
                  </div>
                  <span className="hidden shrink-0 text-xs text-slate-600 sm:block">{timeOfDay(item.createdAt)}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}