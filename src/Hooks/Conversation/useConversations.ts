/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from 'react'
import { ConversationService } from '@/Services/ConversationService'
import type { ConversationDto } from '@/Interfaces/Chat/ChatInterfaces'
import { useNavigate } from 'react-router-dom'

interface UseConversationsOptions {
  initialState?: string
  initialPage?: number
  initialPageSize?: number
}

export default function useConversations({
  initialState = '',
  initialPage = 1,
  initialPageSize = 10,
}: UseConversationsOptions = {}) {
  const [data, setData] = useState<ConversationDto[]>([])
  const [stateFilter, setStateFilter] = useState<string>(initialState)
  const [page, setPage] = useState<number>(initialPage)
  const [pageSize, setPageSize] = useState<number>(initialPageSize)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [selectedConversation, setSelectedConversation] = useState<ConversationDto | null>(null)
   const navigate = useNavigate();

  const fetchPage = useCallback(
    async (st = stateFilter, pg = page, ps = pageSize) => {
      setLoading(true)
      setError(null)
      try {
        const res = await ConversationService.getByState(st, pg, ps)
          
        console.log("Valores obtrenidos son: ", JSON.stringify(res.items))

        setData(res.items)
        setTotalCount(res.meta.totalCount)
        setPage(pg)
        setPageSize(ps)
      } catch (err: any) {
        setError(err)
      } finally {
        setLoading(false)
      }
    },
    [stateFilter, page, pageSize]
  )

  useEffect(() => {
    fetchPage()
  }, [fetchPage])

  const changeState = useCallback((newState: string) => {
    setStateFilter(newState)
    setPage(1)
  }, [])

  const openView = useCallback((conversation: ConversationDto) => {
    setSelectedConversation(conversation)
    setIsModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedConversation(null)
  }, [])

  const navigationBack = async()=>{
    navigate(-1)
  }
  return {
    data,
    page,
    pageSize,
    totalCount,
    loading,
    error,
    stateFilter,
    isModalOpen,
    selectedConversation,
    setPage: (pg: number) => fetchPage(stateFilter, pg, pageSize),
    setPageSize: (ps: number) => fetchPage(stateFilter, 1, ps),
    changeState,
    refresh: () => fetchPage(),
    openView,
    closeModal,
    navigationBack
  }
}