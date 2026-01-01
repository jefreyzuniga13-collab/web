import { useState, useEffect, useCallback } from 'react'
import { jwtDecode } from 'jwt-decode'
import { useSignalR } from '@/Context/SignalRContext'
import type { ConversationDto, MessageDto, AttachmentDto } from '@/Interfaces/Chat/ChatInterfaces'
import type { PaginationInfo } from '@/Interfaces/Common/GlobalInterface'
import { joinConversation, leaveConversation } from '@/Services/signalr'
import { ConversationService } from '@/Services/chat/ConversationService'

export type Filter = 'all' | 'bot' | 'waiting' | 'human' | 'closed' | 'incomplete'

interface JwtPayload { role: string }

export interface FormInterface {
  validFrom: Date | null
  validTo:   Date | null
}

export interface UseConversationsResult {
  conversations:   ConversationDto[]
  loading:         boolean
  error?:          string
  form:            FormInterface
  handleDate:      (field: keyof FormInterface, d: Date | null) => void
  applyDateFilter: () => void
  clearFilter:     () => void
  page:            number
  pageSize:        number
  pagination:      PaginationInfo
  onPageChange:    (page: number) => void
  onPageSizeChange:(size: number) => void
}

const initialRange = (): FormInterface => {
  const f = localStorage.getItem('convFrom')
  const t = localStorage.getItem('convTo')
  return f && t
    ? { validFrom: new Date(f), validTo: new Date(t) }
    : { validFrom: null, validTo: null }
}

export function useConversations(filter: Filter = 'all', searchConversation: string): UseConversationsResult {
  const authRaw = localStorage.getItem('auth') || '{}'
  const { accessToken, userId } = JSON.parse(authRaw) as { accessToken: string,userId: number }
  const { role } = jwtDecode<JwtPayload>(accessToken)
  const isAdmin = role.toLowerCase() === 'admin'
  const [form, setForm] = useState<FormInterface>(initialRange())
  const [appliedRange, setAppliedRange] = useState<FormInterface>(initialRange())
  const [conversations, setConversations] = useState<ConversationDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages:  0,
    totalItems:  0,
    itemsPerPage:10
  })

  const toApiState = (f: Filter) => (f === 'all' ? undefined : f)

  const {
    onConversationCreated, offConversationCreated,
    onConversationUpdated, offConversationUpdated,
    onNewMessage,         offNewMessage,
    onNewHumanRequest,    offNewHumanRequest
  } = useSignalR()

  const matchesFilter = useCallback(
    (c: ConversationDto) => {
      switch (filter) {
        case 'waiting':    return c.status === 'Waiting'
        case 'bot':        return c.status === 'Bot'
        case 'human':      return c.status === 'Human'
        case 'closed':     return c.status === 'Closed'
        case 'incomplete': return c.status === 'Incomplete'
        default:           return true
      }
    },
    [filter]
  )

  const activityTs = (c: ConversationDto) =>
    new Date(c.lastActivity || c.updatedAt || c.createdAt).getTime()

  const sortByActivity = useCallback(
    (list: ConversationDto[]) => [...list].sort((a, b) => activityTs(b) - activityTs(a)),
    []
  )

  const dedupeByClientKeepNewest = (list: ConversationDto[]) => {
    const map = new Map<number, ConversationDto>()
    for (const c of list) {
      const key = c.clientContactId as unknown as number
      const prev = map.get(key)
      if (!prev || activityTs(c) > activityTs(prev)) map.set(key, c)
    }
    return Array.from(map.values()).sort((a, b) => activityTs(b) - activityTs(a))
  }

  const handleHumanRequest = useCallback((payload: { conversationId: number }) => {
    setConversations(prev =>
      sortByActivity(
        prev.map(c =>
          c.conversationId === payload.conversationId
            ? { ...c, status: 'Human' as ConversationDto['status'] }
            : c
        )
      )
    )
  }, [sortByActivity])


const handleUpdatedConvo = useCallback((updated: ConversationDto) => {
  setConversations(prev => {

    if (!isAdmin) {

      if (updated.assignedAgentId !== userId) {

        // Cambia de agente asignado -> quitarla, salir del grupo y avisar
        const removed = prev.filter(p => p.conversationId !== updated.conversationId)
        leaveConversation(updated.conversationId)
        window.dispatchEvent(new CustomEvent('ConversationLost', {
          detail: { conversationId: updated.conversationId }
        }))
        return removed
      }

      // Si es propia la asignación.
      joinConversation(updated.conversationId)
      const base   = prev.filter(p => p.conversationId !== updated.conversationId && p.clientContactId !== updated.clientContactId)
      const merged = matchesFilter(updated) ? [updated, ...base] : base
      return dedupeByClientKeepNewest(merged)
    }

    // Admin
    const baseAdmin   = prev.filter(p => p.conversationId !== updated.conversationId && p.clientContactId !== updated.clientContactId)
    const mergedAdmin = matchesFilter(updated) ? [updated, ...baseAdmin] : baseAdmin
    return dedupeByClientKeepNewest(mergedAdmin)
  })
}, [isAdmin, userId, matchesFilter])


  const handleNewMessage = useCallback((payload: { message: MessageDto; attachments: AttachmentDto[] }) => {
    const msg = payload.message
    setConversations(prev => {
      const updated = prev.map(c =>
        c.conversationId === msg.conversationId
          ? {
              ...c,
              totalMessages: (c.totalMessages || 0) + 1,
              lastActivity:  msg.sentAt,
              unreadCount:   (c.unreadCount  || 0) + 1
            }
          : c
      )
      return dedupeByClientKeepNewest(updated)
    })
  }, [])

  const handleNewConvo = useCallback((newConvo: ConversationDto) => {
    if (!matchesFilter(newConvo)) return
    joinConversation(newConvo.conversationId)
    setConversations(prev => {
      const base = prev.filter(p => p.clientContactId !== newConvo.clientContactId)
      return dedupeByClientKeepNewest([newConvo, ...base])
    })
  }, [matchesFilter])

  const handleDate = useCallback(
    (field: keyof FormInterface, d: Date | null) =>
      setForm(f => ({ ...f, [field]: d }))
  , [])

  const applyDateFilter = useCallback(() => {
    if (!form.validFrom && !form.validTo) return
    setAppliedRange({
      validFrom: form.validFrom ? new Date(form.validFrom) : null,
      validTo:   form.validTo   ? new Date(form.validTo)   : null,
    })
    setPage(1)
  }, [form])

  const clearFilter = useCallback(() => {
    setForm({ validFrom: null, validTo: null })
    setAppliedRange({ validFrom: null, validTo: null })
    setPage(1)
  }, [])

  useEffect(() => {
    setLoading(true)
    setError('')
    ConversationService.getConversationsByRole(
      appliedRange.validFrom ?? undefined,
      appliedRange.validTo   ?? undefined,
      searchConversation,
      page,
      pageSize,
      toApiState(filter)
    )
      .then(res => {
        const items = res.items.map(conv => ({
          ...conv,
          lastActivity: conv.lastActivity || conv.updatedAt || conv.createdAt,
          unreadCount:  conv.unreadCount  || 0
        }))
        setPagination({
          currentPage: res.meta.currentPage,
          totalPages:  res.meta.totalPages,
          totalItems:  res.meta.totalCount,
          itemsPerPage:res.meta.pageSize
        })
        setConversations(prev => {
          const base = page === 1 ? [] : prev
          const merged = [...base, ...items]
          return dedupeByClientKeepNewest(merged)
        })
        items.forEach(c => joinConversation(c.conversationId))
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [appliedRange.validFrom, appliedRange.validTo, filter, page, pageSize, searchConversation])

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
  }, [isAdmin, onConversationCreated, offConversationCreated, onConversationUpdated,
    offConversationUpdated, onNewMessage, offNewMessage, onNewHumanRequest, offNewHumanRequest,
    handleNewConvo, handleUpdatedConvo, handleNewMessage, handleHumanRequest])

  useEffect(() => {
    setConversations([])
    setPage(1)
  }, [filter, searchConversation])

  const onPageChange = useCallback((newPage: number) => { setPage(newPage) }, [])
  const onPageSizeChange = useCallback((newSize: number) => { setPageSize(newSize); setPage(1) }, [])

  return {
    conversations,
    loading,
    error,
    form,
    handleDate,
    applyDateFilter,
    clearFilter,
    page,
    pageSize,
    pagination,
    onPageChange,
    onPageSizeChange
  }
}