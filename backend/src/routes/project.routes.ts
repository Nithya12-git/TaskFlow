import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requirePermission } from "../middleware/requirePermission";
import * as c from "../controllers/project.controller";

const router = Router();

router.use(authenticate);

router.get("/", requirePermission("project:view"), c.listProjects);
router.get("/:id", requirePermission("project:view"), c.getProject);
router.post("/", requirePermission("project:create"), c.createProject);
router.put("/:id", requirePermission("project:update"), c.updateProject);
router.delete("/:id", requirePermission("project:delete"), c.deleteProject);

export default router;