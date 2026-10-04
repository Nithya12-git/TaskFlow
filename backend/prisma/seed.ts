import { PrismaClient, Role, TaskStatus, TaskPriority, ProjectStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const days = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

async function main() {
  await prisma.activity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash("Password123!", 10);

  const [owner, admin, member, guest] = await Promise.all([
    prisma.user.create({ data: { name: "Olivia Owner", email: "owner@taskflow.dev", password } }),
    prisma.user.create({ data: { name: "Adam Admin", email: "admin@taskflow.dev", password } }),
    prisma.user.create({ data: { name: "Maya Member", email: "member@taskflow.dev", password } }),
    prisma.user.create({ data: { name: "Gabe Guest", email: "guest@taskflow.dev", password } }),
  ]);

  const tenant = await prisma.tenant.create({ data: { name: "TaskFlow Core" } });

  await prisma.membership.createMany({
    data: [
      { userId: owner.id, tenantId: tenant.id, role: Role.OWNER },
      { userId: admin.id, tenantId: tenant.id, role: Role.ADMIN },
      { userId: member.id, tenantId: tenant.id, role: Role.MEMBER },
      { userId: guest.id, tenantId: tenant.id, role: Role.GUEST },
    ],
  });

  const website = await prisma.project.create({
    data: {
      tenantId: tenant.id,
      name: "Website Redesign",
      description: "Refresh the marketing site with a new brand system and faster pages.",
      status: ProjectStatus.ACTIVE,
    },
  });
  const mobile = await prisma.project.create({
    data: {
      tenantId: tenant.id,
      name: "Mobile Experience",
      description: "Improve the mobile web experience and prepare for a native app.",
      status: ProjectStatus.ACTIVE,
    },
  });
  const launch = await prisma.project.create({
    data: {
      tenantId: tenant.id,
      name: "Product Launch",
      description: "Coordinate the v2 launch across marketing, sales and support.",
      status: ProjectStatus.ON_HOLD,
    },
  });

  const t = (
    projectId: string,
    title: string,
    description: string,
    status: TaskStatus,
    priority: TaskPriority,
    dueInDays: number | null,
    assignedTo: string | null
  ) => ({
    tenantId: tenant.id,
    projectId,
    title,
    description,
    status,
    priority,
    dueDate: dueInDays === null ? null : days(dueInDays),
    assignedTo,
  });

  await prisma.task.createMany({
    data: [
      t(website.id, "Audit current site content", "Inventory all pages and flag outdated copy.", TaskStatus.COMPLETED, TaskPriority.MEDIUM, -10, member.id),
      t(website.id, "Design new homepage wireframes", "Low-fidelity layouts for desktop and mobile.", TaskStatus.REVIEW, TaskPriority.HIGH, 2, admin.id),
      t(website.id, "Build component library", "Buttons, cards, forms and navigation in the new style.", TaskStatus.IN_PROGRESS, TaskPriority.HIGH, 6, member.id),
      t(website.id, "Migrate blog posts", "Move existing posts to the new CMS structure.", TaskStatus.TODO, TaskPriority.LOW, 14, null),
      t(website.id, "Fix broken pricing page links", "Several CTA links return 404 after the last deploy.", TaskStatus.TODO, TaskPriority.URGENT, -2, admin.id),
      t(mobile.id, "Responsive navigation menu", "Replace the desktop nav with a slide-out mobile menu.", TaskStatus.IN_PROGRESS, TaskPriority.HIGH, 4, member.id),
      t(mobile.id, "Optimize image loading", "Lazy-load images and serve modern formats.", TaskStatus.TODO, TaskPriority.MEDIUM, 9, member.id),
      t(mobile.id, "Touch target accessibility review", "Check tap sizes and contrast on key flows.", TaskStatus.REVIEW, TaskPriority.MEDIUM, 3, admin.id),
      t(mobile.id, "Set up mobile analytics events", "Track sign-up and checkout funnel steps.", TaskStatus.COMPLETED, TaskPriority.LOW, -5, admin.id),
      t(launch.id, "Draft launch announcement", "Blog post and email copy for the v2 release.", TaskStatus.IN_PROGRESS, TaskPriority.HIGH, 7, owner.id),
      t(launch.id, "Prepare sales enablement deck", "Feature highlights, pricing and objection handling.", TaskStatus.TODO, TaskPriority.MEDIUM, 12, admin.id),
      t(launch.id, "Confirm support runbook", "Escalation paths and FAQ for launch week.", TaskStatus.TODO, TaskPriority.URGENT, -1, member.id),
    ],
  });

  await prisma.activity.createMany({
    data: [
      { tenantId: tenant.id, userId: owner.id, action: "PROJECT_CREATED", entityType: "PROJECT", entityId: website.id, message: "Olivia Owner created project Website Redesign" },
      { tenantId: tenant.id, userId: owner.id, action: "PROJECT_CREATED", entityType: "PROJECT", entityId: mobile.id, message: "Olivia Owner created project Mobile Experience" },
      { tenantId: tenant.id, userId: admin.id, action: "PROJECT_CREATED", entityType: "PROJECT", entityId: launch.id, message: "Adam Admin created project Product Launch" },
      { tenantId: tenant.id, userId: owner.id, action: "MEMBER_ADDED", entityType: "USER", entityId: member.id, message: "Olivia Owner added Maya Member as MEMBER" },
      { tenantId: tenant.id, userId: owner.id, action: "MEMBER_ADDED", entityType: "USER", entityId: guest.id, message: "Olivia Owner added Gabe Guest as GUEST" },
    ],
  });

  console.log("Seed complete. Login: owner@taskflow.dev / Password123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());