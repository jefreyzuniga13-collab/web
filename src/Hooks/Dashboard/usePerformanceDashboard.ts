import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { performanceDashboardService } from "@/Services/dashboard/PerformanceDashboardService";
import { ConversationService } from "@/Services/chat/ConversationService";
import type {
  DashboardAgentAverageResponseByAgentProj,
  DashboardAssignmentResponseTimeByAdminProj,
  DashboardAssignmentResponseTimeGlobalProj,
  DashboardIndicatorsByAgentProj,
  DashboardIndicatorsProj,
  DashboardRatingByAgentProj,
  DashboardRatingGlobalProj,
  DashboardWaitingClientProj,
  FilterDashboard,
} from "@/Interfaces/Dashboard/PerformanceDashboardInterfaces";
import type {ConversationStatusCountResponseDto,FilterForm} from "@/Interfaces/Dashboard/DashboardInterfaces";
import type { ConversationDto } from "@/Interfaces/Chat/ChatInterfaces";
import { getManaguaToday, normalizeDate } from "@/Utils/ECommerce/formatters";
import { DASHBOARD_FILTERS_KEY, DASHBOARD_SELECTED_AGENT_KEY,DASHBOARD_THRESHOLD_KEY, DEFAULT_CRITICAL_MINUTES, DEFAULT_HUMAN_STATUS,
  DEFAULT_PAGE, DEFAULT_PAGE_SIZE, DEFAULT_WAITING_STATUS
 } from "@/Constants/dashboardConst";
interface DashboardPagedResponse<T> {
  items: T[];
  meta: {
    totalCount: number;
    pageNumber?: number;
    pageSize?: number;
    totalPages?: number;
  };
}

const getInitialFilters = (): FilterDashboard => {
  const saved = localStorage.getItem(DASHBOARD_FILTERS_KEY);

  if (saved) {
    try {
      const parsed = JSON.parse(saved) as Partial<FilterDashboard>;

      return normalizeFilters({
        from: parsed.from ?? null,
        to: parsed.to ?? null,
        agentId: parsed.agentId ?? null
      });
    } catch {
      localStorage.removeItem(DASHBOARD_FILTERS_KEY);
    }
  }

  const today = getManaguaToday();
  const startOfYear = `${today.substring(0, 4)}-01-01`;

  return {
    from: startOfYear,
    to: today,
    agentId: null
  };
};

const getInitialThreshold = () => {
  const saved = localStorage.getItem(DASHBOARD_THRESHOLD_KEY);
  const value = saved ? Number(saved) : DEFAULT_CRITICAL_MINUTES;

  return Number.isFinite(value) && value > 0
    ? value
    : DEFAULT_CRITICAL_MINUTES;
};

const normalizeFilters = (filters: FilterDashboard): FilterDashboard => {
  return {
    from: normalizeDate(filters.from),
    to: normalizeDate(filters.to),
    agentId: filters.agentId ?? null
  };
};

const toFilterForm = (filters: FilterDashboard): FilterForm => {
  const safeFilters = normalizeFilters(filters);

  return {
    from: safeFilters.from ?? null,
    to: safeFilters.to ?? null,

    startTime: null,
    endTime: null,

    agentId: safeFilters.agentId ?? null,
    agentName: null,

    adminUserId: null,
    adminUserName: null,

    companiesId: null,

    contactId: null,
    contactName: null,

    clientId: null,
    clientName: null,

    today: false,
    yesterday: false,
    tomorrow: false,
  };
};

export const performanceDashboardKeys = {
  all: ["performance-dashboard"] as const,

  statusData: (filters: FilterDashboard) =>
    [
      ...performanceDashboardKeys.all,
      "status-data",
      normalizeFilters(filters),
    ] as const,

  indicatorsGlobal: (filters: FilterDashboard) =>
    [
      ...performanceDashboardKeys.all,
      "indicators-global",
      normalizeFilters(filters),
    ] as const,

  indicatorsByAgent: (filters: FilterDashboard) =>
    [
      ...performanceDashboardKeys.all,
      "indicators-by-agent",
      normalizeFilters(filters),
    ] as const,

  indicatorsAgentDetail: (filters: FilterDashboard, agentId: number) =>
    [
      ...performanceDashboardKeys.all,
      "indicators-agent-detail",
      normalizeFilters(filters),
      agentId,
    ] as const,

  ratingGlobal: (filters: FilterDashboard) =>
    [
      ...performanceDashboardKeys.all,
      "rating-global",
      normalizeFilters(filters),
    ] as const,

  ratingByAgent: (filters: FilterDashboard, agentId: number) =>
    [
      ...performanceDashboardKeys.all,
      "rating-by-agent",
      normalizeFilters(filters),
      agentId,
    ] as const,

  waitingGlobal: (
    criticalMinutes: number,
    waitingStatus: number,
    humanStatus: number
  ) =>
    [
      ...performanceDashboardKeys.all,
      "waiting-global",
      criticalMinutes,
      waitingStatus,
      humanStatus,
    ] as const,

  waitingByAgent: (
    agentId: number,
    criticalMinutes: number,
    waitingStatus: number,
    humanStatus: number
  ) =>
    [
      ...performanceDashboardKeys.all,
      "waiting-by-agent",
      agentId,
      criticalMinutes,
      waitingStatus,
      humanStatus,
    ] as const,

  assignmentGlobal: (filters: FilterDashboard) =>
    [
      ...performanceDashboardKeys.all,
      "assignment-global",
      normalizeFilters(filters),
    ] as const,

  assignmentByAdmin: (filters: FilterDashboard) =>
    [
      ...performanceDashboardKeys.all,
      "assignment-by-admin",
      normalizeFilters(filters),
    ] as const,

  agentAverageResponseByAgent: (filters: FilterDashboard) =>
    [
      ...performanceDashboardKeys.all,
      "agent-average-response-by-agent",
      normalizeFilters(filters),
    ] as const,

  recentConversations: (
    filters: FilterDashboard,
    page: number,
    pageSize: number
  ) =>
    [
      ...performanceDashboardKeys.all,
      "recent-conversations",
      normalizeFilters(filters),
      page,
      pageSize,
    ] as const,
};

export const usePerformanceDashboardFilters = () => {
  const [filters, setFilters] = useState<FilterDashboard>(getInitialFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(
      DASHBOARD_FILTERS_KEY,
      JSON.stringify(normalizeFilters(filters))
    );
  }, [filters]);

  const applyFilters = useCallback((nextFilters: FilterDashboard) => {
    setFilters(normalizeFilters(nextFilters));
    setIsFilterOpen(false);
  }, []);

  const clearFilters = useCallback(() => {
    const initial = getInitialFilters();

    localStorage.removeItem(DASHBOARD_FILTERS_KEY);
    setFilters({
      ...initial,
      agentId: null,
      agentName: null,
    });
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

export const useDashboardStatusData = (
  filters: FilterDashboard,
  enabled = true
) => {
  const safeFilters = useMemo(() => normalizeFilters(filters), [filters]);

  return useQuery<ConversationStatusCountResponseDto[], Error>({
    queryKey: performanceDashboardKeys.statusData(safeFilters),
    queryFn: () => ConversationService.getByDateRange(toFilterForm(safeFilters)),
    enabled,
  });
};

export const useDashboardIndicatorsGlobal = (
  filters: FilterDashboard,
  enabled = true
) => {
  const safeFilters = useMemo(() => normalizeFilters(filters), [filters]);

  return useQuery<DashboardIndicatorsProj | null, Error>({
    queryKey: performanceDashboardKeys.indicatorsGlobal(safeFilters),
    queryFn: () =>
      performanceDashboardService.getDashboardIndicatorsGlobal(safeFilters),
    enabled,
  });
};

export const useDashboardIndicatorsByAgent = (
  filters: FilterDashboard,
  enabled = true
) => {
  const safeFilters = useMemo(() => normalizeFilters(filters), [filters]);

  return useQuery<DashboardIndicatorsByAgentProj[], Error>({
    queryKey: performanceDashboardKeys.indicatorsByAgent(safeFilters),
    queryFn: () =>
      performanceDashboardService.getDashboardIndicatorsByAgent(safeFilters),
    enabled,
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
    queryKey: performanceDashboardKeys.indicatorsAgentDetail(
      safeFilters,
      safeAgentId
    ),
    queryFn: () =>
      performanceDashboardService.getDashboardIndicatorsAgentDetail(
        safeFilters,
        safeAgentId
      ),
    enabled: enabled && safeAgentId > 0,
  });
};

export const useDashboardConversationRatingGlobal = (
  filters: FilterDashboard,
  enabled = true
) => {
  const safeFilters = useMemo(() => normalizeFilters(filters), [filters]);

  return useQuery<DashboardRatingGlobalProj | null, Error>({
    queryKey: performanceDashboardKeys.ratingGlobal(safeFilters),
    queryFn: () =>
      performanceDashboardService.getDashboardConversationRatingGlobal(
        safeFilters
      ),
    enabled,
  });
};

export const useDashboardConversationRatingByAgent = (
  filters: FilterDashboard,
  agentId = 0,
  enabled = true
) => {
  const safeFilters = useMemo(() => normalizeFilters(filters), [filters]);

  return useQuery<DashboardRatingByAgentProj[], Error>({
    queryKey: performanceDashboardKeys.ratingByAgent(safeFilters, agentId),
    queryFn: () =>
      performanceDashboardService.getDashboardConversationRatingByAgent(
        safeFilters,
        agentId
      ),
    enabled,
  });
};

export const useDashboardWaitingClientsGlobal = (
  criticalMinutes: number,
  waitingStatus = DEFAULT_WAITING_STATUS,
  humanStatus = DEFAULT_HUMAN_STATUS,
  enabled = true
) => {
  return useQuery<DashboardWaitingClientProj[], Error>({
    queryKey: performanceDashboardKeys.waitingGlobal(
      criticalMinutes,
      waitingStatus,
      humanStatus
    ),
    queryFn: () =>
      performanceDashboardService.getDashboardWaitingClientsGlobal(
        criticalMinutes,
        waitingStatus,
        humanStatus
      ),
    enabled: enabled && criticalMinutes > 0,
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
  });
};

export const useDashboardAssignmentResponseTimeGlobal = (
  filters: FilterDashboard,
  enabled = true
) => {
  const safeFilters = useMemo(() => normalizeFilters(filters), [filters]);

  return useQuery<DashboardAssignmentResponseTimeGlobalProj | null, Error>({
    queryKey: performanceDashboardKeys.assignmentGlobal(safeFilters),
    queryFn: () =>
      performanceDashboardService.getDashboardAssignmentResponseTimeGlobal(
        safeFilters
      ),
    enabled,
  });
};

export const useDashboardAssignmentResponseTimeByAdmin = (
  filters: FilterDashboard,
  enabled = true
) => {
  const safeFilters = useMemo(() => normalizeFilters(filters), [filters]);

  return useQuery<DashboardAssignmentResponseTimeByAdminProj[], Error>({
    queryKey: performanceDashboardKeys.assignmentByAdmin(safeFilters),
    queryFn: () =>
      performanceDashboardService.getDashboardAssignmentResponseTimeByAdmin(
        safeFilters
      ),
    enabled,
  });
};

export const useDashboardAgentAverageResponseByAgent = (
  filters: FilterDashboard,
  enabled = true
) => {
  const safeFilters = useMemo(() => normalizeFilters(filters), [filters]);

  return useQuery<DashboardAgentAverageResponseByAgentProj[], Error>({
    queryKey: performanceDashboardKeys.agentAverageResponseByAgent(safeFilters),
    queryFn: () =>
      performanceDashboardService.getDashboardAgentAverageResponseByAgent(
        safeFilters
      ),
    enabled,
  });
};

export const useDashboardRecentConversations = (
  filters: FilterDashboard,
  page: number,
  pageSize: number,
  enabled = true
) => {
  const safeFilters = useMemo(() => normalizeFilters(filters), [filters]);

  return useQuery<DashboardPagedResponse<ConversationDto>, Error>({
    queryKey: performanceDashboardKeys.recentConversations(
      safeFilters,
      page,
      pageSize
    ),
    queryFn: async () => {
      const response = await ConversationService.getConversationByClient(
        toFilterForm(safeFilters),
        page,
        pageSize
      );

      return response as DashboardPagedResponse<ConversationDto>;
    },
    enabled,
  });
  
};

interface UsePerformanceDashboardOptions {
  agentId?: number | null;
  criticalMinutes?: number;
  waitingStatus?: number;
  humanStatus?: number;
  enabled?: boolean;
  initialPageSize?: number;
  topClientsLimit?: number;
}

export const usePerformanceDashboard = (
  options?: UsePerformanceDashboardOptions
) => {
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

  const [selectedAgentId, setSelectedAgentIdState] = useState<number | null>(
    () => {
      if (options?.agentId && options.agentId > 0) return options.agentId;

      const saved = localStorage.getItem(DASHBOARD_SELECTED_AGENT_KEY);
      const value = saved ? Number(saved) : null;

      return value && value > 0 ? value : null;
    }
  );

  const [recentPage, setRecentPage] = useState(DEFAULT_PAGE);
  const [recentPageSize, setRecentPageSizeState] = useState(
    options?.initialPageSize ?? DEFAULT_PAGE_SIZE
  );

  const enabled = options?.enabled ?? true;
  const waitingStatus = options?.waitingStatus ?? DEFAULT_WAITING_STATUS;
  const humanStatus = options?.humanStatus ?? DEFAULT_HUMAN_STATUS;

  const activeAgentId = useMemo(() => {
    return selectedAgentId ?? filters.agentId ?? null;
  }, [selectedAgentId, filters.agentId]);

  const effectiveFilters = useMemo(() => {
    return normalizeFilters({
      ...filters,
      agentId: activeAgentId,
    });
  }, [filters, activeAgentId]);

  useEffect(() => {
    localStorage.setItem(DASHBOARD_THRESHOLD_KEY, String(criticalMinutes));
  }, [criticalMinutes]);

  useEffect(() => {
    if (selectedAgentId && selectedAgentId > 0) {
      localStorage.setItem(
        DASHBOARD_SELECTED_AGENT_KEY,
        String(selectedAgentId)
      );
    } else {
      localStorage.removeItem(DASHBOARD_SELECTED_AGENT_KEY);
    }
  }, [selectedAgentId]);

  const statusData = useDashboardStatusData(effectiveFilters, enabled);

  const indicatorsGlobal = useDashboardIndicatorsGlobal(effectiveFilters, enabled);
  const indicatorsByAgent = useDashboardIndicatorsByAgent(effectiveFilters, enabled);

  const indicatorsAgentDetail = useDashboardIndicatorsAgentDetail(
    effectiveFilters,
    activeAgentId,
    enabled
  );

  const ratingGlobal = useDashboardConversationRatingGlobal(
    effectiveFilters,
    enabled
  );

  const ratingByAgent = useDashboardConversationRatingByAgent(
    effectiveFilters,
    activeAgentId ?? 0,
    enabled
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

  const assignmentResponseTimeGlobal =
    useDashboardAssignmentResponseTimeGlobal(effectiveFilters, enabled);

  const assignmentResponseTimeByAdmin =
    useDashboardAssignmentResponseTimeByAdmin(effectiveFilters, enabled);

  const agentAverageResponseByAgent = useDashboardAgentAverageResponseByAgent(
    effectiveFilters,
    enabled
  );

  const recentConversationsQuery = useDashboardRecentConversations(
    effectiveFilters,
    recentPage,
    recentPageSize,
    enabled
  );

  const setCriticalMinutes = useCallback((value: number) => {
    const nextValue = Number(value);

    setCriticalMinutesState(
      Number.isFinite(nextValue) && nextValue > 0 ? nextValue : 1
    );
  }, []);

  const setSelectedAgentId = useCallback((agentId: number | null) => {
    setSelectedAgentIdState(agentId && agentId > 0 ? agentId : null);
  }, []);

  const setRecentPageSize = useCallback((size: number) => {
    const nextSize = Number(size);

    setRecentPageSizeState(
      Number.isFinite(nextSize) && nextSize > 0 ? nextSize : DEFAULT_PAGE_SIZE
    );

    setRecentPage(DEFAULT_PAGE);
  }, []);

  const handleApply = useCallback(
    (nextFilters: FilterDashboard) => {
      const safeFilters = normalizeFilters(nextFilters);

      applyFilters(safeFilters);

      if (safeFilters.agentId && safeFilters.agentId > 0) {
        setSelectedAgentId(safeFilters.agentId);
      }

      setRecentPage(DEFAULT_PAGE);
    },
    [applyFilters, setSelectedAgentId]
  );

  const handleClearFilters = useCallback(() => {
    clearFilters();
    setSelectedAgentId(null);
    setRecentPage(DEFAULT_PAGE);
  }, [clearFilters, setSelectedAgentId]);

  const refreshAll = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: performanceDashboardKeys.all,
    });
  }, [queryClient]);

  const loading =
    statusData.isLoading ||
    indicatorsGlobal.isLoading ||
    indicatorsByAgent.isLoading ||
    indicatorsAgentDetail.isLoading ||
    ratingGlobal.isLoading ||
    ratingByAgent.isLoading ||
    waitingClientsGlobal.isLoading ||
    waitingClientsByAgent.isLoading ||
    assignmentResponseTimeGlobal.isLoading ||
    assignmentResponseTimeByAdmin.isLoading ||
    agentAverageResponseByAgent.isLoading ||
    recentConversationsQuery.isLoading;

  const fetching =
    statusData.isFetching ||
    indicatorsGlobal.isFetching ||
    indicatorsByAgent.isFetching ||
    indicatorsAgentDetail.isFetching ||
    ratingGlobal.isFetching ||
    ratingByAgent.isFetching ||
    waitingClientsGlobal.isFetching ||
    waitingClientsByAgent.isFetching ||
    assignmentResponseTimeGlobal.isFetching ||
    assignmentResponseTimeByAdmin.isFetching ||
    agentAverageResponseByAgent.isFetching ||
    recentConversationsQuery.isFetching;

  const error =
    statusData.error ||
    indicatorsGlobal.error ||
    indicatorsByAgent.error ||
    indicatorsAgentDetail.error ||
    ratingGlobal.error ||
    ratingByAgent.error ||
    waitingClientsGlobal.error ||
    waitingClientsByAgent.error ||
    assignmentResponseTimeGlobal.error ||
    assignmentResponseTimeByAdmin.error ||
    agentAverageResponseByAgent.error ||
    recentConversationsQuery.error ||
    null;

  return {
    filters: effectiveFilters,
    setFilters,
    handleApply,
    clearFilters: handleClearFilters,
    isFilterOpen,
    setIsFilterOpen,

    criticalMinutes,
    setCriticalMinutes,

    selectedAgentId,
    setSelectedAgentId,
    activeAgentId,

    recentPage,
    setRecentPage,
    recentPageSize,
    setRecentPageSize,
    recentTotalCount: recentConversationsQuery.data?.meta?.totalCount ?? 0,

    statusData: statusData.data ?? [],

    indicatorsGlobal: indicatorsGlobal.data ?? null,
    indicatorsByAgent: indicatorsByAgent.data ?? [],
    indicatorsAgentDetail: indicatorsAgentDetail.data ?? null,

    ratingGlobal: ratingGlobal.data ?? null,
    ratingByAgent: ratingByAgent.data ?? [],

    waitingClientsGlobal: waitingClientsGlobal.data ?? [],
    waitingClientsByAgent: waitingClientsByAgent.data ?? [],

    assignmentResponseTimeGlobal: assignmentResponseTimeGlobal.data ?? null,
    assignmentResponseTimeByAdmin: assignmentResponseTimeByAdmin.data ?? [],

    agentAverageResponseByAgent: agentAverageResponseByAgent.data ?? [],

    recentConversations: recentConversationsQuery.data?.items ?? [],

    loading,
    fetching,
    error,
    refreshAll,

    queries: {
      statusData,
      indicatorsGlobal,
      indicatorsByAgent,
      indicatorsAgentDetail,
      ratingGlobal,
      ratingByAgent,
      waitingClientsGlobal,
      waitingClientsByAgent,
      assignmentResponseTimeGlobal,
      assignmentResponseTimeByAdmin,
      agentAverageResponseByAgent,
      recentConversations: recentConversationsQuery,
    },
  };
};

export default usePerformanceDashboard;