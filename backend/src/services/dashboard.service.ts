import { prisma } from "../config/prisma";
import { listProjects } from "./project.service";
import { listActivity } from "./activity.service";

export async function getStats(tenantId: string, userId: string) {
  const now = new Date();

  const [
    totalProjects,
    activeProjects,
    totalTasks,
    completedTasks,
    overdueTasks,
    statusGroups,
    priorityGroups,
    recentProjects,
    recentActivity,
    myTasks,
  ] = await Promise.all([
    prisma.project.count({ where: { tenantId } }),
    prisma.project.count({ where: { tenantId, status: "ACTIVE" } }),
    prisma.task.count({ where: { tenantId } }),
    prisma.task.count({ where: { tenantId, status: "COMPLETED" } }),
    prisma.task.count({ where: { tenantId, status: { not: "COMPLETED" }, dueDate: { lt: now } } }),
    prisma.task.groupBy({ by: ["status"], where: { tenantId }, _count: { _all: true } }),
    prisma.task.groupBy({
      by: ["priority"],
      where: { tenantId, status: { not: "COMPLETED" } },
      _count: { _all: true },
    }),
    listProjects(tenantId, {}).then((projects) => projects.slice(0, 4)),
    listActivity(tenantId, { limit: 8 }),
    prisma.task.findMany({
      where: { tenantId, assignedTo: userId, status: { not: "COMPLETED" } },
      orderBy: { dueDate: { sort: "asc", nulls: "last" } },
      take: 5,
      include: { project: { select: { id: true, name: true } } },
    }),
  ]);

  const tasksByStatus = { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, COMPLETED: 0 };
  statusGroups.forEach((g) => {
    tasksByStatus[g.status] = g._count._all;
  });

  const tasksByPriority = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };
  priorityGroups.forEach((g) => {
    tasksByPriority[g.priority] = g._count._all;
  });

  return {
    stats: {
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks,
      overdueTasks,
      completionRate: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
    },
    tasksByStatus,
    tasksByPriority,
    recentProjects,
    recentActivity,
    myTasks,
  };
}