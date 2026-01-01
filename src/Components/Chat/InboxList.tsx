import React, { useEffect, useState, useRef } from "react"
import { MessageSquareOff } from "lucide-react"
import "@/Styles/Chat/InboxList.css"
import { format } from "date-fns"
import { markConversationRead } from "@/Services/chat/ConversationService"
import type { ConversationDto } from "@/Interfaces/Chat/ChatInterfaces"
import type { PaginationInfo } from "@/Interfaces/Common/GlobalInterface"
import CustomLoader from "@/Components/Common/CustomLoader"
import { selectCartBadgeByContactId } from "@/Context/Slices/Ecommerce/cartBadgeSlice"
import { useSelector } from "react-redux"
import { FaCartFlatbedSuitcase } from "react-icons/fa6"

interface Props {
  selectedId?: number
  onSelect: (id: number | null) => void
  conversations: ConversationDto[]
  loading: boolean
  error?: string
  page: number
  pagination: PaginationInfo
  onPageChange: (page: number) => void
}

const formatDuration = (ms: number): string => {
  const totalMinutes = Math.floor(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

export const InboxList: React.FC<Props> = ({
  selectedId,
  onSelect,
  conversations,
  loading,
  error,
  page,
  pagination,
  onPageChange
}) => {
  const loaderRef = useRef<HTMLLIElement>(null)

  const [now, setNow] = useState(Date.now())
  const { userId } = JSON.parse(localStorage.getItem("auth") || "{}") as {
    userId: number
  }

  const badgeMap = useSelector(selectCartBadgeByContactId)

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (
          entries[0].isIntersecting &&
          page < pagination.totalPages &&
          !loading
        ) {
          onPageChange(page + 1)
        }
      },
      { root: null, rootMargin: "0px", threshold: 1.0 }
    )
    if (loaderRef.current) observer.observe(loaderRef.current)

    return () => observer.disconnect()
  }, [loading, onPageChange, page, pagination.totalPages])

  const formatTime = (iso?: string) => {
    if (!iso) return ""
    try {
      return format(new Date(iso), "HH:mm")
    } catch {
      return ""
    }
  }

  const handleSelect = (id: number) => {
    if (id === selectedId) {
      onSelect(null)
    } else {
      onSelect(id)
      void markConversationRead(id)
    }
  }

  if (error) {
    return (
      <ul className="inbox-list">
        <li className="inbox-list__empty">{error}</li>
      </ul>
    )
  }

  if (conversations.length === 0 && !loading) {
    return (
      <ul className="inbox-list">
        <li className="inbox-list__empty">
          <MessageSquareOff size={48} />
          <span>No hay conversaciones disponibles</span>
        </li>
      </ul>
    )
  }

  return (
    <ul className="inbox-list">
      {conversations.map(c => {
        const isSelected = c.conversationId === selectedId
        const statusClass = c.status.toLowerCase()
        const statusTextMap: Record<string, string> = {
          bot: "Bot",
          waiting: "Pendiente",
          human: "Asignado",
          closed: "Cerrado",
          incomplete: "Incompleta",
          paused: "Pausada"
        }

        const statusText = statusTextMap[c.status.toLowerCase()] || c.status

        const unread =
          userId === c.assignedAgentId
            ? c.unreadForAgent ?? 0
            : userId === c.assignedByUserId
              ? c.unreadForAssigner ?? 0
              : 0

        const hasUnread = unread > 0

        let timeSinceRequest = ""
        if (!c.assignedAt && c.requestedAgentAt) {
          timeSinceRequest = formatDuration(
            now - new Date(c.requestedAgentAt).getTime()
          )
        }

        const clientLast = formatTime(c.clientLastMessageAt)
        let previewText = `Cliente últ. msj: ${clientLast}`
        if (!c.assignedAt && c.requestedAgentAt) {
          previewText += ` · Desde solicitud: ${timeSinceRequest}`
        }

        const contactId = c.clientContactId ?? 0
        const badge = contactId > 0 ? badgeMap?.[contactId] : undefined

        const hasCart =
          contactId > 0
            ? (badge?.hasCart ?? c.isItemsInCart)
            : c.isItemsInCart

        return (
          <li
            key={c.conversationId}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            onClick={() => handleSelect(c.conversationId)}
            onKeyDown={e => e.key === "Enter" && handleSelect(c.conversationId)}
            className={`inbox-list__item${isSelected ? " inbox-list__item--selected" : ""}`}
          >
            <div className="inbox-list__top">
              <div className="inbox-list__details">
                <div className="inbox-list__name-row">
                  <span className="inbox-list__name">
                    {hasCart && (
                      <span className="inbox-list__isItemsInCart">
                        <FaCartFlatbedSuitcase fontSize={16} />
                      </span>
                    )}
                    {c.systemDefinedCompanyName != null ? c.systemDefinedCompanyName : ""}
                    <span>
                      {c.clientContactId != null ? ` (${c.clientContactName})` : ""}
                    </span>
                  </span>
                </div>

                {c.assignedAgentName && (
                  <div className="inbox-list__agent">
                    Agente: <strong>{c.assignedAgentName}</strong>
                  </div>
                )}

                <span className="inbox-list__preview">{previewText}</span>
              </div>

              <div className="inbox-list__bottom">
                <div className="inbox-list__bottom_text">
                  <span className={`inbox-list__status inbox-list__status--${statusClass}`}>
                    {statusText}
                  </span>
                </div>

                {hasUnread && (
                  <span className="inbox-list__unread-badge">{unread}</span>
                )}
              </div>
            </div>
          </li>
        )
      })}

      {loading && <CustomLoader />}

      <li ref={loaderRef} />
    </ul>
  )
}