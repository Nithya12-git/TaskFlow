import type { Role } from "@/types";

export const ROLE_ORDER: Role[] = ["OWNER", "ADMIN", "MEMBER", "GUEST"];

export const ROLE_DESCRIPTION: Record<Role, string> = {
  OWNER: "Full control, including billing and deleting projects.",
  ADMIN: "Manages projects, tasks, team and workspace settings. No billing access.",
  MEMBER: "Creates and updates tasks. Can view projects and the team.",
  GUEST: "Read-only access to projects and tasks.",
};