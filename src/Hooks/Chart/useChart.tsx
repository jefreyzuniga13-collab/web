import { useCallback, useEffect, useState } from "react"
import { ConversationService } from "@/Services/ConversationService"
import type {
  ConversationStatusCountResponseDto,
  AverageAssignmentTimeResponseDto,
  AdminAsigmentResponseTimeResponseDto,
  FilterForm
} from "@/Interfaces/Dashboard/DashboardInterfaces"
import { formatoNicaragua } from "@/Utils/LocalDateFormat"

const getInitialDateFilter = (): FilterForm => ({
  from: formatoNicaragua(new Date()),
  to: formatoNicaragua(new Date()),
  startTime: null,
  endTime: null,
  agentId: "",
  adminUser: "",
  customerId: "",
  today: false,
  yesterday: false,
  tomorrow: false,
})

export const useConversationChart = () => {
 
  const [statusData, setStatusData] = useState<ConversationStatusCountResponseDto[]>([])
  const [averageAssignmentTime, setAverageAssignmentTime] = useState<AverageAssignmentTimeResponseDto[]>([])
  const [adminAvgAssignmentTime, setAdminAvgAssignmentTime] = useState<AdminAsigmentResponseTimeResponseDto[]>([])
  const [dateFilter, setDateFilter] = useState<FilterForm>(getInitialDateFilter())
  const [isFiterOpen, setIsFiterOpen] = useState<boolean>(false)

  // Estados de carga y error
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Función para obtener datos en paralelo
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [statusRes, avgTimeRes, adminAvgRes] = await Promise.all([
        ConversationService.getByDateRange(dateFilter),
        ConversationService.getAverageAssignmentTime(dateFilter),
        ConversationService.getAverageAssigmentAdminTime(dateFilter)
      ])

      setStatusData(statusRes)
      setAverageAssignmentTime(avgTimeRes)
      setAdminAvgAssignmentTime(adminAvgRes)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar datos"
      setError(message)
    } finally {
      setLoading(false)
    }

  }, [dateFilter])

  // Efecto para cargar datos al cambiar el filtro
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Actualiza una de las fechas del filtro
  const updateDate = (field: keyof FilterForm, date: Date | null) => {
    if (!date) return
    setDateFilter(prev => ({
      ...prev,
      [field]: formatoNicaragua(date)
    }))
  }

  const handleApply = (form: FilterForm)=>{
      setDateFilter(form)
      setIsFiterOpen(false)
  }

  return {
    statusData,
    averageAssignmentTime,
    adminAvgAssignmentTime,
    dateFilter,
    loading,
    error,
    refresh: fetchData,
    updateDate,
    isFiterOpen,
    setIsFiterOpen,
    handleApply
  }
}
