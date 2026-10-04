"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import type { Task } from "@/types";

export function TaskActions({
  task,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  task: Task;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  if (!canEdit && !canDelete) return null;

  return (
    <Popover
      panelClassName="w-40 p-1.5"
      trigger={({ toggle }) => (
        <button
          onClick={toggle}
          aria-label={`Actions for ${task.title}`}
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
                onEdit(task);
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
                onDelete(task);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          )}
        </>
      )}
    </Popover>
  );
}