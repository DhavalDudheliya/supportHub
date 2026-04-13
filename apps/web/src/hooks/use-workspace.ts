import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  workspaceService,
  type UpdateThemePayload,
} from "@/lib/services/workspace.service";

export function useUpdateTheme() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateThemePayload) =>
      workspaceService.updateTheme(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace.theme() });
    },
  });
}

export function useUploadLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workspaceService.uploadLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace.theme() });
    },
  });
}

export function useUploadFavicon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workspaceService.uploadFavicon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace.theme() });
    },
  });
}

export function useDeleteLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workspaceService.deleteLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace.theme() });
    },
  });
}

export function useDeleteFavicon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workspaceService.deleteFavicon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace.theme() });
    },
  });
}
