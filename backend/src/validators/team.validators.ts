import { z } from "zod";

const assignableRole = z.enum(["ADMIN", "MEMBER", "GUEST"]);

export const addMemberSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Temporary password must be at least 8 characters")
    .max(72, "Password is too long")
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/\d/, "Password must contain a number"),
  role: assignableRole,
});

export const updateRoleSchema = z.object({ role: assignableRole });