import { Router, type IRouter } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import * as reportsController from "./reports.controller.js";

const router: IRouter = Router();

router.use(authMiddleware);

router.get("/overview", reportsController.overview);
router.get("/volume", reportsController.volume);
router.get("/status-breakdown", reportsController.statusBreakdown);
router.get("/agent-performance", reportsController.agentPerformance);
router.get("/tags", reportsController.tagDistribution);

export default router;
