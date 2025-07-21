import { useState, useEffect, useCallback } from 'react'
import { jwtDecode } from 'jwt-decode'
import { useSignalR } from '@/Context/SignalRContext'
import type { ConversationDto, MessageDto, AttachmentDto } from '@/Interfaces/Chat/ChatInterfaces'
import type { PaginationInfo } from '@/Interfaces/GlobalInterface'
import { joinConversation } from '@/Services/signalr'
import { ConversationService } from '@/Services/ConversationService'

export type Filter = 'all' | 'bot' | 'waiting' | 'human' | 'closed' | 'incomplete'

interface JwtPayload { role: string }

export interface FormInterface {
  validFrom: Date | null
  validTo: Date | null
}

export interface UseConversationsResult {
  conversations: ConversationDto[]
  loading: boolean
  error?: string
  form: FormInterface
  handleDate: (field: keyof FormInterface, d: Date | null) => void
  applyDateFilter: () => void
  page: number
  pageSize: number
  pagination: PaginationInfo
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function useConversations(filter: Filter = 'all'): UseConversationsResult {
  const authRaw = localStorage.getItem('auth') || '{}'
  const { accessToken } = JSON.parse(authRaw) as { accessToken: string }
  const { role } = jwtDecode<JwtPayload>(accessToken)
  const isAdmin = role.toLowerCase() === 'admin'

  const [form, setForm] = useState<FormInterface>(() => {
    const now = new Date()
    const f = localStorage.getItem('convFrom')
    const t = localStorage.getItem('convTo')
    return { validFrom: f ? new Date(f) : now, validTo: t ? new Date(t) : now }
  })

  const [range, setRange] = useState<FormInterface>(() => {
    const now = new Date()
    const f = localStorage.getItem('convFrom')
    const t = localStorage.getItem('convTo')
    return { validFrom: f ? new Date(f) : now, validTo: t ? new Date(t) : now }
  })

  const [conversations, setConversations] = useState<ConversationDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10
  })

  const {
    onConversationCreated,
    offConversationCreated,
    onConversationUpdated,
    offConversationUpdated,
    onNewMessage,
    offNewMessage,
    onNewHumanRequest,
    offNewHumanRequest
  } = useSignalR()

  const matchesFilter = useCallback((c: ConversationDto) => {
    if (!isAdmin && c.status === 'Bot') return false
    switch (filter) {
      case 'waiting': return c.status === 'Waiting'
      case 'bot': return c.status === 'Bot'
      case 'human': return c.status === 'Human'
      case 'closed': return c.status === 'Closed'
      case 'incomplete': return c.status === 'Incomplete'
      default: return true
    }
  }, [filter, isAdmin])

  const sortByActivity = useCallback((list: ConversationDto[]) =>
    [...list].sort((a, b) =>
      new Date(b.lastActivity || b.createdAt).getTime() -
      new Date(a.lastActivity || a.createdAt).getTime()
    )
  , [])

  const handleHumanRequest = useCallback((payload: { conversationId: number }) => {
    setConversations(prev =>
      prev.map(c =>
        c.conversationId === payload.conversationId
          ? { ...c, status: 'Human' }
          : c
      )
    )
  }, [])

  const handleUpdatedConvo = useCallback((updated: ConversationDto) => {
    setConversations(prev => {
      const exists = prev.some(c => c.conversationId === updated.conversationId)
      const ok = matchesFilter(updated)
      const next = exists
        ? ok
          ? prev.map(c => c.conversationId === updated.conversationId ? updated : c)
          : prev.filter(c => c.conversationId !== updated.conversationId)
        : ok
          ? [updated, ...prev]
          : prev
      return sortByActivity(next)
    })
  }, [matchesFilter, sortByActivity])

  const handleNewMessage = useCallback((payload: { message: MessageDto; attachments: AttachmentDto[] }) => {
    const msg = payload.message
    setConversations(prev =>
      sortByActivity(prev.map(c =>
        c.conversationId === msg.conversationId
          ? {
              ...c,
              totalMessages: (c.totalMessages || 0) + 1,
              lastActivity: msg.sentAt,
              unreadCount: (c.unreadCount || 0) + 1
            }
          : c
      ))
    )
  }, [sortByActivity])

  const handleNewConvo = useCallback((newConvo: ConversationDto) => {
    if (!matchesFilter(newConvo)) return
    joinConversation(newConvo.conversationId)
    setConversations(prev =>
      prev.some(c => c.conversationId === newConvo.conversationId)
        ? prev
        : sortByActivity([newConvo, ...prev])
    )
  }, [matchesFilter, sortByActivity])

  const handleDate = useCallback((field: keyof FormInterface, d: Date | null) => {
    setForm(f => ({ ...f, [field]: d }))
  }, [])

const applyDateFilter = useCallback(() => {
  if (!form.validFrom || !form.validTo) return;

  const newRange = {
    validFrom: form.validFrom,
    validTo:   form.validTo
  };
  // persisto en localStorage…
  localStorage.setItem('convFrom', form.validFrom.toISOString());
  localStorage.setItem('convTo',   form.validTo.toISOString());
  // actualizo el estado
  setRange(newRange);
  // muestro directamente los valores que acabo de calcular
  console.log("Form from", form.validFrom);
  console.log("Form to",   form.validTo);
  console.log("NewRange from", newRange.validFrom);
  console.log("NewRange to",   newRange.validTo);
    console.log("Range normal from", range.validFrom);
  console.log("Range normal to",   range.validTo);
}, [form.validFrom, form.validTo]);

  useEffect(() => {
    setPage(1)
    setConversations([])
  }, [filter, range])

  useEffect(() => {
    setLoading(true)
    setError(undefined)
    ConversationService
      .getConversationsByRole(range.validFrom!, range.validTo!, page, pageSize)
      .then(res => {
        const items = res.items.map(conv => ({
          ...conv,
          lastActivity: conv.lastActivity || conv.updatedAt || conv.createdAt,
          unreadCount: conv.unreadCount || 0
        }))
        const filtered = items.filter(matchesFilter)
        setPagination({
          currentPage: res.meta.currentPage,
          totalPages: res.meta.totalPages,
          totalItems: res.meta.totalCount,
          itemsPerPage: res.meta.pageSize
        })
        setConversations(prev => page === 1 ? filtered : [...prev, ...filtered])
        filtered.forEach(c => joinConversation(c.conversationId))
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [filter, range, page, pageSize, matchesFilter])

  useEffect(() => {
    if (isAdmin) onConversationCreated(handleNewConvo)
    onConversationUpdated(handleUpdatedConvo)
    onNewMessage(handleNewMessage)
    onNewHumanRequest(handleHumanRequest)
    return () => {
      if (isAdmin) offConversationCreated(handleNewConvo)
      offConversationUpdated(handleUpdatedConvo)
      offNewMessage(handleNewMessage)
      offNewHumanRequest(handleHumanRequest)
    }
  }, [
    isAdmin,
    onConversationCreated, offConversationCreated,
    onConversationUpdated, offConversationUpdated,
    onNewMessage, offNewMessage,
    onNewHumanRequest, offNewHumanRequest,
    handleNewConvo, handleUpdatedConvo,
    handleNewMessage, handleHumanRequest
  ])

  const onPageChange = useCallback((newPage: number) => setPage(newPage), [])

  const onPageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize)
    setPage(1)
  }, [])

  return {
    conversations,
    loading,
    error,
    form,
    handleDate,
    applyDateFilter,
    page,
    pageSize,
    pagination,
    onPageChange,
    onPageSizeChange
  }
}