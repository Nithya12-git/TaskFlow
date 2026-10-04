"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Menu, Search, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge } from "@/components/ui/Badges";
import { Popover } from "@/components/ui/Popover";
import { Skeleton } from "@/components/ui/Skeleton";
import type { ActivityItem } from "@/types";

const TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  projects: "Projects",
  tasks: "Tasks",
  team: "Team",
  activity: "Activity",
  settings: "Settings",
  billing: "Billing",
};

function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<ActivityItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api.get<ActivityItem[]>("/activity?limit=6").then(setItems).catch(() => setFailed(true));
  }, []);

  return (
    <div className="w-[min(22rem,calc(100vw-2rem))]">
      <div className="border-b border-white/[0.06] px-4 py-3">
        <p className="text-sm font-semibold text-white">Recent activity</p>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {failed ? (
          <p className="px-4 py-6 text-center text-sm text-slate-400">
            Unable to load notifications. Please try again.
          </p>
        ) : !items ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        ) : items.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-400">Nothing new yet.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="border-b border-white/[0.04] px-4 py-3 last:border-0">
              <p className="text-sm text-slate-200">{item.message}</p>
              <p className="mt-0.5 text-xs text-slate-500">{timeAgo(item.createdAt)}</p>
            </div>
          ))
        )}
      </div>
      <Link
        href="/activity"
        onClick={onClose}
        className="block border-t border-white/[0.06] px-4 py-3 text-center text-sm font-medium text-brand-light transition hover:text-white"
      >
        View all activity
      </Link>
    </div>
  );
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout } = useAuth();
  const [query, setQuery] = useState("");

  const segment = pathname.split("/")[1] ?? "";
  const title = TITLES[segment] ?? "TaskFlow";

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/tasks?search=${encodeURIComponent(q)}` : "/tasks");
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-white/[0.06] bg-ink/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <button
        onClick={onMenu}
        aria-label="Open menu"
        className="rounded-lg p-2 text-slate-300 transition hover:bg-white/[0.06] lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0">
        <p className="hidden truncate text-xs text-slate-500 sm:block">{session?.workspace.name}</p>
        <h2 className="truncate text-sm font-semibold text-white sm:text-base">{title}</h2>
      </div>

      <form onSubmit={handleSearch} className="relative ml-auto hidden w-full max-w-xs sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tasks..."
          aria-label="Search tasks"
          className="field !rounded-full !py-2 pl-9"
        />
      </form>

      <div className="ml-auto flex items-center gap-1 sm:ml-0">
        <Link
          href="/tasks"
          aria-label="Search tasks"
          className="rounded-lg p-2 text-slate-300 transition hover:bg-white/[0.06] sm:hidden"
        >
          <Search className="h-5 w-5" />
        </Link>

        <Popover
          trigger={({ toggle }) => (
            <button
              onClick={toggle}
              aria-label="Notifications"
              className="rounded-lg p-2 text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
            >
              <Bell className="h-5 w-5" />
            </button>
          )}
        >
          {(close) => <NotificationsPanel onClose={close} />}
        </Popover>

        {session && (
          <Popover
            trigger={({ toggle }) => (
              <button onClick={toggle} aria-label="Account menu" className="ml-1 rounded-full transition hover:opacity-90">
                <Avatar name={session.user.name} />
              </button>
            )}
          >
            {(close) => (
              <div className="w-64 p-2">
                <div className="px-3 py-3">
                  <p className="truncate text-sm font-semibold text-white">{session.user.name}</p>
                  <p className="truncate text-xs text-slate-400">{session.user.email}</p>
                  <div className="mt-2">
                    <RoleBadge role={session.role} />
                  </div>
                </div>
                <div className="my-1 border-t border-white/[0.06]" />
                <Link
                  href="/settings"
                  onClick={close}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <Settings className="h-4 w-4" /> Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-red-500/10 hover:text-red-400"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            )}
          </Popover>
        )}
      </div>
    </header>
  );
}