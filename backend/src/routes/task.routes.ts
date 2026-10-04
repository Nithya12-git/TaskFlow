import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requirePermission } from "../middleware/requirePermission";
import * as c from "../controllers/task.controller";

const router = Router();

router.use(authenticate);

router.get("/", requirePermission("task:view"), c.listTasks);
router.get("/:id", requirePermission("task:view"), c.getTask);
router.post("/", requirePermission("task:create"), c.createTask);
router.put("/:id", requirePermission("task:update"), c.updateTask);
router.delete("/:id", requirePermission("task:delete"), c.deleteTask);

export default router;