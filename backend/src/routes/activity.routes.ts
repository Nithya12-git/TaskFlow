import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requirePermission } from "../middleware/requirePermission";
import { listActivity } from "../controllers/activity.controller";

const router = Router();

router.use(authenticate);
router.get("/", requirePermission("activity:view"), listActivity);

export default router;