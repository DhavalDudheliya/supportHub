/**
 * useReports — TanStack Query hooks for the Reporting module.
 *
 * Each hook wraps a reports.service call with proper cache keys
 * and stale-time configuration suited for analytics data.
 */

import { useQuery } from "@tanstack/react-query";
import { reportsService } from "@/lib/services/reports.service";
import { queryKeys } from "@/lib/query-keys";

const STALE_TIME = 2 * 60 * 1000; // 2 minutes — analytics don't need instant refresh

export function useReportsOverview(from?: string, to?: string) {
  return useQuery({
    queryKey: queryKeys.reports.overview(from, to),
    queryFn: () => reportsService.getOverview(from, to),
    staleTime: STALE_TIME,
  });
}

export function useTicketVolume(from?: string, to?: string) {
  return useQuery({
    queryKey: queryKeys.reports.volume(from, to),
    queryFn: () => reportsService.getVolume(from, to),
    staleTime: STALE_TIME,
  });
}

export function useStatusBreakdown(from?: string, to?: string) {
  return useQuery({
    queryKey: queryKeys.reports.statusBreakdown(from, to),
    queryFn: () => reportsService.getStatusBreakdown(from, to),
    staleTime: STALE_TIME,
  });
}

export function useAgentPerformance(from?: string, to?: string) {
  return useQuery({
    queryKey: queryKeys.reports.agentPerformance(from, to),
    queryFn: () => reportsService.getAgentPerformance(from, to),
    staleTime: STALE_TIME,
  });
}

export function useTagDistribution(from?: string, to?: string) {
  return useQuery({
    queryKey: queryKeys.reports.tagDistribution(from, to),
    queryFn: () => reportsService.getTagDistribution(from, to),
    staleTime: STALE_TIME,
  });
}
