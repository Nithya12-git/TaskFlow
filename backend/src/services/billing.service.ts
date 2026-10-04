import { prisma } from "../config/prisma";

// No payment processing in the MVP: the plan is fixed, usage is real.
const PLAN = {
  id: "starter",
  name: "Starter",
  priceMonthly: 0,
  currency: "USD",
  features: [
    "Unlimited projects within your limits",
    "Role-based access control",
    "Full activity history",
    "Email-free team invitations",
  ],
  limits: { members: 10, projects: 25, tasks: 500 },
};

export async function getBilling(tenantId: string) {
  const [members, projects, tasks] = await Promise.all([
    prisma.membership.count({ where: { tenantId } }),
    prisma.project.count({ where: { tenantId } }),
    prisma.task.count({ where: { tenantId } }),
  ]);

  return {
    plan: PLAN,
    usage: { members, projects, tasks },
    paymentMethod: null,
    invoices: [] as Array<{ id: string; date: string; amount: number; status: string }>,
  };
}