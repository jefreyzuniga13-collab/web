/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, 
  useState } from 'react'
import { ConversationService, exportChatPdfByContact } from '@/Services/chat/ConversationService'
import type { ConversationDto } from '@/Interfaces/Chat/ChatInterfaces'
import { useNavigate } from 'react-router-dom'
import type { exportPDFArgs, GetConvArgs } from '@/Interfaces/Chat/ConversationInterface'

interface UseConversationsOptions {
  initialState?: string
  initialPage?: number
  initialPageSize?: number
}

interface GetByContactsArgs {
  contactsId: number[]
  from?: Date | string | null
  to?: Date | string | null
  q?: string
  page?: number
  pageSize?: number
}

interface GetByClientPaginationArgs {
  clientCode: string
  from?: string | null
  to?: string | null
  searchConversation?: string | null
  page?: number
  pageSize?: number
}

export default function useConversations({
  initialState = '',
  initialPage = 1,
  initialPageSize = 5,
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
  const navigate = useNavigate()

  const exportConversationHistoryToPDFAsync = useCallback(
    async (params: exportPDFArgs) => {
      setLoading(true)
      try {
        await exportChatPdfByContact(params)
      } catch (err: any) {
        setError(err)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const getConversationsByContacts = useCallback(
    async ({
      contactsId,
      from,
      to,
      q = '',
      page: pg = page,
      pageSize: ps = pageSize,
    }: GetByContactsArgs) => {
      try {
        setLoading(true)
        setError(null)

        const uniq = Array.from(
          new Set((contactsId ?? []).filter(n => Number.isFinite(n) && n > 0))
        )
        if (uniq.length === 0) {
          setData([])
          setTotalCount(0)
          setPage(pg)
          setPageSize(ps)
          return
        }

        const toDate = (v?: string | Date | null) =>
          typeof v === 'string' && v ? new Date(`${v}T00:00:00`) : (v as Date | undefined)

        const res = await ConversationService.getByContacts(
          uniq,
          pg,
          ps,
          toDate(from),
          toDate(to),
          q?.trim() || undefined
        )

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
    [page, pageSize]
  )

  const GetConversaionContact = useCallback(
    async ({
      from,
      to,
      contactId = 0,
      q = '',
      page: pg = page,
      pageSize: ps = pageSize,
    }: GetConvArgs) => {
      try {
        setLoading(true)

        const toDate = (v?: string | Date | null) =>
          typeof v === 'string' && v ? new Date(`${v}T00:00:00`) : (v as Date | undefined)

        const res = await ConversationService.getConversationsByContact(
          toDate(from),
          toDate(to),
          contactId,
          q || undefined,
          pg,
          ps
        )

        setData(res.items)
        setPage(pg)
        setPageSize(ps)
        setTotalCount(res.meta.totalCount)
      } catch (err: any) {
        setError(err)
      } finally {
        setLoading(false)
      }
    },
    [page, pageSize]
  )

  const GetConversationByClientPaginationAsync = useCallback(
    async ({
      clientCode,
      from,
      to,
      searchConversation = '',
      page: pg = page,
      pageSize: ps = pageSize,
    }: GetByClientPaginationArgs) => {
      try {
        setLoading(true)
        setError(null)

        const res = await ConversationService.GetConversationByClientPaginationAsync(
          {
            clientCode,
            from: from || undefined,
            to: to || undefined,
            searchConversation: searchConversation || undefined,
          },
          pg,
          ps
        )

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
    [page, pageSize]
  )

  const fetchPage = useCallback(
    async (st = stateFilter, pg = page, ps = pageSize) => {
      setLoading(true)
      setError(null)
      try {
        const res = await ConversationService.getByStateWithOut(st, pg, ps)
        setTotalCount(res.meta.totalCount)
        setData(res.items)
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

    const getByRating = useCallback(
    async (rating: number, selectedAgentId?: number, pg = page, ps = pageSize) => {
      setLoading(true)
      setError(null)
      try {
        const res = await ConversationService
        .getByRatingAsync(rating, pg, ps, selectedAgentId)
        setTotalCount(res.meta.totalCount)
        setData(res.items)
        setPage(pg)
        setPageSize(ps)
      } catch (err: any) {
        setError(err)
      } finally {
        setLoading(false)
      }
    },
    [page, pageSize]
  )

  // useEffect(() => {
  //   fetchPage()
  // }, [fetchPage])

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

  const navigationBack = async () => {
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
    // setPage: (pg: number) => fetchPage(stateFilter, pg, pageSize),
    // setPageSize: (ps: number) => fetchPage(stateFilter, 1, ps),
    setPage,
    setPageSize,
    changeState,
    // refresh: () => fetchPage(),
    openView,
    closeModal,
    navigationBack,
    exportConversationHistoryToPDFAsync,
    GetConversaionContact,
    getConversationsByContacts,
    GetConversationByClientPaginationAsync,
    fetchPage,
    getByRating
  }
}