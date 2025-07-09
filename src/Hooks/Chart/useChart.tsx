/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react"
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
const getInitialDateFilter = (): FilterForm => ({
  from: formatoNicaragua(new Date()),
  to: formatoNicaragua(new Date()),
  startTime: new Date(),
  endTime: new Date(),
  agentId:null,
  adminUserId: null,
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

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log("Filtros dentro del fetchData antes:", filters);

      const [statusRes, avgTimeRes, adminAvgRes] = await Promise.all([
        ConversationService.getByDateRange(filters),
        ConversationService.getAverageAssignmentTime(filters),
        ConversationService.getAverageAssigmentAdminTime(filters),
      ])

      setStatusData(statusRes)
      setAverageAssignmentTime(avgTimeRes)
      setAdminAvgAssignmentTime(adminAvgRes)

      if(filters.customerId != null 
        && filters.customerId! >= 0
      ) {
        const waitingRes = await ConversationService.getWaitingClient(filters);
        const setResponseAgentAverageRes = await ConversationService.responseAgentAverageAsync(filters);
        setWaitingClient(waitingRes)
        setResponseAgentAverage(setResponseAgentAverageRes)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filters])

  const updateDate = (field: keyof FilterForm, date: Date | null) => {
    if (!date) return
    setFilters(prev => ({ ...prev, [field]: formatoNicaragua(date) }))
  }

  const handleApply = (form: FilterForm) => {
    setFilters(form)
    setIsFilterOpen(false)
  }

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
    handleApply
  }
}