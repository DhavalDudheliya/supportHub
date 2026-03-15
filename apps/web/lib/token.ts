import Cookies from "js-cookie";

/**
 * Token Management
 *
 * - Access Token: Managed via Cookies to support server-side middleware and SSR.
 * - Refresh Token: Managed via localStorage (client-side only).
 */

const ACCESS_TOKEN_KEY = "supporthub_access_token";
const REFRESH_TOKEN_KEY = "supporthub_refresh_token";

// Access Token Management (Cookies for SSR support)
export function getAccessToken(): string | null {
  return Cookies.get(ACCESS_TOKEN_KEY) || null;
}

export function setAccessToken(token: string): void {
  // Set cookie with secure defaults: SameSite=Lax, Secure (in production)
  // Expires in 1 day (matching token expiry usually, or session based)
  Cookies.set(ACCESS_TOKEN_KEY, token, {
    expires: 1, // 1 day for simplicity in dev, or omit for session cookie
    sameSite: "lax",
    path: "/",
    secure:
      typeof window !== "undefined" && window.location.protocol === "https:",
  });
}

export function removeAccessToken(): void {
  Cookies.remove(ACCESS_TOKEN_KEY, {
    path: "/",
    sameSite: "lax",
    secure:
      typeof window !== "undefined" && window.location.protocol === "https:",
  });
}

// Refresh Token Management (localStorage)
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

// Clear all tokens
export function clearTokens(): void {
  removeAccessToken();
  removeRefreshToken();
}
