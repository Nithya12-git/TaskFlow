import { Prisma, ProjectStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/errors";
import { logActivity } from "./activity.service";

type Ctx = { tenantId: string; userId: string; userName: string };

async function withProgress<T extends { id: string }>(tenantId: string, projects: T[]) {
  const completed = await prisma.task.groupBy({
    by: ["projectId"],
    where: { tenantId, status: "COMPLETED", projectId: { in: projects.map((p) => p.id) } },
    _count: { _all: true },
  });
  const done = new Map<string, number>(completed.map((c) => [c.projectId, c._count._all] as [string, number]));

  return projects.map((p) => {
    const total = (p as any)._count.tasks as number;
    const completedTasks = done.get(p.id) ?? 0;
    return {
      ...p,
      taskCount: total,
      completedTaskCount: completedTasks,
      progress: total === 0 ? 0 : Math.round((completedTasks / total) * 100),
    };
  });
}

export async function listProjects(tenantId: string, filters: { search?: string; status?: ProjectStatus }) {
  const where: Prisma.ProjectWhereInput = { tenantId };
  if (filters.status) where.status = filters.status;
  if (filters.search) where.name = { contains: filters.search, mode: "insensitive" };

  const projects = await prisma.project.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { tasks: true } } },
  });
  return withProgress(tenantId, projects);
}

export async function getProject(tenantId: string, id: string) {
  const project = await prisma.project.findFirst({
    where: { id, tenantId },
    include: { _count: { select: { tasks: true } } },
  });
  if (!project) throw new AppError(404, "Project not found.");
  const [withStats] = await withProgress(tenantId, [project]);
  return withStats;
}

export async function createProject(
  ctx: Ctx,
  data: { name: string; description?: string | null; status?: ProjectStatus }
) {
  const project = await prisma.project.create({ data: { ...data, tenantId: ctx.tenantId } });
  await logActivity({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    action: "PROJECT_CREATED",
    entityType: "PROJECT",
    entityId: project.id,
    message: `${ctx.userName} created project ${project.name}`,
  });
  return project;
}

export async function updateProject(
  ctx: Ctx,
  id: string,
  data: { name?: string; description?: string | null; status?: ProjectStatus }
) {
  await getProject(ctx.tenantId, id); // 404 if it belongs to another tenant
  const project = await prisma.project.update({ where: { id }, data });
  await logActivity({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    action: "PROJECT_UPDATED",
    entityType: "PROJECT",
    entityId: id,
    message: `${ctx.userName} updated project ${project.name}`,
  });
  return project;
}

export async function deleteProject(ctx: Ctx, id: string) {
  const project = await getProject(ctx.tenantId, id);
  await prisma.project.delete({ where: { id } });
  await logActivity({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    action: "PROJECT_DELETED",
    entityType: "PROJECT",
    entityId: id,
    message: `${ctx.userName} deleted project ${project.name}`,
  });
}