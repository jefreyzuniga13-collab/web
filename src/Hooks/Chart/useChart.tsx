/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useState } from "react"
import { ConversationService } from "@/Services/ConversationService"
import type {
  ConversationStatusCountResponseDto,
  AverageAssignmentTimeResponseDto,
  AdminAsigmentResponseTimeResponseDto,
  FilterForm,
  WaitingClientResponseDto,
  ResponseAgentAverageResponseDto
} from "@/Interfaces/Dashboard/DashboardInterfaces"
import { formatoNicaragua } from "@/Utils/LocalDateFormat"
import { SystemParamService } from "@/Services/SystemParamService"
import type { ConversationDto } from "@/Interfaces/Chat/ChatInterfaces"

const getInitialDateFilter = (): FilterForm => ({
  from: formatoNicaragua(new Date()),
  to: formatoNicaragua(new Date()),
  startTime: new Date(),
  endTime: new Date(),
  agentId:null,
  adminUserId: null,
  companiesId: 2,
  customerId: null,
  today: false,
  yesterday: false,
  tomorrow: false
})

export const useConversationChart = () => {
  const [statusData, setStatusData] = useState<ConversationStatusCountResponseDto[]>([])
  const [averageAssignmentTime, setAverageAssignmentTime] = useState<AverageAssignmentTimeResponseDto[]>([])
  const [adminAvgAssignmentTime, setAdminAvgAssignmentTime] = useState<AdminAsigmentResponseTimeResponseDto[]>([])
   const [waitingClient, setWaitingClient] = useState<WaitingClientResponseDto[]>([])
  const [responseAgentAverage, setResponseAgentAverage] = useState<ResponseAgentAverageResponseDto>()
  const [filters, setFilters] = useState<FilterForm>(getInitialDateFilter())
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [criticialClientTime, setCriticialClientTime] = useState<string>("")
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(5)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [conversationClient, setConversationClient] = useState<ConversationDto[]>()



  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {

      const [statusRes, avgTimeRes, adminAvgRes] = await Promise.all([
        ConversationService.getByDateRange(filters),
        ConversationService.getAverageAssignmentTime(filters),
        ConversationService.getAverageAssigmentAdminTime(filters),
      ])

      setStatusData(statusRes)
      setAverageAssignmentTime(avgTimeRes)
      setAdminAvgAssignmentTime(adminAvgRes)
      const waitingRes = await ConversationService.getWaitingClient(filters);
      setWaitingClient(waitingRes)

      fetchConversationByClientPage()
      if(filters.agentId != null 
        && filters.agentId! >= 0
      ) {

        const setResponseAgentAverageRes = await ConversationService.responseAgentAverageAsync(filters);
        setResponseAgentAverage(setResponseAgentAverageRes)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  const fetchConversationByClientPage = useCallback(
    async (st = filters, pg = page, ps = pageSize) => {

      // if(filters.customerId != null &&
      //   filters.customerId! >= 0){
          setLoading(true)
        setError(null)

        try {
          const res = await ConversationService.getConversationByClient(st, pg, ps)


          setConversationClient(res.items);
          setTotalCount(res.meta.totalCount)
          setPage(pg)
          setPageSize(ps)
        } catch (err: any) {
          setError(err)
        } finally {
          setLoading(false)
        }
          // }
    },
    [filters, page, pageSize]
  )

  useEffect(() => {
    fetchData()
    fetchConversationByClientPage();
  }, [filters])

  const updateDate = (field: keyof FilterForm, date: Date | null) => {
    if (!date) return
    setFilters(prev => ({ ...prev, [field]: formatoNicaragua(date) }))
  }

  const handleApply = (form: FilterForm) => {
    setFilters(form)
    setIsFilterOpen(false)
  }

  //Que se vuelva a guardar solo cuando los filtros cambian.
  const SaveLocalStorage = useCallback(async()=>{
    localStorage.setItem("dashboardFilters", JSON.stringify(filters))
  }, [filters])


  const fetchParams = async()=>{
    const response = await SystemParamService.getByNameAsync("ClientCriticalStateTime");
    setCriticialClientTime(response.value);

  }
  useEffect(() => {
      fetchParams();
  }, [])
  
  return {
    statusData,
    averageAssignmentTime,
    responseAgentAverage,
    adminAvgAssignmentTime,
    waitingClient,
    filters,
    setFilters,
    loading,
    error,
    refresh: fetchData,
    updateDate,
    isFilterOpen,
    setIsFilterOpen,
    handleApply,
    SaveLocalStorage,
    criticialClientTime,
    conversationClient,
    totalCount,
    pageSize,
    setPageSize,
    page,
    setPage,
    fetchConversationByClientPage
  }
}