/**
 * Client-Side Token Storage Management
 *
 * Provides a clean interface for reading, writing, and removing JWT tokens
 * from localStorage. Used by the Axios interceptors and AuthContext.
 */

const ACCESS_TOKEN_KEY = "supporthub_access_token";
const REFRESH_TOKEN_KEY = "supporthub_refresh_token";

// Access Token Management
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function removeAccessToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

// Refresh Token Management
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function removeRefreshToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// Clear all tokens (useful for logout)
export function clearTokens(): void {
  removeAccessToken();
  removeRefreshToken();
}
