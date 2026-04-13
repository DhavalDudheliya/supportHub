"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@supporthub/ui/components/card";

import { useWorkspaceTheme } from "@/lib/theme-context";
import { useAuth } from "@/lib/auth-context";
import { type WorkspaceTheme } from "@/lib/services/workspace.service";
import {
  useUpdateTheme,
  useUploadLogo,
  useDeleteLogo,
  useUploadFavicon,
  useDeleteFavicon,
} from "@/hooks/use-workspace";

import { ThemePreview } from "@/components/settings/branding/theme-preview";
import { BrandingSettingsHeader } from "@/components/settings/branding/branding-settings-header";
import { BrandingSettingsEditor } from "@/components/settings/branding/branding-settings-editor";

/**
 * Branding Settings Page
 *
 * Allows ADMIN users to customize the workspace theme with live preview.
 * All changes are previewed instantly via CSS variable injection and
 * persisted only when the "Save Changes" button is clicked.
 */
export function BrandingSettingsPage() {
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
  const isAdmin = user?.role === "ADMIN";

  const updateThemeMutation = useUpdateTheme();
  const uploadLogoMutation = useUploadLogo();
  const deleteLogoMutation = useDeleteLogo();
  const uploadFaviconMutation = useUploadFavicon();
  const deleteFaviconMutation = useDeleteFavicon();

  const isSaving =
    updateThemeMutation.isPending ||
    uploadLogoMutation.isPending ||
    deleteLogoMutation.isPending ||
    uploadFaviconMutation.isPending ||
    deleteFaviconMutation.isPending;

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

    try {
      await updateThemeMutation.mutateAsync({
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
    }
  }, [draft, refreshTheme, updateThemeMutation]);

  /** Reset to the last saved theme. */
  const handleReset = useCallback(() => {
    resetPreview();
    setDraft(theme ? { ...theme } : null);
  }, [resetPreview, theme]);

  /** Handle logo upload. */
  const handleLogoUpload = useCallback(
    async (file: File) => {
      try {
        const updated = await uploadLogoMutation.mutateAsync(file);
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
    [refreshTheme, uploadLogoMutation],
  );

  /** Handle logo removal. */
  const handleLogoRemove = useCallback(async () => {
    try {
      await deleteLogoMutation.mutateAsync();
      await refreshTheme();
      setDraft((prev) => (prev ? { ...prev, logoUrl: null } : prev));
      toast.success("Logo removed");
    } catch (err) {
      console.error("Failed to remove logo:", err);
      toast.error("Failed to remove logo. Please try again.");
    }
  }, [refreshTheme, deleteLogoMutation]);

  /** Handle favicon upload. */
  const handleFaviconUpload = useCallback(
    async (file: File) => {
      try {
        const updated = await uploadFaviconMutation.mutateAsync(file);
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
    [refreshTheme, uploadFaviconMutation],
  );

  /** Handle favicon removal. */
  const handleFaviconRemove = useCallback(async () => {
    try {
      await deleteFaviconMutation.mutateAsync();
      await refreshTheme();
      setDraft((prev) => (prev ? { ...prev, faviconUrl: null } : prev));
      toast.success("Favicon removed");
    } catch (err) {
      console.error("Failed to remove favicon:", err);
      toast.error("Failed to remove favicon. Please try again.");
    }
  }, [refreshTheme, deleteFaviconMutation]);

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
      <BrandingSettingsHeader
        onReset={handleReset}
        onSave={handleSave}
        isSaving={isSaving}
        hasPreview={hasPreview}
      />

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <BrandingSettingsEditor
          draft={draft}
          updateDraft={updateDraft}
          handleLogoUpload={handleLogoUpload}
          handleLogoRemove={handleLogoRemove}
          handleFaviconUpload={handleFaviconUpload}
          handleFaviconRemove={handleFaviconRemove}
        />

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
