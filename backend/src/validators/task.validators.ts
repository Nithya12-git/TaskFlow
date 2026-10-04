import { z } from "zod";

const status = z.enum(["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"]);
const priority = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const createTaskSchema = z.object({
  projectId: z.string().min(1, "Choose a project"),
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(150),
  description: z.string().trim().max(2000).nullable().optional(),
  status: status.optional(),
  priority: priority.optional(),
  dueDate: z.coerce.date().nullable().optional(),
  assignedTo: z.string().min(1).nullable().optional(),
});

export const updateTaskSchema = createTaskSchema.omit({ projectId: true }).partial();

export const listTasksQuery = z.object({
  projectId: z.string().optional(),
  status: status.optional(),
  priority: priority.optional(),
  assignedTo: z.string().optional(),
  search: z.string().trim().optional(),
  overdue: z.enum(["true", "false"]).optional(),
  sort: z.enum(["newest", "oldest", "dueDate", "priority"]).default("newest"),
});