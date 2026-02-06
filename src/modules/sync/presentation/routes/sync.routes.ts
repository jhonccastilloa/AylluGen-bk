import { Router } from "express";
import { SyncController } from "../controllers/SyncController";
import { authMiddleware } from "../../../../presentation/middlewares/auth.middleware";
import { container, TYPES } from "../../../../shared/di/container";

const router = Router();
const syncController = container.get<SyncController>(TYPES.SyncController);

router.use(authMiddleware);

router.post(
  "/push",

  syncController.push,
);
router.post("/pull", syncController.pull);
router.post(
  "/resolve-conflict",

  syncController.resolveConflict,
);

export default router;
