/**
 * Email Service — Frontend API Client
 *
 * Handles all email integration API calls:
 * - Connection status polling
 * - OAuth connect (returns redirect URL)
 * - Account disconnection
 */

import { api } from "../api";

// --- Types ---

export interface EmailAccountStatus {
  provider: "GMAIL" | "OUTLOOK";
  email: string;
  watchExpiry: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailConnectionStatus {
  gmail: EmailAccountStatus | null;
  outlook: EmailAccountStatus | null;
}

// --- Service ---

export const emailService = {
  /**
   * Get connection status of email accounts for the current workspace.
   */
  async getStatus(): Promise<EmailConnectionStatus> {
    const response = await api.get<EmailConnectionStatus>("/email/status");
    return response.data;
  },

  /**
   * Get the OAuth URL for connecting a Gmail account.
   * The frontend should redirect (window.location.href) to this URL.
   */
  async getGmailConnectUrl(): Promise<string> {
    const response = await api.get<{ url: string }>("/email/gmail/connect");
    return response.data.url;
  },

  /**
   * Get the OAuth URL for connecting an Outlook account.
   * The frontend should redirect (window.location.href) to this URL.
   */
  async getOutlookConnectUrl(): Promise<string> {
    const response = await api.get<{ url: string }>("/email/outlook/connect");
    return response.data.url;
  },

  /**
   * Disconnect an email account.
   */
  async disconnect(
    provider: "gmail" | "outlook",
  ): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(
      `/email/disconnect/${provider}`,
    );
    return response.data;
  },
};
