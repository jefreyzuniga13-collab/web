import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, toZonedTime } from "date-fns-tz";
import { performanceDashboardService } from "@/Services/dashboard/PerformanceDashboardService";
import type {
  DashboardAgentAverageResponseTopClientProj,
  DashboardAssignmentResponseTimeByAdminProj,
  DashboardAssignmentResponseTimeGlobalProj,
  DashboardIndicatorsByAgentProj,
  DashboardIndicatorsProj,
  DashboardRatingByAgentProj,
  DashboardRatingGlobalProj,
  DashboardWaitingClientProj,
  FilterDashboard,
} from "@/Interfaces/Dashboard/PerformanceDashboardInterfaces";

const DASHBOARD_FILTERS_KEY = "performanceDashboardFilters";
const DASHBOARD_THRESHOLD_KEY = "performanceDashboardCriticalThreshold";
const DASHBOARD_SELECTED_AGENT_KEY = "performanceDashboardSelectedAgentId";
const DEFAULT_CRITICAL_MINUTES = 5;
const DEFAULT_WAITING_STATUS = 1;
const DEFAULT_HUMAN_STATUS = 2;

const getManaguaToday = () => {
  const zone = "America/Managua";
  const today = toZonedTime(new Date(), zone);
  return format(today, "yyyy-MM-dd", { timeZone: zone });
};

const getInitialFilters = (): FilterDashboard => {
  const saved = localStorage.getItem(DASHBOARD_FILTERS_KEY);

  if (saved) {
    try {
      return JSON.parse(saved) as FilterDashboard;
    } catch {
      localStorage.removeItem(DASHBOARD_FILTERS_KEY);
    }
  }

  const today = getManaguaToday(); // Ej: "2026-06-12"
  // Toma los primeros 4 caracteres (el año) y le concatena el 1 de enero
  const startOfYear = `${today.substring(0, 4)}-01-01`; // Resultado: "2026-01-01"

  return {
    from: startOfYear,
    to: today,
    startTime: null,
    endTime: null,
    agentId: null,
    adminUserId: null,
    contactId: null,
    clientId: null,
    today: false,
    yesterday: false,
    tomorrow: false,
  };
};

const getInitialThreshold = () => {
  const saved = localStorage.getItem(DASHBOARD_THRESHOLD_KEY);
  const value = saved ? Number(saved) : DEFAULT_CRITICAL_MINUTES;
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_CRITICAL_MINUTES;
};

const normalizeDate = (value?: string | Date | null) => {
  if (!value) return null;

  if (value instanceof Date) {
    return format(value, "yyyy-MM-dd");
  }

  return value;
};

const normalizeTime = (value?: string | Date | null) => {
  if (!value) return null;

  if (value instanceof Date) {
    return format(value, "HH:mm:ss");
  }

  return value;
};

const normalizeFilters = (filters: FilterDashboard): FilterDashboard => {
  return {
    ...filters,
    from: normalizeDate(filters.from),
    to: normalizeDate(filters.to),
    startTime: normalizeTime(filters.startTime),
    endTime: normalizeTime(filters.endTime),
    agentId: filters.agentId ?? null,
    adminUserId: filters.adminUserId ?? null,
    contactId: filters.contactId ?? null,
    clientId: filters.clientId ?? null,
  };
};

export const performanceDashboardKeys = {
  all: ["performance-dashboard"] as const,
  indicatorsGlobal: (filters: FilterDashboard) =>
    [...performanceDashboardKeys.all, "indicators-global", normalizeFilters(filters)] as const,
  indicatorsByAgent: (filters: FilterDashboard) =>
    [...performanceDashboardKeys.all, "indicators-by-agent", normalizeFilters(filters)] as const,
  indicatorsAgentDetail: (filters: FilterDashboard, agentId: number) =>
    [...performanceDashboardKeys.all, "indicators-agent-detail", normalizeFilters(filters), agentId] as const,
  ratingGlobal: (filters: FilterDashboard) =>
    [...performanceDashboardKeys.all, "rating-global", normalizeFilters(filters)] as const,
  ratingByAgent: (filters: FilterDashboard, agentId: number) =>
    [...performanceDashboardKeys.all, "rating-by-agent", normalizeFilters(filters), agentId] as const,
  waitingGlobal: (criticalMinutes: number, waitingStatus: number, humanStatus: number) =>
    [...performanceDashboardKeys.all, "waiting-global", criticalMinutes, waitingStatus, humanStatus] as const,
  waitingByAgent: (agentId: number, criticalMinutes: number, waitingStatus: number, humanStatus: number) =>
    [...performanceDashboardKeys.all, "waiting-by-agent", agentId, criticalMinutes, waitingStatus, humanStatus] as const,
  assignmentGlobal: (filters: FilterDashboard) =>
    [...performanceDashboardKeys.all, "assignment-global", normalizeFilters(filters)] as const,
  assignmentByAdmin: (filters: FilterDashboard) =>
    [...performanceDashboardKeys.all, "assignment-by-admin", normalizeFilters(filters)] as const,
  topClientsByAgent: (agentId: number, top: number) =>
    [...performanceDashboardKeys.all, "top-clients-by-agent", agentId, top] as const,
};

export const usePerformanceDashboardFilters = () => {
  const [filters, setFilters] = useState<FilterDashboard>(getInitialFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(DASHBOARD_FILTERS_KEY, JSON.stringify(filters));
  }, [filters]);

  const applyFilters = useCallback((nextFilters: FilterDashboard) => {
    setFilters(normalizeFilters(nextFilters));
    setIsFilterOpen(false);
  }, []);

  const clearFilters = useCallback(() => {
    const initial = getInitialFilters();
    localStorage.removeItem(DASHBOARD_FILTERS_KEY);
    setFilters(initial);
  }, []);

  return {
    filters,
    setFilters,
    applyFilters,
    clearFilters,
    isFilterOpen,
    setIsFilterOpen,
  };
};

export const useDashboardIndicatorsGlobal = (
  filters: FilterDashboard,
  enabled = true
) => {
  const safeFilters = useMemo(() => normalizeFilters(filters), [filters]);

  return useQuery<DashboardIndicatorsProj | null, Error>({
    queryKey: performanceDashboardKeys.indicatorsGlobal(safeFilters),
    queryFn: () => performanceDashboardService.getDashboardIndicatorsGlobal(safeFilters),
    enabled,
    // staleTime: 1000 * 60 * 3,
  });
};

export const useDashboardIndicatorsByAgent = (
  filters: FilterDashboard,
  enabled = true
) => {
  const safeFilters = useMemo(() => normalizeFilters(filters), [filters]);

  return useQuery<DashboardIndicatorsByAgentProj[], Error>({
    queryKey: performanceDashboardKeys.indicatorsByAgent(safeFilters),
    queryFn: () => performanceDashboardService.getDashboardIndicatorsByAgent(safeFilters),
    enabled,
    // staleTime: 1000 * 60 * 3,
  });
};

export const useDashboardIndicatorsAgentDetail = (
  filters: FilterDashboard,
  agentId: number | null | undefined,
  enabled = true
) => {
  const safeFilters = useMemo(() => normalizeFilters(filters), [filters]);
  const safeAgentId = agentId ?? 0;

  return useQuery<DashboardIndicatorsByAgentProj | null, Error>({
    queryKey: performanceDashboardKeys.indicatorsAgentDetail(safeFilters, safeAgentId),
    queryFn: () => performanceDashboardService.getDashboardIndicatorsAgentDetail(safeFilters, safeAgentId),
    enabled: enabled && safeAgentId > 0,
    // staleTime: 1000 * 60 * 3,
  });
};

export const useDashboardConversationRatingGlobal = (
  filters: FilterDashboard,
  // enabled = true
) => {
  const safeFilters = useMemo(() => normalizeFilters(filters), [filters]);

  return useQuery<DashboardRatingGlobalProj | null, Error>({
    queryKey: performanceDashboardKeys.ratingGlobal(safeFilters),
    queryFn: () => performanceDashboardService.getDashboardConversationRatingGlobal(safeFilters),
    // enabled,
    // staleTime: 1000 * 60 * 3,
  });
};

export const useDashboardConversationRatingByAgent = (
  filters: FilterDashboard,
  agentId = 0,
  // enabled = true
) => {
  const safeFilters = useMemo(() => normalizeFilters(filters), [filters]);

  return useQuery<DashboardRatingByAgentProj[], Error>({
    queryKey: performanceDashboardKeys.ratingByAgent(safeFilters, agentId),
    queryFn: () => performanceDashboardService.getDashboardConversationRatingByAgent(safeFilters, agentId),
    // enabled,
    // staleTime: 1000 * 60 * 3,
  });
};

export const useDashboardWaitingClientsGlobal = (
  criticalMinutes: number,
  waitingStatus = DEFAULT_WAITING_STATUS,
  humanStatus = DEFAULT_HUMAN_STATUS,
  enabled = true
) => {
  return useQuery<DashboardWaitingClientProj[], Error>({
    queryKey: performanceDashboardKeys.waitingGlobal(criticalMinutes, waitingStatus, humanStatus),
    queryFn: () =>
      performanceDashboardService.getDashboardWaitingClientsGlobal(
        criticalMinutes,
        waitingStatus,
        humanStatus
      ),
    enabled: enabled && criticalMinutes > 0,
    // staleTime: 1000 * 60,
  });
};

export const useDashboardWaitingClientsByAgent = (
  agentId: number | null | undefined,
  criticalMinutes: number,
  waitingStatus = DEFAULT_WAITING_STATUS,
  humanStatus = DEFAULT_HUMAN_STATUS,
  enabled = true
) => {
  const safeAgentId = agentId ?? 0;

  return useQuery<DashboardWaitingClientProj[], Error>({
    queryKey: performanceDashboardKeys.waitingByAgent(
      safeAgentId,
      criticalMinutes,
      waitingStatus,
      humanStatus
    ),
    queryFn: () =>
      performanceDashboardService.getDashboardWaitingClientsByAgent(
        safeAgentId,
        criticalMinutes,
        waitingStatus,
        humanStatus
      ),
    enabled: enabled && safeAgentId > 0 && criticalMinutes > 0,
    // staleTime: 1000 * 60,
  });
};

export const useDashboardAssignmentResponseTimeGlobal = (
  filters: FilterDashboard,
  enabled = true
) => {
  const safeFilters = useMemo(() => normalizeFilters(filters), [filters]);

  return useQuery<DashboardAssignmentResponseTimeGlobalProj | null, Error>({
    queryKey: performanceDashboardKeys.assignmentGlobal(safeFilters),
    queryFn: () => performanceDashboardService.getDashboardAssignmentResponseTimeGlobal(safeFilters),
    enabled,
    // staleTime: 1000 * 60 * 3,
  });
};

export const useDashboardAssignmentResponseTimeByAdmin = (
  filters: FilterDashboard,
  enabled = true
) => {
  const safeFilters = useMemo(() => normalizeFilters(filters), [filters]);

  return useQuery<DashboardAssignmentResponseTimeByAdminProj[], Error>({
    queryKey: performanceDashboardKeys.assignmentByAdmin(safeFilters),
    queryFn: () => performanceDashboardService.getDashboardAssignmentResponseTimeByAdmin(safeFilters),
    enabled,
    // staleTime: 1000 * 60 * 3,
  });
};

export const useDashboardAgentAverageResponseTopClients = (
  agentId: number | null | undefined,
  top = 10,
  enabled = true
) => {
  const safeAgentId = agentId ?? 0;

  return useQuery<DashboardAgentAverageResponseTopClientProj[], Error>({
    queryKey: performanceDashboardKeys.topClientsByAgent(safeAgentId, top),
    queryFn: () =>
      performanceDashboardService.getDashboardAgentAverageResponseTopClients(
        safeAgentId,
        top
      ),
    enabled: enabled && safeAgentId > 0,
    // staleTime: 1000 * 60 * 3,
  });
};

interface UsePerformanceDashboardOptions {
  agentId?: number | null;
  topClientsLimit?: number;
  criticalMinutes?: number;
  waitingStatus?: number;
  humanStatus?: number;
  enabled?: boolean;
}

export const usePerformanceDashboard = (options?: UsePerformanceDashboardOptions) => {
  const queryClient = useQueryClient();

  const {
    filters,
    setFilters,
    applyFilters,
    clearFilters,
    isFilterOpen,
    setIsFilterOpen,
  } = usePerformanceDashboardFilters();

  const [criticalMinutes, setCriticalMinutesState] = useState<number>(() => {
    return options?.criticalMinutes ?? getInitialThreshold();
  });

  const [selectedAgentId, setSelectedAgentIdState] = useState<number | null>(() => {
    if (options?.agentId && options.agentId > 0) return options.agentId;

    const saved = localStorage.getItem(DASHBOARD_SELECTED_AGENT_KEY);
    const value = saved ? Number(saved) : null;

    return value && value > 0 ? value : null;
  });

  const enabled = options?.enabled ?? true;
  const waitingStatus = options?.waitingStatus ?? DEFAULT_WAITING_STATUS;
  const humanStatus = options?.humanStatus ?? DEFAULT_HUMAN_STATUS;
  const topClientsLimit = options?.topClientsLimit ?? 10;
  
  //PerformanceDashboard.css

  const activeAgentId = useMemo(() => {
    return selectedAgentId ?? filters.agentId ?? null;
  }, [selectedAgentId, filters.agentId]);

  useEffect(() => {
    localStorage.setItem(DASHBOARD_THRESHOLD_KEY, String(criticalMinutes));
  }, [criticalMinutes]);

  useEffect(() => {
    if (selectedAgentId && selectedAgentId > 0) {
      localStorage.setItem(DASHBOARD_SELECTED_AGENT_KEY, String(selectedAgentId));
    } else {
      localStorage.removeItem(DASHBOARD_SELECTED_AGENT_KEY);
    }
  }, [selectedAgentId]);

  const indicatorsGlobal = useDashboardIndicatorsGlobal(filters, enabled);
  const indicatorsByAgent = useDashboardIndicatorsByAgent(filters, enabled);
  const indicatorsAgentDetail = useDashboardIndicatorsAgentDetail(
    filters,
    activeAgentId,
    enabled
  );

  const ratingGlobal = useDashboardConversationRatingGlobal(filters);
  const ratingByAgent = useDashboardConversationRatingByAgent(
    filters,
    activeAgentId ?? 0,
    // enabled
  );

  const waitingClientsGlobal = useDashboardWaitingClientsGlobal(
    criticalMinutes,
    waitingStatus,
    humanStatus,
    enabled
  );

  const waitingClientsByAgent = useDashboardWaitingClientsByAgent(
    activeAgentId,
    criticalMinutes,
    waitingStatus,
    humanStatus,
    enabled
  );

  const assignmentResponseTimeGlobal = useDashboardAssignmentResponseTimeGlobal(
    filters,
    enabled
  );

  const assignmentResponseTimeByAdmin = useDashboardAssignmentResponseTimeByAdmin(
    filters,
    enabled
  );

  const topClientsByAgent = useDashboardAgentAverageResponseTopClients(
    activeAgentId,
    topClientsLimit,
    enabled
  );

  const setCriticalMinutes = useCallback((value: number) => {
    const nextValue = Number(value);
    setCriticalMinutesState(Number.isFinite(nextValue) && nextValue > 0 ? nextValue : 1);
  }, []);

  const setSelectedAgentId = useCallback((agentId: number | null) => {
    setSelectedAgentIdState(agentId && agentId > 0 ? agentId : null);
  }, []);

  const handleApply = useCallback(
    (nextFilters: FilterDashboard) => {
      applyFilters(nextFilters);

      if (nextFilters.agentId && nextFilters.agentId > 0) {
        setSelectedAgentId(nextFilters.agentId);
      }
    },
    [applyFilters, setSelectedAgentId]
  );

  const refreshAll = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: performanceDashboardKeys.all,
    });
  }, [queryClient]);

  const loading =
    indicatorsGlobal.isLoading ||
    indicatorsByAgent.isLoading ||
    indicatorsAgentDetail.isLoading ||
    ratingGlobal.isLoading ||
    ratingByAgent.isLoading ||
    waitingClientsGlobal.isLoading ||
    waitingClientsByAgent.isLoading ||
    assignmentResponseTimeGlobal.isLoading ||
    assignmentResponseTimeByAdmin.isLoading ||
    topClientsByAgent.isLoading;

  const fetching =
    indicatorsGlobal.isFetching ||
    indicatorsByAgent.isFetching ||
    indicatorsAgentDetail.isFetching ||
    ratingGlobal.isFetching ||
    ratingByAgent.isFetching ||
    waitingClientsGlobal.isFetching ||
    waitingClientsByAgent.isFetching ||
    assignmentResponseTimeGlobal.isFetching ||
    assignmentResponseTimeByAdmin.isFetching ||
    topClientsByAgent.isFetching;

  const error =
    indicatorsGlobal.error ||
    indicatorsByAgent.error ||
    indicatorsAgentDetail.error ||
    ratingGlobal.error ||
    ratingByAgent.error ||
    waitingClientsGlobal.error ||
    waitingClientsByAgent.error ||
    assignmentResponseTimeGlobal.error ||
    assignmentResponseTimeByAdmin.error ||
    topClientsByAgent.error ||
    null;

  return {
    filters,
    setFilters,
    handleApply,
    clearFilters,
    isFilterOpen,
    setIsFilterOpen,

    criticalMinutes,
    setCriticalMinutes,
    selectedAgentId,
    setSelectedAgentId,
    activeAgentId,

    indicatorsGlobal: indicatorsGlobal.data ?? null,
    indicatorsByAgent: indicatorsByAgent.data ?? [],
    indicatorsAgentDetail: indicatorsAgentDetail.data ?? null,

    ratingGlobal: ratingGlobal.data ?? null,
    ratingByAgent: ratingByAgent.data ?? [],

    waitingClientsGlobal: waitingClientsGlobal.data ?? [],
    waitingClientsByAgent: waitingClientsByAgent.data ?? [],

    assignmentResponseTimeGlobal: assignmentResponseTimeGlobal.data ?? null,
    assignmentResponseTimeByAdmin: assignmentResponseTimeByAdmin.data ?? [],

    topClientsByAgent: topClientsByAgent.data ?? [],

    loading,
    fetching,
    error,
    refreshAll,

    queries: {
      indicatorsGlobal,
      indicatorsByAgent,
      indicatorsAgentDetail,
      ratingGlobal,
      ratingByAgent,
      waitingClientsGlobal,
      waitingClientsByAgent,
      assignmentResponseTimeGlobal,
      assignmentResponseTimeByAdmin,
      topClientsByAgent,
    },
  };
};

export default usePerformanceDashboard;