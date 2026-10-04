import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requirePermission } from "../middleware/requirePermission";
import * as c from "../controllers/team.controller";

const router = Router();

router.use(authenticate);

router.get("/", requirePermission("team:view"), c.listMembers);
router.post("/", requirePermission("team:manage"), c.addMember);
router.put("/:id", requirePermission("team:manage"), c.changeRole);
router.delete("/:id", requirePermission("team:manage"), c.removeMember);

export default router;