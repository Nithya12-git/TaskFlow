import { Prisma, TaskPriority, TaskStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/errors";
import { logActivity } from "./activity.service";

type Ctx = { tenantId: string; userId: string; userName: string };

const include = {
  project: { select: { id: true, name: true } },
  assignee: { select: { id: true, name: true, email: true } },
} satisfies Prisma.TaskInclude;

type TaskWithRelations = Prisma.TaskGetPayload<{ include: typeof include }>;

function present(task: TaskWithRelations) {
  const isOverdue = !!task.dueDate && task.dueDate < new Date() && task.status !== "COMPLETED";
  return { ...task, isOverdue };
}

async function assertProject(tenantId: string, projectId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, tenantId } });
  if (!project) throw new AppError(404, "Project not found.");
}

async function assertAssignee(tenantId: string, userId: string | null | undefined) {
  if (!userId) return;
  const membership = await prisma.membership.findFirst({ where: { userId, tenantId } });
  if (!membership) throw new AppError(400, "Assignee must be a member of this workspace.");
}

export interface TaskFilters {
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  search?: string;
  overdue?: "true" | "false";
  sort: "newest" | "oldest" | "dueDate" | "priority";
}

export async function listTasks(tenantId: string, userId: string, f: TaskFilters) {
  const where: Prisma.TaskWhereInput = { tenantId };
  if (f.projectId) where.projectId = f.projectId;
  if (f.status) where.status = f.status;
  if (f.priority) where.priority = f.priority;
  if (f.assignedTo === "me") where.assignedTo = userId;
  else if (f.assignedTo === "unassigned") where.assignedTo = null;
  else if (f.assignedTo) where.assignedTo = f.assignedTo;
  if (f.search) {
    where.OR = [
      { title: { contains: f.search, mode: "insensitive" } },
      { description: { contains: f.search, mode: "insensitive" } },
    ];
  }
  if (f.overdue === "true") {
    where.dueDate = { lt: new Date() };
    if (!f.status) where.status = { not: "COMPLETED" };
  }

  const orderBy: Prisma.TaskOrderByWithRelationInput =
    f.sort === "oldest"
      ? { createdAt: "asc" }
      : f.sort === "dueDate"
        ? { dueDate: { sort: "asc", nulls: "last" } }
        : f.sort === "priority"
          ? { priority: "desc" }
          : { createdAt: "desc" };

  const tasks = await prisma.task.findMany({ where, orderBy, include });
  return tasks.map(present);
}

export async function getTask(tenantId: string, id: string) {
  const task = await prisma.task.findFirst({ where: { id, tenantId }, include });
  if (!task) throw new AppError(404, "Task not found.");
  return present(task);
}

export async function createTask(
  ctx: Ctx,
  data: {
    projectId: string;
    title: string;
    description?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: Date | null;
    assignedTo?: string | null;
  }
) {
  await assertProject(ctx.tenantId, data.projectId);
  await assertAssignee(ctx.tenantId, data.assignedTo);

  const task = await prisma.task.create({ data: { ...data, tenantId: ctx.tenantId }, include });
  await logActivity({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    action: "TASK_CREATED",
    entityType: "TASK",
    entityId: task.id,
    message: `${ctx.userName} created task ${task.title}`,
  });
  return present(task);
}

export async function updateTask(
  ctx: Ctx,
  id: string,
  data: {
    title?: string;
    description?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: Date | null;
    assignedTo?: string | null;
  }
) {
  const existing = await getTask(ctx.tenantId, id); // 404 if it belongs to another tenant
  if (data.assignedTo !== undefined) await assertAssignee(ctx.tenantId, data.assignedTo);

  const task = await prisma.task.update({ where: { id }, data, include });
  const completedNow = data.status === "COMPLETED" && existing.status !== "COMPLETED";

  await logActivity({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    action: completedNow ? "TASK_COMPLETED" : "TASK_UPDATED",
    entityType: "TASK",
    entityId: id,
    message: completedNow
      ? `${ctx.userName} completed task ${task.title}`
      : `${ctx.userName} updated task ${task.title}`,
  });
  return present(task);
}

export async function deleteTask(ctx: Ctx, id: string) {
  const task = await getTask(ctx.tenantId, id);
  await prisma.task.delete({ where: { id } });
  await logActivity({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    action: "TASK_DELETED",
    entityType: "TASK",
    entityId: id,
    message: `${ctx.userName} deleted task ${task.title}`,
  });
}