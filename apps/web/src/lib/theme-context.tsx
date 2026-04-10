/**
 * Theme Context — White-Label Theming Provider
 *
 * Fetches the workspace theme on mount and injects CSS variables onto
 * the document root. Supports live preview via `applyPreview()` which
 * immediately updates CSS variables without persisting to the server.
 *
 * Features:
 * - Converts hex colors to oklch CSS variables via generatePalette()
 * - Dynamically loads Google Fonts via <link> tag injection
 * - Updates the favicon dynamically
 * - Provides draft theme state for the branding settings editor
 */

"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTheme as useNextTheme } from "next-themes";
import { generatePalette, type ThemeConfig } from "./theme-utils";
import {
  workspaceService,
  type WorkspaceTheme,
} from "./services/workspace.service";

// ─── Context Types ────────────────────────────────────────────────────────────

interface ThemeContextType {
  /** The persisted workspace theme from the server. */
  theme: WorkspaceTheme | null;
  /** Whether the theme is currently loading from the API. */
  isLoading: boolean;
  /** Apply a draft theme for live preview (does NOT persist). */
  applyPreview: (draft: Partial<WorkspaceTheme>) => void;
  /** Reset preview to the last persisted theme. */
  resetPreview: () => void;
  /** Refresh theme from the server (after saving). */
  refreshTheme: () => Promise<void>;
  /** Whether a preview is currently active (unsaved changes). */
  hasPreview: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ─── Font Loader ──────────────────────────────────────────────────────────────

/** Load a Google Font by injecting a <link> tag. */
function loadGoogleFont(fontFamily: string) {
  const fontId = `google-font-${fontFamily.replace(/\s+/g, "-").toLowerCase()}`;

  // Skip if already loaded
  if (document.getElementById(fontId)) return;

  const link = document.createElement("link");
  link.id = fontId;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@300;400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

// ─── CSS Variable Injector ────────────────────────────────────────────────────

/**
 * Apply theme CSS variables to the document root and the .dark class.
 * This function handles both light and dark mode variables simultaneously
 * using CSS custom properties at the :root and .dark levels.
 */
function applyThemeVariables(config: ThemeConfig) {
  const { light, dark, shared } = generatePalette(config);
  const root = document.documentElement;

  // Apply shared variables (font, radius) to body to override next/font body classes
  Object.entries(shared).forEach(([key, value]) => {
    document.body.style.setProperty(key, value);
  });

  // We need a stylesheet for dark mode overrides since we can't
  // set .dark class properties on root via style.setProperty when not in dark mode.
  let styleEl = document.getElementById(
    "workspace-theme-overrides",
  ) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "workspace-theme-overrides";
    document.head.appendChild(styleEl);
  }

  // Build CSS text for both light (:root) and dark (.dark) variables
  const lightVars = Object.entries(light)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");
  const darkVars = Object.entries(dark)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");

  styleEl.textContent = `
:root {
${lightVars}
}
.dark {
${darkVars}
}
  `.trim();
}

/** Remove all theme overrides — restore to the CSS defaults. */
function clearThemeVariables() {
  const styleEl = document.getElementById("workspace-theme-overrides");
  if (styleEl) styleEl.remove();

  // Clear inline shared variables
  if (typeof document !== "undefined" && document.body) {
    document.body.style.removeProperty("--font-sans");
    document.body.style.removeProperty("--radius");
  }
}

// ─── Favicon Manager ──────────────────────────────────────────────────────────

function updateFavicon(url: string | null) {
  let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
  if (url) {
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = url;
  } else if (link) {
    // Reset to default
    link.href = "/favicon.ico";
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

const DEFAULT_THEME: WorkspaceTheme = {
  primaryColor: "#4F6BF0",
  accentColor: "#7C3AED",
  fontFamily: "Inter",
  borderRadius: 0.375,
  defaultMode: "system",
  logoUrl: null,
  faviconUrl: null,
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<WorkspaceTheme | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPreview, setHasPreview] = useState(false);
  const persistedThemeRef = useRef<WorkspaceTheme | null>(null);
  const { setTheme: setNextTheme } = useNextTheme();

  /** Fetch the theme from the API and apply it. */
  const fetchAndApply = useCallback(async () => {
    try {
      const serverTheme = await workspaceService.getTheme();
      setTheme(serverTheme);
      persistedThemeRef.current = serverTheme;

      // Apply CSS variables
      applyThemeVariables({
        primaryColor: serverTheme.primaryColor,
        accentColor: serverTheme.accentColor,
        fontFamily: serverTheme.fontFamily,
        borderRadius: serverTheme.borderRadius,
      });

      // Load the font
      if (serverTheme.fontFamily !== "Inter") {
        loadGoogleFont(serverTheme.fontFamily);
      }

      // Update favicon
      updateFavicon(serverTheme.faviconUrl);

      // Set the default color mode
      if (serverTheme.defaultMode !== "system") {
        setNextTheme(serverTheme.defaultMode);
      }
    } catch (err) {
      // Silently fall back to defaults if theme fetch fails
      console.warn("Failed to fetch workspace theme, using defaults:", err);
      setTheme(DEFAULT_THEME);
      persistedThemeRef.current = DEFAULT_THEME;
    } finally {
      setIsLoading(false);
    }
  }, [setNextTheme]);

  useEffect(() => {
    fetchAndApply();

    return () => {
      clearThemeVariables();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Apply a draft theme for live preview. */
  const applyPreview = useCallback(
    (draft: Partial<WorkspaceTheme>) => {
      const base = persistedThemeRef.current || DEFAULT_THEME;
      const merged = { ...base, ...draft };
      setTheme(merged);
      setHasPreview(true);

      applyThemeVariables({
        primaryColor: merged.primaryColor,
        accentColor: merged.accentColor,
        fontFamily: merged.fontFamily,
        borderRadius: merged.borderRadius,
      });

      if (merged.fontFamily !== "Inter") {
        loadGoogleFont(merged.fontFamily);
      }

      updateFavicon(merged.faviconUrl);

      if (merged.defaultMode) {
        setNextTheme(merged.defaultMode);
      }
    },
    [setNextTheme],
  );

  /** Reset to the last persisted theme. */
  const resetPreview = useCallback(() => {
    const persisted = persistedThemeRef.current || DEFAULT_THEME;
    setTheme(persisted);
    setHasPreview(false);

    applyThemeVariables({
      primaryColor: persisted.primaryColor,
      accentColor: persisted.accentColor,
      fontFamily: persisted.fontFamily,
      borderRadius: persisted.borderRadius,
    });

    updateFavicon(persisted.faviconUrl);

    if (persisted.defaultMode) {
      setNextTheme(persisted.defaultMode);
    }
  }, [setNextTheme]);

  /** Refresh theme from the server (call after saving). */
  const refreshTheme = useCallback(async () => {
    setHasPreview(false);
    await fetchAndApply();
  }, [fetchAndApply]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isLoading,
        applyPreview,
        resetPreview,
        refreshTheme,
        hasPreview,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useWorkspaceTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useWorkspaceTheme must be used within a ThemeProvider");
  }
  return context;
}
