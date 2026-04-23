import { api } from "../api";

// --- Types ---

export interface ReportOverview {
  total: number;
  open: number;
  pending: number;
  solved: number;
  closed: number;
  avgResolutionHours: number;
}

export interface VolumePoint {
  date: string;
  count: number;
}

export interface StatusBreakdownItem {
  status: string;
  count: number;
}

export interface AgentPerformanceItem {
  agentId: string;
  name: string;
  count: number;
}

export interface TagDistributionItem {
  name: string;
  category: string;
  count: number;
}

// --- Query Params ---

function buildParams(from?: string, to?: string) {
  const params: Record<string, string> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  return params;
}

// --- Service ---

export const reportsService = {
  async getOverview(from?: string, to?: string): Promise<ReportOverview> {
    const res = await api.get("/reports/overview", {
      params: buildParams(from, to),
    });
    return res.data;
  },

  async getVolume(from?: string, to?: string): Promise<VolumePoint[]> {
    const res = await api.get("/reports/volume", {
      params: buildParams(from, to),
    });
    return res.data;
  },

  async getStatusBreakdown(
    from?: string,
    to?: string,
  ): Promise<StatusBreakdownItem[]> {
    const res = await api.get("/reports/status-breakdown", {
      params: buildParams(from, to),
    });
    return res.data;
  },

  async getAgentPerformance(
    from?: string,
    to?: string,
  ): Promise<AgentPerformanceItem[]> {
    const res = await api.get("/reports/agent-performance", {
      params: buildParams(from, to),
    });
    return res.data;
  },

  async getTagDistribution(
    from?: string,
    to?: string,
  ): Promise<TagDistributionItem[]> {
    const res = await api.get("/reports/tags", {
      params: buildParams(from, to),
    });
    return res.data;
  },
};
