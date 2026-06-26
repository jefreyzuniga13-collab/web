import React, { useEffect, useMemo, useRef, useState } from "react"
import { MessageSquareOff, MoreVertical } from "lucide-react"
import "@/Styles/Chat/InboxList.css"
import { toast } from "react-toastify"
import { markConversationRead } from "@/Services/chat/ConversationService"
import type { ConversationDto } from "@/Interfaces/Chat/ChatInterfaces"
import type { PaginationInfo } from "@/Interfaces/Common/GlobalInterface"
import CustomLoader from "@/Components/Common/CustomLoader"
import { selectCartBadgeByContactId } from "@/Context/Slices/Ecommerce/cartBadgeSlice"
import { useSelector } from "react-redux"
import { FaCartFlatbedSuitcase } from "react-icons/fa6"
import { selectUserId } from "@/Context/Slices/Auth/authSlice"
import { useContactBlock } from "@/Hooks/Wh/useContactBlock"
import { formatDuration, formatTimeNI, getChannel, getConversationDateValue, getConversationGroupKey, getConversationGroupLabel, getConversationIdentifier, getElapsedMsFromNI, parseConversationDate } from "@/Utils/ECommerce/formatters"
import { getChannelIcon } from "@/Utils/Chat/Utils"

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

type MenuState = {
  conversationId: number
} | null

type ConversationGroup = {
  key: string
  label: string
  conversations: ConversationDto[]
}

export const InboxList: React.FC<Props> = ({
  selectedId,
  onSelect,
  conversations,
  loading,
  error,
  page,
  pagination,
  onPageChange,
}) => {
  const listRef = useRef<HTMLUListElement>(null)
  const loaderRef = useRef<HTMLLIElement>(null)
  const pressTimerRef = useRef<number | null>(null)

  const { blockContact, unblockContact, isBlocking, isUnblocking } =
    useContactBlock()

  const [menuState, setMenuState] = useState<MenuState>(null)

  const userId = useSelector(selectUserId)
  const badgeMap = useSelector(selectCartBadgeByContactId)

  const actionLoading = isBlocking || isUnblocking

  const groupedConversations = useMemo<ConversationGroup[]>(() => {
    const groups = new Map<string, ConversationGroup>()

    conversations.forEach(conversation => {
      const rawDate = getConversationDateValue(conversation)
      const date = parseConversationDate(rawDate)

      const key = date ? getConversationGroupKey(date) : "sin-fecha"
      const label = date ? getConversationGroupLabel(date) : "Sin fecha"

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          label,
          conversations: [],
        })
      }

      groups.get(key)?.conversations.push(conversation)
    })

    return Array.from(groups.values())
  }, [conversations])

  useEffect(() => {
    const root = listRef.current
    const loader = loaderRef.current

    if (!root || !loader) return

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0]

        if (entry.isIntersecting && page < pagination.totalPages && !loading) {
          onPageChange(page + 1)
        }
      },
      {
        root,
        rootMargin: "120px",
        threshold: 0.1,
      }
    )

    observer.observe(loader)

    return () => observer.disconnect()
  }, [loading, onPageChange, page, pagination.totalPages])

  useEffect(() => {
    const closeMenu = () => setMenuState(null)

    window.addEventListener("click", closeMenu)
    window.addEventListener("scroll", closeMenu, true)

    return () => {
      window.removeEventListener("click", closeMenu)
      window.removeEventListener("scroll", closeMenu, true)
    }
  }, [])

  const clearPressTimer = () => {
    if (pressTimerRef.current) {
      window.clearTimeout(pressTimerRef.current)
      pressTimerRef.current = null
    }
  }

  const openMenu = (conversationId: number) => {
    setMenuState(prev =>
      prev?.conversationId === conversationId ? null : { conversationId }
    )
  }

  const handlePointerDown = (conversationId: number) => {
    clearPressTimer()

    pressTimerRef.current = window.setTimeout(() => {
      openMenu(conversationId)
    }, 550)
  }

  const handlePointerEnd = () => {
    clearPressTimer()
  }

  const handleSelect = (id: number) => {
    if (menuState?.conversationId === id) return

    if (id === selectedId) {
      onSelect(null)
      return
    }

    onSelect(id)
    void markConversationRead(id)
  }

  const handleContextMenu = (
    event: React.MouseEvent<HTMLLIElement>,
    conversationId: number
  ) => {
    event.preventDefault()
    event.stopPropagation()
    openMenu(conversationId)
  }

  const executeBlockAction = async (
    event: React.MouseEvent<HTMLButtonElement>,
    conversation: ConversationDto,
    action: "block" | "unblock"
  ) => {
    event.preventDefault()
    event.stopPropagation()

    const channel = getChannel(conversation.metaChannelId)
    const identifier = await getConversationIdentifier(conversation)

    if (!channel) {
      toast.warning("Canal no soportado.")
      return
    }

    if (!identifier) {
      toast.warning("No se encontró un identificador válido del contacto.")
      return
    }

    try {
      if (action === "block") {
        await blockContact({ channel, identifier })
        toast.success("Contacto bloqueado correctamente.")
      }

      if (action === "unblock") {
        await unblockContact({ channel, identifier })
        toast.success("Contacto desbloqueado correctamente.")
      }

      setMenuState(null)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo completar la acción."

      toast.error(message)
    }
  }

  if (error) {
    return (
      <ul ref={listRef} className="inbox-list">
        <li className="inbox-list__empty">{error}</li>
      </ul>
    )
  }

  if (conversations.length === 0 && !loading) {
    return (
      <ul ref={listRef} className="inbox-list">
        <li className="inbox-list__empty">
          <MessageSquareOff size={48} />
          <span>No hay conversaciones disponibles</span>
        </li>
      </ul>
    )
  }

  return (
    <ul ref={listRef} className="inbox-list">
      {groupedConversations.map(group => (
        <React.Fragment key={group.key}>
          {group.label !== "Hoy" && (
            <li className="inbox-list__date-group">
              <span>{group.label}</span>
            </li>
          )}

          {group.conversations.map(conversation => {
            const isSelected = conversation.conversationId === selectedId
            const isMenuOpen =
              menuState?.conversationId === conversation.conversationId

            const statusClass = conversation.status?.toLowerCase() ?? ""
            const normalizedStatus = conversation.status?.toLowerCase() ?? ""

            const statusTextMap: Record<string, string> = {
              new: "Nueva",
              bot: "Bot",
              waiting: "Pendiente",
              human: "Asignado",
              closed: "Cerrado",
              incomplete: "Incompleta",
              paused: "Pausada",
            }

            const statusText =
              statusTextMap[normalizedStatus] ??
              conversation.status ??
              "Pendiente"

            const unread =
              userId === conversation.assignedAgentId
                ? conversation.unreadForAgent ?? 0
                : userId === conversation.assignedByUserId
                  ? conversation.unreadForAssigner ?? 0
                  : 0

            const hasUnread = unread > 0

            const clientLast = formatTimeNI(conversation.clientLastMessageAt)

            let previewText = clientLast
              ? `Cliente últ. msj: ${clientLast}`
              : "Cliente últ. msj:"

            if (!conversation.assignedAt && conversation.requestedAgentAt) {
              const elapsedMs = getElapsedMsFromNI(conversation.requestedAgentAt)

              if (elapsedMs > 0) {
                previewText += ` · Desde solicitud: ${formatDuration(elapsedMs)}`
              }
            }

            const contactId = conversation.clientContactId ?? 0
            const badge = contactId > 0 ? badgeMap?.[contactId] : null

            const hasCart =
              contactId > 0
                ? badge?.hasCart ?? conversation.isItemsInCart
                : conversation.isItemsInCart

            return (
              <li
                key={conversation.conversationId}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onClick={() => handleSelect(conversation.conversationId)}
                onKeyDown={event =>
                  event.key === "Enter" &&
                  handleSelect(conversation.conversationId)
                }
                onContextMenu={event =>
                  handleContextMenu(event, conversation.conversationId)
                }
                onPointerDown={() =>
                  handlePointerDown(conversation.conversationId)
                }
                onPointerUp={handlePointerEnd}
                onPointerLeave={handlePointerEnd}
                onPointerCancel={handlePointerEnd}
                className={`inbox-list__item${
                  isSelected ? " inbox-list__item--selected" : ""
                } ${
                  conversation.isBlocked ? "inbox-list__item--isblocked" : ""
                }`}
              >
                <div className="inbox-list__top">
                  <div className="inbox-list__details">
                    <div className="inbox-list__name-row">
                      <span className="inbox-list__name">
                        <span className="inbox-list-icon_conversation">
                          {getChannelIcon(conversation.metaChannelId)}
                        </span>

                        <div className="inbox-list__namecontactClassification">
                          <span>
                          {conversation.clientContactId != null
                            ? ` (${conversation.clientContactName})`
                            : ""}
                        </span>

                         <span className={`inbox-list__contactClassification ${conversation.contactClassificationBgColor}`}>
                         {conversation.contactClassificationName}
                       </span>
                        </div>

                        {hasCart && (
                          <span className="inbox-list__isItemsInCart">
                            <FaCartFlatbedSuitcase fontSize={16} />
                          </span>
                        )}
                      </span>

                      <button
                        type="button"
                        className="inbox-list__menu-button"
                        onClick={event => {
                          event.preventDefault()
                          event.stopPropagation()
                          openMenu(conversation.conversationId)
                        }}
                        disabled={actionLoading}
                        title="Opciones"
                        aria-label="Opciones de conversación"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>

                  
                      <div className="inbox-list__names">
                      {conversation.assignedAgentName && (
                        <span> Agente: <strong>{conversation.assignedAgentName}</strong></span>
                      )}
                      </div>

                    <span className="inbox-list__preview">{previewText}</span>
                  </div>

                  <div className="inbox-list__bottom">
                    <div className="inbox-list__bottom_text">
                      <span
                        className={`inbox-list__status inbox-list__status--${statusClass}`}
                      >
                        {statusText}
                      </span>
                    </div>

                    {hasUnread && (
                      <span className="inbox-list__unread-badge">{unread}</span>
                    )}

                    {isMenuOpen && (
                      <div
                        className="inbox-list__menu"
                        onClick={event => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="inbox-list__menu-item"
                          disabled={actionLoading}
                          onClick={event =>
                            executeBlockAction(event, conversation, "block")
                          }
                        >
                          Bloquear contacto
                        </button>

                        <button
                          type="button"
                          className="inbox-list__menu-item"
                          disabled={actionLoading}
                          onClick={event =>
                            executeBlockAction(event, conversation, "unblock")
                          }
                        >
                          Desbloquear contacto
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </React.Fragment>
      ))}

      {loading && <CustomLoader />}

      <li ref={loaderRef} className="inbox-list__loader-anchor" />
    </ul>
  )
}