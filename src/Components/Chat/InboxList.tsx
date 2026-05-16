import React, { useEffect, useRef, useState } from "react"
import { MessageSquareOff, MoreVertical } from "lucide-react"
import "@/Styles/Chat/InboxList.css"
import { format } from "date-fns"
import { toast } from "react-toastify"
import { markConversationRead } from "@/Services/chat/ConversationService"
import type { ConversationDto } from "@/Interfaces/Chat/ChatInterfaces"
import type { PaginationInfo } from "@/Interfaces/Common/GlobalInterface"
import CustomLoader from "@/Components/Common/CustomLoader"
import { selectCartBadgeByContactId } from "@/Context/Slices/Ecommerce/cartBadgeSlice"
import { useSelector } from "react-redux"
import { FaCartFlatbedSuitcase } from "react-icons/fa6"
import { ImWhatsapp } from "react-icons/im"
import { RiMessengerLine } from "react-icons/ri"
import { FaInstagram } from "react-icons/fa6"
import { selectUserId } from "@/Context/Slices/Auth/authSlice"
import { useContactBlock } from "@/Hooks/Wh/useContactBlock"
import { CHANNEL, type ChannelType } from "@/Interfaces/Wh/MetaChannelId"
import { contactService } from "@/Services/auth/ContactService"

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

const formatDuration = (ms: number): string => {
  const totalMinutes = Math.floor(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

const getChannelIcon = (channelId?: number | null) => {
  if (channelId === CHANNEL.Whatsapp) {
    return <ImWhatsapp size={16} className="whatsapp-icon" />
  }

  if (channelId === CHANNEL.Messenger) {
    return <RiMessengerLine size={18} className="messenger-icon" />
  }

  return <FaInstagram size={16} className="instagram-icon" />
}

const getChannel = (channelId?: number | null): ChannelType | null => {
  if (channelId === CHANNEL.Whatsapp) return CHANNEL.Whatsapp
  if (channelId === CHANNEL.Messenger) return CHANNEL.Messenger
  if (channelId === CHANNEL.Instagram) return CHANNEL.Instagram

  return null
}

const getConversationIdentifier = async (conversation: ConversationDto): Promise<string> => {

  const res = await contactService.getById(conversation.clientContactId)

  if(res.data.metaChannelId == CHANNEL.Whatsapp) return res.data.waId ?? ""
  if(res.data.metaChannelId == CHANNEL.Messenger) return res.data.psid ?? ""
  if(res.data.metaChannelId == CHANNEL.Instagram) return res.data.psid ?? ""

   return ""
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

  const {
    blockContact,
    unblockContact,
    isBlocking,
    isUnblocking
  } = useContactBlock()

  const [now, setNow] = useState(Date.now())
  const [menuState, setMenuState] = useState<MenuState>(null)

  const userId = useSelector(selectUserId)
  const badgeMap = useSelector(selectCartBadgeByContactId)

  const actionLoading = isBlocking || isUnblocking

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)

    return () => clearInterval(interval)
  }, [])

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

  const formatTime = (iso?: string) => {
    if (!iso) return ""

    try {
      return format(new Date(iso), "HH:mm")
    } catch {
      return ""
    }
  }

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
    action: "block" | "unblock" | "spam"
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
      {conversations.map(conversation => {
        const isSelected = conversation.conversationId === selectedId
        const isMenuOpen = menuState?.conversationId === conversation.conversationId
        const statusClass = conversation.status?.toLowerCase() ?? ""

        const statusTextMap: Record<string, string> = {
          bot: "Bot",
          waiting: "Pendiente",
          human: "Asignado",
          closed: "Cerrado",
          incomplete: "Incompleta",
          paused: "Pausada",
        }

        const statusText =
          statusTextMap[conversation.status] ?? conversation.status ?? "Pendiente"

        const unread =
          userId === conversation.assignedAgentId
            ? conversation.unreadForAgent ?? 0
            : userId === conversation.assignedByUserId
              ? conversation.unreadForAssigner ?? 0
              : 0

        const hasUnread = unread > 0

        let timeSinceRequest = ""

        if (!conversation.assignedAt && conversation.requestedAgentAt) {
          timeSinceRequest = formatDuration(
            now - new Date(conversation.requestedAgentAt).getTime()
          )
        }

        const clientLast = formatTime(conversation.clientLastMessageAt)
        let previewText = `Cliente últ. msj: ${clientLast}`

        if (!conversation.assignedAt && conversation.requestedAgentAt) {
          previewText += ` · Desde solicitud: ${timeSinceRequest}`
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
              event.key === "Enter" && handleSelect(conversation.conversationId)
            }
            onContextMenu={event =>
              handleContextMenu(event, conversation.conversationId)
            }
            onPointerDown={() => handlePointerDown(conversation.conversationId)}
            onPointerUp={handlePointerEnd}
            onPointerLeave={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            className={`inbox-list__item${isSelected ? " inbox-list__item--selected" : ""}  ${conversation.isBlocked ? "inbox-list__item--isblocked" : ""}`}
          >
            <div className="inbox-list__top">
              <div className="inbox-list__details">
                <div className="inbox-list__name-row">
                  <span className="inbox-list__name">
                    <span className="inbox-list-icon_conversation">
                      {getChannelIcon(conversation.metaChannelId)}
                    </span>

                    {conversation.systemDefinedCompanyName ?? ""}

                    <span>
                      {conversation.clientContactId != null
                        ? ` (${conversation.clientContactName})`
                        : ""}
                    </span>

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

                {conversation.assignedAgentName && (
                  <div className="inbox-list__agent">
                    Agente: <strong>{conversation.assignedAgentName}</strong>
                  </div>
                )}

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

      {loading && <CustomLoader />}

      <li ref={loaderRef} className="inbox-list__loader-anchor" />
    </ul>
  )
}