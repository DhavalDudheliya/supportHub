import { api } from "../api";

export interface Invitation {
  id: string;
  email: string;
  token: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED";
  expiresAt: string;
  workspaceId: string;
  invitedBy: string;
  createdAt: string;
}

export interface TeamAgent {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export const invitationService = {
  /**
   * Invites a new agent to the workspace.
   * Admin only.
   */
  async inviteAgent(
    email: string,
  ): Promise<{ message: string; invitation: Invitation }> {
    const response = await api.post("/invitations", { email });
    return response.data;
  },

  /**
   * Retrieves all pending invitations for the workspace.
   * Admin only.
   */
  async getPendingInvitations(): Promise<Invitation[]> {
    const response = await api.get("/invitations");
    return response.data;
  },

  /**
   * Retrieves agents in the current workspace who have already joined.
   * Admin only.
   */
  async getTeamAgents(): Promise<TeamAgent[]> {
    const response = await api.get("/invitations/team");
    return response.data;
  },

  /**
   * Revokes a pending invitation.
   * Admin only.
   */
  async revokeInvitation(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/invitations/${id}`);
    return response.data;
  },

  /**
   * Accepts an invitation and creates a new user account.
   * Public route.
   */
  async acceptInvitation(
    data: any,
  ): Promise<{ message: string; userId: string }> {
    const response = await api.post("/invitations/accept", data);
    return response.data;
  },
};
