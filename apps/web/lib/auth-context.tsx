"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { UserProfileProfile, authService } from "./services/auth.service";
import { clearTokens, getAccessToken } from "./token";

interface AuthContextType {
  user: UserProfileProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: UserProfileProfile) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfileProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  const login = (userData: UserProfileProfile) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    clearTokens();
    // Use window.location to ensure a hard refresh so all state is cleared
    window.location.href = "/login";
  };

  const refreshUser = async () => {
    try {
      setIsLoading(true);
      const profile = await authService.getMe();
      setUser(profile);
    } catch (error) {
      console.error("Failed to refresh user profile:", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial hydration
    const token = getAccessToken();
    if (token) {
      refreshUser();
    } else {
      setIsLoading(false);
    }

    // Listen for the custom logout event triggered by the axios interceptor on 401
    const handleAuthLogout = () => {
      logout();
    };

    window.addEventListener("auth:logout", handleAuthLogout);
    return () => {
      window.removeEventListener("auth:logout", handleAuthLogout);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isLoading, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
