export type Role = "OWNER" | "ADMIN" | "MEMBER" | "GUEST";
export type ProjectStatus = "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type Permission =
  | "project:view" | "project:create" | "project:update" | "project:delete"
  | "task:view" | "task:create" | "task:update" | "task:delete"
  | "team:view" | "team:manage"
  | "activity:view"
  | "settings:manage"
  | "billing:manage";

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Session {
  user: User;
  workspace: { id: string; name: string };
  role: Role;
  permissions: Permission[];
}

export interface Project {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  taskCount: number;
  completedTaskCount: number;
  progress: number;
}

export interface Task {
  id: string;
  tenantId: string;
  projectId: string;
  assignedTo: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
  project: { id: string; name: string };
  assignee: { id: string; name: string; email: string } | null;
}

export type MyTask = Omit<Task, "assignee" | "isOverdue">;

export interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: Role;
  joinedAt: string;
  openTasks: number;
}

export interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  message: string;
  createdAt: string;
  user: { id: string; name: string } | null;
}

export interface DashboardData {
  stats: {
    totalProjects: number;
    activeProjects: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    completionRate: number;
  };
  tasksByStatus: Record<TaskStatus, number>;
  tasksByPriority: Record<TaskPriority, number>;
  recentProjects: Project[];
  recentActivity: ActivityItem[];
  myTasks: MyTask[];
}