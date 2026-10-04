import { cn, PRIORITY_LABEL, PROJECT_STATUS_LABEL, ROLE_LABEL, TASK_STATUS_LABEL } from "@/lib/utils";
import type { ProjectStatus, Role, TaskPriority, TaskStatus } from "@/types";

const tones = {
  slate: "bg-slate-500/10 text-slate-300 ring-slate-400/20",
  violet: "bg-violet-500/10 text-violet-300 ring-violet-400/25",
  blue: "bg-blue-500/10 text-blue-300 ring-blue-400/25",
  emerald: "bg-emerald-500/10 text-emerald-300 ring-emerald-400/25",
  amber: "bg-amber-500/10 text-amber-300 ring-amber-400/25",
  orange: "bg-orange-500/10 text-orange-300 ring-orange-400/25",
  red: "bg-red-500/10 text-red-300 ring-red-400/25",
} as const;

type Tone = keyof typeof tones;

export function Badge({
  tone = "slate",
  dot,
  className,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

const roleTone: Record<Role, Tone> = { OWNER: "violet", ADMIN: "blue", MEMBER: "emerald", GUEST: "slate" };
const statusTone: Record<TaskStatus, Tone> = { TODO: "slate", IN_PROGRESS: "blue", REVIEW: "amber", COMPLETED: "emerald" };
const priorityTone: Record<TaskPriority, Tone> = { LOW: "slate", MEDIUM: "blue", HIGH: "orange", URGENT: "red" };
const projectTone: Record<ProjectStatus, Tone> = { ACTIVE: "emerald", ON_HOLD: "amber", COMPLETED: "blue", ARCHIVED: "slate" };

export const RoleBadge = ({ role }: { role: Role }) => <Badge tone={roleTone[role]}>{ROLE_LABEL[role]}</Badge>;

export const TaskStatusBadge = ({ status }: { status: TaskStatus }) => (
  <Badge tone={statusTone[status]} dot>{TASK_STATUS_LABEL[status]}</Badge>
);

export const PriorityBadge = ({ priority }: { priority: TaskPriority }) => (
  <Badge tone={priorityTone[priority]}>{PRIORITY_LABEL[priority]}</Badge>
);

export const ProjectStatusBadge = ({ status }: { status: ProjectStatus }) => (
  <Badge tone={projectTone[status]} dot>{PROJECT_STATUS_LABEL[status]}</Badge>
);