import { api } from "../api";
import { setAccessToken, setRefreshToken } from "../token";

// --- Types ---

export interface AuthResponse {
  message: string;
  subdomain?: string;
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface UserProfileProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  domain: {
    id: string;
    subdomain: string;
    company: string;
  };
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
  async lookupDomain(email: string): Promise<{ subdomain: string }> {
    const response = await api.post("/auth/lookup-domain", { email });
    return response.data;
  },

  /**
   * Log into a workspace
   */
  async loginUser(data: Record<string, unknown>): Promise<AuthResponse> {
    const response = await api.post("/auth/login", data);

    // If login is successful, store tokens right away
    if (response.data.tokens) {
      setAccessToken(response.data.tokens.accessToken);
      setRefreshToken(response.data.tokens.refreshToken);
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
};
