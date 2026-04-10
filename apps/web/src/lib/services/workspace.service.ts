/**
 * Workspace Service — API Client
 *
 * Frontend service for workspace theme CRUD and asset management.
 */

import { api } from "../api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkspaceTheme {
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  borderRadius: number;
  defaultMode: string;
  logoUrl: string | null;
  faviconUrl: string | null;
}

export interface UpdateThemePayload {
  primaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  borderRadius?: number;
  defaultMode?: string;
}

// ─── Services ─────────────────────────────────────────────────────────────────

export const workspaceService = {
  /**
   * Fetch the current workspace theme (or defaults).
   */
  async getTheme(): Promise<WorkspaceTheme> {
    const response = await api.get("/workspace/theme");
    return response.data;
  },

  /**
   * Update workspace theme settings.
   */
  async updateTheme(data: UpdateThemePayload): Promise<WorkspaceTheme> {
    const response = await api.put("/workspace/theme", data);
    return response.data;
  },

  /**
   * Upload a workspace logo.
   */
  async uploadLogo(file: File): Promise<WorkspaceTheme> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/workspace/theme/logo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /**
   * Upload a workspace favicon.
   */
  async uploadFavicon(file: File): Promise<WorkspaceTheme> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/workspace/theme/favicon", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /**
   * Remove the workspace logo.
   */
  async deleteLogo(): Promise<WorkspaceTheme> {
    const response = await api.delete("/workspace/theme/logo");
    return response.data;
  },

  /**
   * Remove the workspace favicon.
   */
  async deleteFavicon(): Promise<WorkspaceTheme> {
    const response = await api.delete("/workspace/theme/favicon");
    return response.data;
  },
};
