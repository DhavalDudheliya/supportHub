import { api } from "../api";
import { setAccessToken, setRefreshToken } from "../token";

// --- Types ---

export interface AuthResponse {
  message: string;
  subdomain?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface UserProfileProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
  workspace: {
    id: string;
    subdomain: string;
    company: string;
  };
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfileProfile;
}

// --- Services ---

export const authService = {
  /**
   * Register a new user and create a workspace
   */
  async registerUser(data: Record<string, unknown>): Promise<AuthResponse> {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  /**
   * Look up a workspace subdomain by user email
   */
  async lookupWorkspace(
    email: string,
  ): Promise<{ subdomain: string } | { message: string }> {
    const response = await api.post<
      { subdomain: string } | { message: string }
    >("/auth/lookup-workspace", { email });
    return response.data;
  },

  /**
   * Log into a workspace
   */
  async loginUser(data: Record<string, unknown>): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>("/auth/login", data);

    // If login is successful, store tokens right away
    if (response.data.accessToken && response.data.refreshToken) {
      setAccessToken(response.data.accessToken);
      setRefreshToken(response.data.refreshToken);
    }

    return response.data;
  },

  /**
   * Fetch the current authenticated user's profile
   */
  async getMe(): Promise<UserProfileProfile> {
    const response = await api.get("/auth/me");
    return response.data;
  },

  /**
   * Resend the email verification link
   */
  async resendVerification(email: string): Promise<{ message: string }> {
    const response = await api.post("/auth/resend-verification", { email });
    return response.data;
  },
};
