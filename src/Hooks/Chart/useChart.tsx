/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import { formatoNicaragua } from "@/Utils/LocalDateFormat";
import { ConversationService } from "@/Services/chat/ConversationService";
import { SystemParamService } from "@/Services/Crm/SystemParamService";
import type {
  ConversationStatusCountResponseDto,
  AverageAssignmentTimeResponseDto,
  AdminAsigmentResponseTimeResponseDto,
  WaitingClientResponseDto,
  ResponseAgentAverageResponseDto,
  FilterForm,
  ConversationRatingByAgents,
} from "@/Interfaces/Dashboard/DashboardInterfaces";
import type { ConversationDto } from "@/Interfaces/Chat/ChatInterfaces";

const getInitialFilters = (): FilterForm => {
  const saved = localStorage.getItem("dashboardFilters");
  if (saved) return JSON.parse(saved) as FilterForm;

  const fmt = formatoNicaragua(new Date());

  return {
    from: fmt,
    to: fmt,
    startTime: null,
    endTime: null,
    agentId: null,
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

const getInitialThreshold = (defaultMinutes: number): number => {
  const saved = localStorage.getItem("criticalThreshold");
  return saved ? parseInt(saved, 10) : defaultMinutes;
};

export const useConversationChart = () => {
  const [filters, setFilters] = useState<FilterForm>(getInitialFilters);
  const [statusData, setStatusData] = useState<ConversationStatusCountResponseDto[]>([]);
  const [ratingConversationData, setRatingConversationData] = useState<ConversationRatingByAgents[]>([]);
  const [RatingConversation, setRatingConversation] = useState<ConversationDto[]>([]);
  const [averageAssignmentTime, setAverageAssignmentTime] = useState<AverageAssignmentTimeResponseDto[]>([]);
  const [adminAvgAssignmentTime, setAdminAvgAssignmentTime] = useState<AdminAsigmentResponseTimeResponseDto[]>([]);
  const [waitingClient, setWaitingClient] = useState<WaitingClientResponseDto[]>([]);
  const [responseAgentAverage, setResponseAgentAverage] = useState<ResponseAgentAverageResponseDto | null>(null);
  const [conversationClient, setConversationClient] = useState<ConversationDto[]>([]);

  const [threshold, setThreshold] = useState<number>(() => getInitialThreshold(60));

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [waitingPage, setWaitingPage] = useState<number>(1);
  const [waitingPageSize, setWaitingPageSize] = useState<number>(10);
  const [totalCountWaiting, setTotalCountWaiting] = useState<number>(0);

  const [loadingRatingConversation, setLoadingRatingConversation] = useState<boolean>(false);
  const [ratingConversationPage, setRatingConversationPage] = useState<number>(1);
  const [filterRatingConversationByAgent, setFilterRatingConversationByAgent] = useState<number>();
  const [ratingConversationPageSize, setRatingConversationPageSize] = useState<number>(10);
  const [ratingConversationPageTotalCount, setRatingConversationPageTotalCount] = useState<number>(0);

  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(
    localStorage.getItem("selectedAgentId") ? parseInt(localStorage.getItem("selectedAgentId")!, 10) : null
  );
  
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [loadingCharts, setLoadingCharts] = useState<boolean>(false);
  const [loadingWaiting, setLoadingWaiting] = useState<boolean>(false);
  const [loadingList, setLoadingList] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem("dashboardFilters", JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    (async () => {
      const res = await SystemParamService.getByNameAsync("ClientCriticalStateTime");
      const def = parseInt(res.value, 10);
      if (localStorage.getItem("criticalThreshold") === null) {
        setThreshold(def);
      }
    })();
  }, []);

  useEffect(() => {
    localStorage.setItem("criticalThreshold", String(threshold));
  }, [threshold]);

  const fetchData = useCallback(async () => {
    setLoadingCharts(true);
    setError(null);

    try {
      const [statusRes, avgRes, adminRes] = await Promise.all([
        ConversationService.getByDateRange(filters),
        ConversationService.getAverageAssignmentTime(filters),
        ConversationService.getAverageAssigmentAdminTime(filters),
      ]);

      setStatusData(statusRes);
      setAverageAssignmentTime(avgRes);
      setAdminAvgAssignmentTime(adminRes);

      if (filters.agentId != null) {
        const resp = await ConversationService.responseAgentAverageAsync(filters);
        setResponseAgentAverage(resp);
        await fetchRatingConversation(filters.agentId);
      } else {
        setResponseAgentAverage(null);
      }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoadingCharts(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchRatingConversation = useCallback(
    async (
      agentId: number | null = selectedAgentId,
      pg = ratingConversationPage,
      ps = ratingConversationPageSize
    ) => {
      setLoadingRatingConversation(true);
      setError(null);

      try {
        const effectiveAgentId = agentId ?? selectedAgentId ?? null;
        localStorage.setItem("selectedAgentId", effectiveAgentId ? effectiveAgentId.toString() : "");

        const result = await ConversationService.getConversationRatingByAgents(
          filters,
          effectiveAgentId ?? undefined
        );

        const list = await ConversationService.getRatingConversation(
          pg,
          ps,
          filters,
          effectiveAgentId ?? undefined
        );

        setRatingConversationData(result);
        setRatingConversation(list.items);
        setRatingConversationPageTotalCount(list.meta.totalCount);
        setRatingConversationPage(pg);
        setRatingConversationPageSize(ps);
      } catch (err: any) {
        setError(err.message || String(err));
      } finally {
        setLoadingRatingConversation(false);
      }
    },
    [filters, selectedAgentId, ratingConversationPage, ratingConversationPageSize]
  );

  const fetchRatingByAgent = useCallback(
    async (agentId: number | null, pg: number = 1, ps: number = 5) => {
      await fetchRatingConversation(agentId, pg, ps);
    },
    [fetchRatingConversation]
  );

  const fetchWaiting = useCallback(
    async (pg = waitingPage, ps = waitingPageSize) => {
      setLoadingWaiting(true);
      setError(null);
      try {
        const list = await ConversationService.getWaitingClient(filters, pg, ps, threshold);
        setWaitingClient(list.items);
        setTotalCountWaiting(list.meta.totalCount);
        setWaitingPage(pg);
        setWaitingPageSize(ps);
      } catch (err: any) {
        setError(err.message || String(err));
      } finally {
        setLoadingWaiting(false);
      }
    },
    [filters, waitingPage, waitingPageSize, threshold]
  );

  const fetchConversationByClientPage = useCallback(
    async (pg = page, ps = pageSize) => {
      setLoadingList(true);
      setError(null);

      const normalized = {
        ...filters,
        from:
          typeof filters.from === "string"
            ? filters.from
            : formatoNicaragua(filters.from as Date),
        to:
          typeof filters.to === "string"
            ? filters.to
            : formatoNicaragua(filters.to as Date),
      };

      try {
        const res = await ConversationService.getConversationByClient(normalized as FilterForm, pg, ps);
        setConversationClient(res.items);
        setTotalCount(res.meta.totalCount);
        setPage(pg);
        setPageSize(ps);
      } catch (err: any) {
        setError(err.message || String(err));
      } finally {
        setLoadingList(false);
      }
    },
    [filters, page, pageSize]
  );

  useEffect(() => {
    fetchConversationByClientPage();
  }, [fetchConversationByClientPage, refresh]);

  useEffect(() => {
    fetchWaiting();
  }, [fetchWaiting]);

  const updateDate = (field: keyof FilterForm, date: Date | null) => {
    if (date) {
      setFilters((prev) => ({ ...prev, [field]: formatoNicaragua(date) }));
    }
  };

  const handleApply = (form: FilterForm) => {
  setFilters(form);
  setIsFilterOpen(false);

  setPage(1);
  setWaitingPage(1);
  setRatingConversationPage(1);

  const agentFromFilter = form.agentId ?? null;
  // if (agentFromFilter !== null) {
  //   setSelectedAgentId(agentFromFilter);
  // }

  fetchRatingConversation(agentFromFilter, 1, ratingConversationPageSize);
};


  const handleRefresh = () => {
    setRefresh((prev) => !prev);
    setPage(1);
    setWaitingPage(1);
    fetchData();
    fetchWaiting(1, waitingPageSize);
    fetchConversationByClientPage(1, pageSize);
    fetchRatingConversation(selectedAgentId, 1, ratingConversationPageSize);
  };

  return {
    statusData,
    averageAssignmentTime,
    adminAvgAssignmentTime,
    waitingClient,
    responseAgentAverage,
    conversationClient,
    threshold,
    setThreshold,
    filterRatingConversationByAgent,
    setFilterRatingConversationByAgent,
    filters,
    setFilters,
    page,
    setPage,
    pageSize,
    waitingPage,
    setWaitingPage,
    waitingPageSize,
    setWaitingPageSize,
    totalCountWaiting,
    loadingWaiting,
    totalCount,
    isFilterOpen,
    setIsFilterOpen,
    loadingCharts,
    loadingList,
    error,
    updateDate,
    handleApply,
    setPageSize,
    handleRefresh,
    ratingConversationData,
    RatingConversation,
    fetchRatingConversation,
    loadingRatingConversation,
    ratingConversationPage,
    ratingConversationPageSize,
    ratingConversationPageTotalCount,
    setRatingConversationPage,
    setRatingConversationPageSize,
    setRatingConversationPageTotalCount,
    selectedAgentId,
    setSelectedAgentId,
    fetchRatingByAgent,
    fetchWaiting,
  };
};
