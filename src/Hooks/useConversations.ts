/* eslint-disable @typescript-eslint/no-explicit-any */
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
  const authRaw           = localStorage.getItem('auth') || '{}'
  const { accessToken }   = JSON.parse(authRaw) as { accessToken: string }
  const { role }          = jwtDecode<JwtPayload>(accessToken)
  const isAdmin           = role.toLowerCase() === 'admin'
  const [form, setForm]                 = useState<FormInterface>(initialRange())
  const [appliedRange, setAppliedRange] = useState<FormInterface>(initialRange())
  const [conversations, setConversations] = useState<ConversationDto[]>([])
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string>()
  const [page, setPage]                 = useState(1)
  const [pageSize, setPageSize]         = useState(10)
  const [pagination, setPagination]     = useState<PaginationInfo>({
    currentPage: 1,
    totalPages:  0,
    totalItems:  0,
    itemsPerPage:10
  })

  const toApiState = (f: Filter) => (f === 'all' ? undefined : f);

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

  const sortByActivity = useCallback(
    (list: ConversationDto[]) =>
      [...list].sort(
        (a, b) =>
          new Date(b.lastActivity || b.createdAt).getTime() -
          new Date(a.lastActivity || a.createdAt).getTime()
      ),
    []
  )

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
  const ok = matchesFilter(updated)
  setConversations(prev => {
    const exists = prev.some(c => c.conversationId === updated.conversationId)
    const next = exists
      ? (ok
          ? prev.map(c => c.conversationId === updated.conversationId ? { ...prev.find(x => x.conversationId === updated.conversationId)!, ...updated } : c)
          : prev.filter(c => c.conversationId !== updated.conversationId))
      : (ok ? [updated, ...prev] : prev)
    return sortByActivity(next)
  })
}, [matchesFilter, sortByActivity])


  const handleNewMessage = useCallback((payload: { message: MessageDto; attachments: AttachmentDto[] }) => {
  const msg = payload.message
  setConversations(prev =>
    sortByActivity(
      prev.map(c =>
        c.conversationId === msg.conversationId
          ? {
              ...c,
              totalMessages: (c.totalMessages || 0) + 1,
              lastActivity:  msg.sentAt,
              unreadCount:   (c.unreadCount  || 0) + 1
            }
          : c
      )
    )
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

  const handleDate = useCallback((field: keyof FormInterface, d: Date | null) =>
    setForm(f => ({ ...f, [field]: d })), [])

const applyDateFilter = () => {
  if (!form.validFrom && !form.validTo) return

  if (form.validFrom) localStorage.setItem('convFrom', form.validFrom.toISOString())
  if (form.validTo)   localStorage.setItem('convTo', form.validTo.toISOString())

  setAppliedRange({
    validFrom: form.validFrom ? new Date(form.validFrom) : null,
    validTo:   form.validTo   ? new Date(form.validTo)   : null,
  })

  setPage(1)
}

  const clearFilter = () => {
    localStorage.removeItem('convFrom')
    localStorage.removeItem('convTo')
    setForm({ validFrom: null, validTo: null })

    setAppliedRange({ validFrom: null, validTo: null })
    setPage(1)
  }

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
          const base   = page === 1 ? [] : prev;                // si es la primera página, resetea
          const merged = [...base, ...items];                   // concatena
          const unique = merged.filter(
            (c, i, arr) => arr.findIndex(x => x.conversationId === c.conversationId) === i
          );
          return unique;
        });

        items.forEach(c => joinConversation(c.conversationId));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));

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
  }, [isAdmin, onConversationCreated, offConversationCreated, onConversationUpdated, offConversationUpdated, onNewMessage, offNewMessage, onNewHumanRequest, offNewHumanRequest, handleNewConvo, handleUpdatedConvo, handleNewMessage, handleHumanRequest])

 useEffect(() => {
    setConversations([]);
    setPage(1);
  }, [filter, searchConversation]);

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