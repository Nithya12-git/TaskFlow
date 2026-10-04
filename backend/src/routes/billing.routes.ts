import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requirePermission } from "../middleware/requirePermission";
import { getBilling } from "../controllers/billing.controller";

const router = Router();

router.use(authenticate);
router.get("/", requirePermission("billing:manage"), getBilling);

export default router;