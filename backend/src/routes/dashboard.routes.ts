import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requirePermission } from "../middleware/requirePermission";
import { getStats } from "../controllers/dashboard.controller";

const router = Router();

router.use(authenticate);
router.get("/stats", requirePermission("project:view"), getStats);

export default router;