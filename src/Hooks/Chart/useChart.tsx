/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react"
import { ConversationService } from "@/Services/ConversationService"
import type { AverageAssignmentTimeResponseDto, ConversationStatusCountResponseDto } from "@/Interfaces/Dashboard/DashboardInterfaces"

export const useConversationChart = (from: Date, to: Date) => {
  const [data, setData] = useState<ConversationStatusCountResponseDto[] >([])
  const [AverageAssignmentTime, setAverageAssignmentTime] = useState<AverageAssignmentTimeResponseDto[] >([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await ConversationService.getByDateRange(from, to)
      const res2 = await ConversationService.getAverageAssignmentTime()
      setData(res)
      setAverageAssignmentTime(res2)
    } catch (err: any) {
      setError(err.message || "Error al cargar conversaciones")
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { data, AverageAssignmentTime, loading, error, refresh: fetch }
}