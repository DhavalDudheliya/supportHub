"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Loader2, RotateCcw, Save, Palette } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@supporthub/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@supporthub/ui/components/card";
import { Separator } from "@supporthub/ui/components/separator";

import { useWorkspaceTheme } from "@/lib/theme-context";
import { useAuth } from "@/lib/auth-context";
import {
  workspaceService,
  type WorkspaceTheme,
} from "@/lib/services/workspace.service";

import { ColorPicker } from "@/components/settings/branding/color-picker";
import { FontSelector } from "@/components/settings/branding/font-selector";
import { RadiusSlider } from "@/components/settings/branding/radius-slider";
import { ModeSelector } from "@/components/settings/branding/mode-selector";
import { AssetUpload } from "@/components/settings/branding/asset-upload";
import { ThemePreview } from "@/components/settings/branding/theme-preview";

/**
 * Branding Settings Page
 *
 * Allows ADMIN users to customize the workspace theme with live preview.
 * All changes are previewed instantly via CSS variable injection and
 * persisted only when the "Save Changes" button is clicked.
 */
export default function BrandingSettingsPage() {
  const { user } = useAuth();
  const {
    theme,
    isLoading: isThemeLoading,
    applyPreview,
    resetPreview,
    refreshTheme,
    hasPreview,
  } = useWorkspaceTheme();

  const [draft, setDraft] = useState<WorkspaceTheme | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isAdmin = user?.role === "ADMIN";

  // Initialize draft from theme
  useEffect(() => {
    if (theme && !draft) {
      setDraft({ ...theme });
    }
  }, [theme, draft]);

  // Warn on navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasPreview) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasPreview]);

  /** Update a draft field and trigger live preview. */
  const updateDraft = useCallback(
    (updates: Partial<WorkspaceTheme>) => {
      if (!draft) return;
      const next = { ...draft, ...updates };
      setDraft(next);
      applyPreview(next);
    },
    [draft, applyPreview],
  );

  /** Save the current draft to the server. */
  const handleSave = useCallback(async () => {
    if (!draft) return;

    setIsSaving(true);
    try {
      await workspaceService.updateTheme({
        primaryColor: draft.primaryColor,
        accentColor: draft.accentColor,
        fontFamily: draft.fontFamily,
        borderRadius: draft.borderRadius,
        defaultMode: draft.defaultMode,
      });
      await refreshTheme();
      // Re-sync draft with newly persisted theme
      setDraft(null);
      toast.success("Theme saved successfully");
    } catch (err) {
      console.error("Failed to save theme:", err);
      toast.error("Failed to save theme. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [draft, refreshTheme]);

  /** Reset to the last saved theme. */
  const handleReset = useCallback(() => {
    resetPreview();
    setDraft(theme ? { ...theme } : null);
  }, [resetPreview, theme]);

  /** Handle logo upload. */
  const handleLogoUpload = useCallback(
    async (file: File) => {
      try {
        const updated = await workspaceService.uploadLogo(file);
        await refreshTheme();
        setDraft((prev) =>
          prev ? { ...prev, logoUrl: updated.logoUrl } : prev,
        );
        toast.success("Logo uploaded successfully");
      } catch (err) {
        console.error("Failed to upload logo:", err);
        toast.error("Failed to upload logo. Please try again.");
      }
    },
    [refreshTheme],
  );

  /** Handle logo removal. */
  const handleLogoRemove = useCallback(async () => {
    try {
      await workspaceService.deleteLogo();
      await refreshTheme();
      setDraft((prev) => (prev ? { ...prev, logoUrl: null } : prev));
      toast.success("Logo removed");
    } catch (err) {
      console.error("Failed to remove logo:", err);
      toast.error("Failed to remove logo. Please try again.");
    }
  }, [refreshTheme]);

  /** Handle favicon upload. */
  const handleFaviconUpload = useCallback(
    async (file: File) => {
      try {
        const updated = await workspaceService.uploadFavicon(file);
        await refreshTheme();
        setDraft((prev) =>
          prev ? { ...prev, faviconUrl: updated.faviconUrl } : prev,
        );
        toast.success("Favicon uploaded successfully");
      } catch (err) {
        console.error("Failed to upload favicon:", err);
        toast.error("Failed to upload favicon. Please try again.");
      }
    },
    [refreshTheme],
  );

  /** Handle favicon removal. */
  const handleFaviconRemove = useCallback(async () => {
    try {
      await workspaceService.deleteFavicon();
      await refreshTheme();
      setDraft((prev) => (prev ? { ...prev, faviconUrl: null } : prev));
      toast.success("Favicon removed");
    } catch (err) {
      console.error("Failed to remove favicon:", err);
      toast.error("Failed to remove favicon. Please try again.");
    }
  }, [refreshTheme]);

  if (isThemeLoading || !draft) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">
              Only workspace admins can manage branding settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Palette className="h-6 w-6 text-primary" />
            Branding
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customize the look and feel of your workspace
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasPreview || isSaving}
            className="gap-1.5"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasPreview || isSaving}
            className="gap-1.5"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Editor Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Colors</CardTitle>
              <CardDescription>
                Set your brand colors. All UI elements will adapt automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <ColorPicker
                label="Primary Color"
                value={draft.primaryColor}
                onChange={(c) => updateDraft({ primaryColor: c })}
                description="Main brand color used for buttons, links, and active states"
              />
              <ColorPicker
                label="Accent Color"
                value={draft.accentColor}
                onChange={(c) => updateDraft({ accentColor: c })}
                description="Secondary color used for highlights and emphasis"
              />
            </CardContent>
          </Card>

          {/* Typography */}
          <Card className="overflow-visible">
            <CardHeader>
              <CardTitle className="text-base">Typography</CardTitle>
              <CardDescription>
                Choose the typeface used across your workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FontSelector
                value={draft.fontFamily}
                onChange={(f) => updateDraft({ fontFamily: f })}
              />
            </CardContent>
          </Card>

          {/* Shape */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shape</CardTitle>
              <CardDescription>
                Control the roundness of buttons, cards, and inputs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadiusSlider
                value={draft.borderRadius}
                onChange={(r) => updateDraft({ borderRadius: r })}
              />
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Appearance</CardTitle>
              <CardDescription>
                Set the default color mode for new sessions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ModeSelector
                value={draft.defaultMode}
                onChange={(m) => updateDraft({ defaultMode: m })}
              />
            </CardContent>
          </Card>

          {/* Assets */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Brand Assets</CardTitle>
              <CardDescription>
                Upload your logo and favicon for a fully branded experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <AssetUpload
                label="Logo"
                description="Displayed in the sidebar. PNG, JPG, SVG, or WebP. Max 2MB."
                value={draft.logoUrl}
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                maxSizeLabel="2MB"
                onUpload={handleLogoUpload}
                onRemove={handleLogoRemove}
              />
              <Separator />
              <AssetUpload
                label="Favicon"
                description="Displayed in the browser tab. ICO, PNG, or SVG. Max 500KB."
                value={draft.faviconUrl}
                accept="image/x-icon,image/png,image/svg+xml,image/vnd.microsoft.icon"
                maxSizeLabel="500KB"
                onUpload={handleFaviconUpload}
                onRemove={handleFaviconRemove}
              />
            </CardContent>
          </Card>
        </div>

        {/* Preview Column */}
        <div className="lg:col-span-2">
          <div className="sticky top-6 space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              Live Preview
            </h2>
            <ThemePreview logoUrl={draft.logoUrl} />
            <p className="text-xs text-muted-foreground text-center">
              This preview reflects your current changes in real time
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
