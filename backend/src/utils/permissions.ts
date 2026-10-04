import { Role } from "@prisma/client";

export type Permission =
  | "project:view" | "project:create" | "project:update" | "project:delete"
  | "task:view" | "task:create" | "task:update" | "task:delete"
  | "team:view" | "team:manage"
  | "activity:view"
  | "settings:manage"
  | "billing:manage";

const GUEST: Permission[] = ["project:view", "task:view", "team:view", "activity:view"];

const MEMBER: Permission[] = [...GUEST, "task:create", "task:update"];

const ADMIN: Permission[] = [
  ...MEMBER,
  "project:create",
  "project:update",
  "task:delete",
  "team:manage",
  "settings:manage",
];

const OWNER: Permission[] = [...ADMIN, "project:delete", "billing:manage"];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = { GUEST, MEMBER, ADMIN, OWNER };

export const can = (role: Role, permission: Permission) => ROLE_PERMISSIONS[role].includes(permission);