import { Router, type IRouter } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import * as invitationController from "./invitation.controller.js";

const router: IRouter = Router();

// Public route to accept an invitation
router.post("/accept", invitationController.acceptInvitation);

// Protected routes (require valid JWT)
router.use(authMiddleware);

// Admin routes for managing invitations
router.post("/", invitationController.inviteAgent);
router.get("/", invitationController.getInvitations);
router.get("/team", invitationController.getTeamAgents);
router.delete("/:id", invitationController.revokeInvitation);

export default router;
