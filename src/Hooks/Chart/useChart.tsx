/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import { formatoNicaragua } from "@/Utils/LocalDateFormat";
import { ConversationService } from "@/Services/ConversationService";
import { SystemParamService } from "@/Services/SystemParamService";
import type {
  ConversationStatusCountResponseDto,
  AverageAssignmentTimeResponseDto,
  AdminAsigmentResponseTimeResponseDto,
  WaitingClientResponseDto,
  ResponseAgentAverageResponseDto,
  FilterForm
} from "@/Interfaces/Dashboard/DashboardInterfaces";
// import { useNavigate } from 'react-router-dom'
import type { ConversationDto } from "@/Interfaces/Chat/ChatInterfaces";
import { toZonedTime, format } from "date-fns-tz";

const getInitialFilters = (): FilterForm => {
  const saved = localStorage.getItem("dashboardFilters");
  if (saved) return JSON.parse(saved) as FilterForm;
    const zone        = "America/Managua";
   const nowInManagua = toZonedTime(new Date(), zone);
  const fmt          = format(nowInManagua, "yyyy-MM-dd", { timeZone: zone });

  return {
    from: fmt,
    to: fmt,
    startTime: null,
    endTime: null,
    agentId: null,
    adminUserId: null,
    companiesId: null,
    customerId: null,
    today: false,
    yesterday: false,
    tomorrow: false
  };
};

const getInitialThreshold = (defaultMinutes: number): number => {
  const saved = localStorage.getItem("criticalThreshold");
  if (saved) {
    const v = parseInt(saved, 10);
    if (!isNaN(v)) return v;
  }
  return defaultMinutes;
};

export const useConversationChart = () => {
  const [filters, setFilters] = useState<FilterForm>(getInitialFilters);
  const [statusData, setStatusData] = useState<ConversationStatusCountResponseDto[]>([]);
  const [averageAssignmentTime, setAverageAssignmentTime] = useState<AverageAssignmentTimeResponseDto[]>([]);
  const [adminAvgAssignmentTime, setAdminAvgAssignmentTime] = useState<AdminAsigmentResponseTimeResponseDto[]>([]);
  const [waitingClient, setWaitingClient] = useState<WaitingClientResponseDto[]>([]);
  const [responseAgentAverage, setResponseAgentAverage] = useState<ResponseAgentAverageResponseDto | null>();
  const [conversationClient, setConversationClient] = useState<ConversationDto[]>();
  const [criticialClientTime, setCriticialClientTime] = useState<string>("");
  const [threshold, setThreshold] = useState<number>(() => getInitialThreshold(60));
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);
  const [totalCount, setTotalCount] = useState<number>(0);
const [loadingWaiting, setLoadingWaiting] = useState(false);
  const [waitingPage, setWaitingPage] = useState(1);
  const [waitingPageSize, setWaitingPageSize] = useState(5);
  const [totalCountWaiting, setTotalCountWaiting] = useState<number>(0);

  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [loadingCharts, setLoadingCharts] = useState<boolean>(false);
  const [loadingList, setLoadingList] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  //  const navigate = useNavigate();
   const [refresh, setRefresh] = useState<boolean>(false)

  useEffect(() => {
    localStorage.setItem("dashboardFilters", JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    (async () => {
      const res = await SystemParamService.getByNameAsync("ClientCriticalStateTime");
      setCriticialClientTime(res.value);
      const def = parseInt(res.value, 10);
      if (!isNaN(def) && localStorage.getItem("criticalThreshold") === null) {
        setThreshold(def);
      }
    })();
  }, [filters]);

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
        ConversationService.getAverageAssigmentAdminTime(filters)
      ]);
      setStatusData(statusRes);
      setAverageAssignmentTime(avgRes);
      setAdminAvgAssignmentTime(adminRes);
      if (filters.agentId != null && filters.agentId >= 0) {
        const resp = await ConversationService.responseAgentAverageAsync(filters);
        setResponseAgentAverage(resp);
      }else{
        setResponseAgentAverage(null)
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingCharts(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchWaiting = useCallback(async (pg = waitingPage, ps = waitingPageSize) => {
    try {
      setLoadingWaiting(true)
      const list = await ConversationService.getWaitingClient(filters, pg, ps, threshold);
      setWaitingClient(list.items);
      setTotalCountWaiting(list.meta.totalCount);
      setWaitingPage(pg);
      setWaitingPageSize(ps);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : String(err));
    }
    finally{
      setLoadingWaiting(false)
    }
  }, [filters, threshold, waitingPage, waitingPageSize]);

  useEffect(() => {
    fetchWaiting();
  }, [fetchWaiting]);

  const fetchConversationByClientPage = useCallback(
    async (st = filters, pg = page, ps = pageSize) => {
      setLoadingList(true);
      setError(null);
      const normalized = {
        ...st,
        from: typeof st.from === "string" ? st.from : formatoNicaragua(st.from as Date),
        to: typeof st.to === "string" ? st.to : formatoNicaragua(st.to as Date)
      };
      try {
        const res = await ConversationService.getConversationByClient(normalized, pg, ps);
        setConversationClient(res.items);
        setTotalCount(res.meta.totalCount);
        setPage(pg);
        setPageSize(ps);
      } catch (err: any) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoadingList(false);
      }
    },
    [filters, page, pageSize]
  );

  useEffect(() => {
    fetchConversationByClientPage();
  }, [fetchConversationByClientPage]);

  const updateDate = (field: keyof FilterForm, date: Date | null) => {
    if (!date) return;
    setFilters(prev => ({ ...prev, [field]: formatoNicaragua(date) }));
  };

  const handleApply = (form: FilterForm) => {
    setFilters(form);
    setIsFilterOpen(false);
  };

  const handleRefresh = async()=>{
    // navigate(0) //Recargar la pagina
        // Cambiar el estado para forzar la re-renderización
    setRefresh(prevRefresh => !prevRefresh);
  }

   useEffect(() => {
    localStorage.removeItem("dashboardFilters");
    localStorage.removeItem("criticalThreshold");
    setFilters(getInitialFilters)
  }, [refresh]);


  return {
    statusData,
    averageAssignmentTime,
    adminAvgAssignmentTime,
    waitingClient,
    responseAgentAverage,
    conversationClient,
    criticialClientTime,
    threshold,
    setThreshold,
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
    setPageSize,
    totalCount,
    isFilterOpen,
    setIsFilterOpen,
    loadingCharts,
    loadingList,
    error,
    updateDate,
    handleApply,
    fetchConversationByClientPage,
    handleRefresh
  };
};