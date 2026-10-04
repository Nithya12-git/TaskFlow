import { z } from "zod";

const status = z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]);

export const createProjectSchema = z.object({
  name: z.string().trim().min(2, "Project name must be at least 2 characters").max(100),
  description: z.string().trim().max(1000).nullable().optional(),
  status: status.optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const listProjectsQuery = z.object({
  search: z.string().trim().optional(),
  status: status.optional(),
});