import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  ArrowLeft,
  Check,
  ChevronDown,
  LoaderCircle,
  FileText,
  MessageSquareMore,
  Mic,
  Paperclip,
  Send,
  Smile,
  Square,
  Trash2,
  UserCheck,
  XCircle,
} from "lucide-react"
import Tooltip from "@mui/material/Tooltip"
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react"
import { TbShoppingCartX } from "react-icons/tb"
import { AiOutlineShoppingCart } from "react-icons/ai"

import { useChatWindow } from "@/Hooks/Chat/useChatWindow"
import useCustomMessage from "@/Hooks/Chat/useCustomMesssage"
import { CustomMessagesFlyout } from "@/Components/Chat/CustomMessagesFlyout"
import TemplatesFlyout from "@/Components/Chat/TemplatesFlyout"
import { WaTemplateService } from "@/Services/Wa/WaTemplateService"
import type { WaTemplateResponseDto } from "@/Interfaces/Wh/TemplateInterface"
import { toast } from "react-toastify"
import { useQueryClient } from "@tanstack/react-query"
import ListSkeleton from "@/Components/Common/ListSkeleton"
import { MetaAdReferralCard } from "@/Components/Chat/MetaAdReferralCard"
import type { AttachmentDto, MessageDto } from "@/Interfaces/Chat/ChatInterfaces"
import { formatearHoraNicaragua, formatDateDivider } from "@/Utils/formatters"

import "@/Styles/Chat/ChatWindow.css"
import "@/Styles/Chat/custom-messages-flyout.css"
import "@/Styles/Wa/WaTemplate.css"

const composerTooltipSlotProps = {
  tooltip: {
    sx: {
      fontSize: "1.3rem",
      padding: "6px 10px",
    },
  },
}

type ChatWindowProps = {
  conversationId?: number
  contactPhone?: string | null
  contactName?: string | null
  userId?: number
  agentId?: number
  conversationStatus?: string | null
  selectedParam?: unknown
  highlightTerm?: string
  validFrom?: Date | null
  validTo?: Date | null
  showMobileBackButton?: boolean
  onMobileBack?: () => void
  showMobileActions?: boolean
  mobileAssignLabel?: string
  mobileCanAssign?: boolean
  mobileIsClosed?: boolean
  mobileIsClosing?: boolean
  onMobileClose?: () => void
  onMobileAssign?: () => void
  showMobileDetailButton?: boolean
  mobileDetailOpen?: boolean
  onMobileToggleDetail?: () => void
}


const getAttachmentUrl = (attachment: AttachmentDto) => {
  return attachment.mediaUrl || ""
}

const isImage = (mimeType?: string | null) => {
  return String(mimeType ?? "").startsWith("image/")
}

const isVideo = (mimeType?: string | null) => {
  return String(mimeType ?? "").startsWith("video/")
}

const isAudio = (mimeType?: string | null) => {
  return String(mimeType ?? "").startsWith("audio/")
}

const getReplyPreviewText = (message: MessageDto): string => {
  const content = message.content?.trim()

  if (content) return content

  const referralHeadline = message.referral?.headline?.trim()

  if (referralHeadline) return `[Anuncio] ${referralHeadline}`
  if (message.referral) return "[Anuncio]"

  return message.attachments?.[0]?.fileName || "Adjunto"
}

const getReplyPreviewImage = (message: MessageDto): string | null => {
  const attachment = message.attachments?.[0]

  if (attachment?.mediaUrl && isImage(attachment.mimeType)) {
    return attachment.mediaUrl
  }

  return (
    message.referral?.thumbnailUrl ||
    message.referral?.imageUrl ||
    null
  )
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversationId,
  contactPhone,
  contactName,
  userId,
  agentId,
  conversationStatus,
  selectedParam,
  highlightTerm,
  validFrom = null,
  validTo = null,

  showMobileBackButton = false,
  onMobileBack,

  showMobileActions = false,
  mobileAssignLabel = "Asignar",
  mobileCanAssign = true,
  mobileIsClosed = false,
  mobileIsClosing = false,
  onMobileClose,
  onMobileAssign,

  showMobileDetailButton = false,
  mobileDetailOpen = false,
  onMobileToggleDetail,
}) => {
  const queryClient = useQueryClient()
  const {
    visibleMessages,
    loadingMessages,
    messagesError,
    fetchOlderMessages,
    hasMoreMessages,
    isFetchingOlderMessages,

    text,
    setText,
    files,
    removeFile,
    clearFiles,
    sending,
    handleSend,
    bottomRef,
    fileInputRef,
    handleFileChange,
    handlePaste,
    // handleDownload,
    getStatusIcon,
    getMessageClassName,
    getMessagePosition,
    getFileIcon,
    ismaximize,
    previewImageUrl,
    openImagePreview,
    closeImagePreview,

    isRecording,
    audioBlob,
    recordingTime,
    startRecording,
    stopRecording,
    secondsToTime,
    clearRecording,
    handleSendAudio,

    hasMedia,
    hasText,
    replyTo,
    cancelReply,
    beginReply,
    startLongPress,
    cancelLongPress,
    registerMessageRef,
    scrollToMessage,
    highlightedId,

    searchTerm,
    setSearchTerm,
    matchIds,
    matchIndex,
    gotoMatch,
    renderMessageContent,
    onComposerKeyDown,
    textAreaRef,
  } = useChatWindow(
    {
      conversationId,
      userId,
      agentId,
      conversationStatus,
      selectedParam,
      highlightTerm,
    },
    validFrom,
    validTo
  )

  const {
    activeCustomMessages,
    loading: loadingCustomMessages,
    error: customMessagesError,
    loaded: customMessagesLoaded,
    load: loadCustomMessages,
    create,
    update,
    toggleStatus,
  } = useCustomMessage(false)

  const messagesContainerRef = useRef<HTMLDivElement | null>(null)
  const emojiPickerRef = useRef<HTMLDivElement | null>(null)
  const customMessagesButtonRef = useRef<HTMLButtonElement | null>(null)
  const templatesButtonRef = useRef<HTMLButtonElement | null>(null)

  const [showScrollButton, setShowScrollButton] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [customMessagesOpen, setCustomMessagesOpen] = useState(false)
  const [customMessagesAnchor, setCustomMessagesAnchor] =
    useState<DOMRect | null>(null)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [templatesAnchor, setTemplatesAnchor] = useState<DOMRect | null>(null)
  const [sendingTemplate, setSendingTemplate] = useState(false)

  const loadingOlderRef = useRef(false)
  const shouldStickToBottomRef = useRef(true)
  const previousConversationIdRef = useRef<number | undefined>(conversationId)
  const previousMessagesLengthRef = useRef(visibleMessages.length)

  const pendingOlderScrollRef = useRef<{
    scrollHeight: number
    scrollTop: number
  } | null>(null)

  const canType = Boolean(conversationId)

  const showSearchBar = Boolean(searchTerm || matchIds.length)

  const groupedMessages = useMemo(() => {
    let lastDateKey = ""

    return visibleMessages.map((message) => {
      const currentDateKey = formatDateDivider(message.sentAt)
      const showDate = currentDateKey !== lastDateKey

      if (currentDateKey) {
        lastDateKey = currentDateKey
      }

      return {
        message,
        showDate,
        dateLabel: currentDateKey,
      }
    })
  }, [visibleMessages])

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "auto") => {
      bottomRef.current?.scrollIntoView({
        behavior,
        block: "end",
      })
    },
    [bottomRef]
  )

  const updateScrollButtonState = useCallback(() => {
    const container = messagesContainerRef.current

    if (!container) return

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight

    const isNearBottom = distanceFromBottom <= 90

    shouldStickToBottomRef.current = isNearBottom
    setShowScrollButton(distanceFromBottom > 140)
  }, [])

  const focusComposer = useCallback(() => {
    requestAnimationFrame(() => {
      textAreaRef.current?.focus()
    })
  }, [textAreaRef])

  const toggleTemplates = useCallback(() => {
    if (!canType || sendingTemplate) return

    setShowEmojiPicker(false)
    setCustomMessagesOpen(false)
    setTemplatesAnchor(
      templatesButtonRef.current?.getBoundingClientRect() ?? null
    )
    setTemplatesOpen((current) => !current)
  }, [canType, sendingTemplate])

  const sendTemplateToChat = useCallback(async (template: WaTemplateResponseDto) => {
    const phone = String(contactPhone ?? "").trim()

    if (!phone) {
      toast.error("Esta conversación no tiene número de WhatsApp.")
      return
    }

    setSendingTemplate(true)
    try {
      const result = await WaTemplateService.SendBatchNewConversationsAsync({
        templateName: template.name,
        language: template.language || "es",
        conversationId: conversationId ?? null,
        recipients: [{
          phone,
          fullName: contactName || phone,
          variables: []
        }]
      })

      if (result.failed > 0) {
        toast.error(result.items?.[0]?.error || "No se pudo enviar la plantilla.")
        return
      }

      if (conversationId) {
        await queryClient.invalidateQueries({
          queryKey: ["chat-messages", conversationId],
        })
      }

      toast.success("Plantilla enviada.")
    } catch {
      toast.error("No se pudo enviar la plantilla.")
    } finally {
      setSendingTemplate(false)
    }
  }, [contactName, contactPhone, conversationId, queryClient])

  const toggleCustomMessages = useCallback(() => {
    if (!canType) return

    setShowEmojiPicker(false)
    setTemplatesOpen(false)

    const rect =
      customMessagesButtonRef.current?.getBoundingClientRect() ?? null

    setCustomMessagesAnchor(rect)
    setCustomMessagesOpen((current) => {
      const nextOpen = !current

      if (nextOpen && !customMessagesLoaded) {
        void loadCustomMessages()
      }

      return nextOpen
    })
  }, [canType, customMessagesLoaded, loadCustomMessages])

  const closeCustomMessages = useCallback(() => {
    setCustomMessagesOpen(false)
  }, [])

  const insertEmoji = useCallback(
    (emojiData: EmojiClickData) => {
      const emoji = emojiData.emoji
      const textarea = textAreaRef.current

      if (!textarea) {
        setText(`${text}${emoji}`)
        focusComposer()
        return
      }

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const nextText = `${text.slice(0, start)}${emoji}${text.slice(end)}`

      setText(nextText)

      requestAnimationFrame(() => {
        textarea.focus()
        const nextCursorPosition = start + emoji.length
        textarea.setSelectionRange(nextCursorPosition, nextCursorPosition)
      })
    },
    [focusComposer, setText, text, textAreaRef]
  )

  const handleMessagesScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const container = event.currentTarget

      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight

      const isNearBottom = distanceFromBottom <= 90

      shouldStickToBottomRef.current = isNearBottom
      setShowScrollButton(distanceFromBottom > 140)

      const isNearTop = container.scrollTop <= 80

      if (
        isNearTop &&
        hasMoreMessages &&
        !isFetchingOlderMessages &&
        !loadingOlderRef.current
      ) {
        loadingOlderRef.current = true

        pendingOlderScrollRef.current = {
          scrollHeight: container.scrollHeight,
          scrollTop: container.scrollTop,
        }

        void fetchOlderMessages()
      }
    },
    [fetchOlderMessages, hasMoreMessages, isFetchingOlderMessages]
  )

  useEffect(() => {
    const container = messagesContainerRef.current

    if (!container) return

    const cssVar = `${container.clientHeight}px`

    document.documentElement.style.setProperty("--chat-visible-h", cssVar)

    const conversationChanged =
      previousConversationIdRef.current !== conversationId

    if (conversationChanged) {
      previousConversationIdRef.current = conversationId
      previousMessagesLengthRef.current = visibleMessages.length
      shouldStickToBottomRef.current = true
      pendingOlderScrollRef.current = null
      loadingOlderRef.current = false

      setShowScrollButton(false)
      setShowEmojiPicker(false)
      setCustomMessagesOpen(false)
      setCustomMessagesAnchor(null)

      requestAnimationFrame(() => {
        scrollToBottom("auto")
        updateScrollButtonState()
        focusComposer()
      })

      return
    }

    const pendingOlderScroll = pendingOlderScrollRef.current

    if (pendingOlderScroll && !isFetchingOlderMessages) {
      requestAnimationFrame(() => {
        const nextScrollHeight = container.scrollHeight
        const diff = nextScrollHeight - pendingOlderScroll.scrollHeight

        container.scrollTop = pendingOlderScroll.scrollTop + diff

        pendingOlderScrollRef.current = null
        loadingOlderRef.current = false
        previousMessagesLengthRef.current = visibleMessages.length

        updateScrollButtonState()
      })

      return
    }

const messagesCountChanged =
  previousMessagesLengthRef.current !== visibleMessages.length

previousMessagesLengthRef.current = visibleMessages.length

const lastMessage =
  visibleMessages[visibleMessages.length - 1]

const isIncomingMessage =
  Boolean(lastMessage?.senderContactId) ||
  lastMessage?.isIncoming === true

if (
  messagesCountChanged &&
  !isFetchingOlderMessages &&
  (shouldStickToBottomRef.current || isIncomingMessage)
) {
  requestAnimationFrame(() => {
    shouldStickToBottomRef.current = true
    scrollToBottom("auto")
    updateScrollButtonState()
  })

  return
}

    requestAnimationFrame(() => {
      updateScrollButtonState()
    })
  }, [conversationId, visibleMessages.length, isFetchingOlderMessages, scrollToBottom, updateScrollButtonState, focusComposer, visibleMessages])

  useEffect(() => {
    if (!showEmojiPicker) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      if (emojiPickerRef.current?.contains(target)) return

      setShowEmojiPicker(false)
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showEmojiPicker])

  useEffect(() => {
    if (!customMessagesOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null

      if (!target) return

      const clickedFlyout = Boolean(target.closest(".cmf-flyout"))
      const clickedButton = customMessagesButtonRef.current?.contains(target)

      if (clickedFlyout || clickedButton) return

      setCustomMessagesOpen(false)
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return

      setCustomMessagesOpen(false)
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [customMessagesOpen])

  const handleSendNow = async () => {
    if (!canType || sending || (!text.trim() && files.length === 0)) return

    shouldStickToBottomRef.current = true
    setShowEmojiPicker(false)
    setCustomMessagesOpen(false)

    await handleSend()

    requestAnimationFrame(() => {
      scrollToBottom("smooth")
      updateScrollButtonState()
      focusComposer()
    })
  }

  const handleSendCustomMessageNow = useCallback(
    async (messageText: string) => {
      const cleanText = messageText.trim()

      if (!cleanText || !canType || sending) return

      shouldStickToBottomRef.current = true
      setCustomMessagesOpen(false)
      setShowEmojiPicker(false)

      await handleSend(null, cleanText)

      requestAnimationFrame(() => {
        scrollToBottom("smooth")
        updateScrollButtonState()
        focusComposer()
      })
    },
    [
      canType,
      sending,
      handleSend,
      scrollToBottom,
      updateScrollButtonState,
      focusComposer,
    ]
  )

  const handleInsertCustomMessage = useCallback(
    (messageText: string) => {
      setCustomMessagesOpen(false)
      setShowEmojiPicker(false)
      setText(messageText)

      requestAnimationFrame(() => {
        textAreaRef.current?.focus()
        const length = messageText.length
        textAreaRef.current?.setSelectionRange(length, length)
      })
    },
    [setText, textAreaRef]
  )

  const handleTextareaChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setText(event.target.value)

    const textarea = event.target

    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
  }

  const renderReplyPreview = (message: MessageDto) => {
    const replied = message.repliedMessage

    if (!replied) return null

    const previewImage = getReplyPreviewImage(replied)

    return (
      <button
        type="button"
        className="chat-window__reply-preview"
        onClick={() =>
          scrollToMessage(message.repliedMessageId ?? replied.messageId)
        }
      >
        <div className="chat-window__reply-author">
          {replied.senderContactName || replied.senderUserName || "Mensaje"}
        </div>

        <div className="chat-window__reply-row">
          {previewImage && (
            <img
              src={previewImage}
              alt="Respuesta"
              className="chat-window__reply-thumb-img"
              loading="lazy"
              decoding="async"
              fetchPriority="low"
            />
          )}

          <span className="chat-window__reply-content">
            {getReplyPreviewText(replied)}
          </span>
        </div>
      </button>
    )
  }

  const renderAttachment = (attachment: AttachmentDto) => {
    const url = getAttachmentUrl(attachment)
    const mimeType = attachment.mimeType ?? ""
    const fileName = attachment.fileName || "archivo"

    if (isImage(mimeType)) {
      return (
        <div className="chat-window__media-image">
          <button
            type="button"
            className="chat-window__image-container"
            onClick={() => openImagePreview(url)}
          >
            <img
              src={url}
              alt={fileName}
              className="chat-window__image"
              loading="lazy"
              decoding="async"
              fetchPriority="low"
            />
          </button>
        </div>
      )
    }

    if (isVideo(mimeType)) {
      return (
        <div className="chat-window__media-video">
          <video controls preload="metadata" className="chat-window__video">
            <source src={url} type={mimeType} />
          </video>
        </div>
      )
    }

    if (isAudio(mimeType)) {
      return (
        <div className="chat-window__media-audio">
          <div className="chat-window__audio-container">
            <div className="chat-window__audio-icon">
              {getFileIcon(mimeType)}
            </div>

            <div className="chat-window__audio-info">
              <div className="chat-window__audio-name">{fileName}</div>

              <audio
                controls
                preload="metadata"
                className="chat-window__audio-player"
              >
                <source src={url} type={mimeType} />
              </audio>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="chat-window__media-document">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="chat-window__document-link"
        >
          <div className="chat-window__document-icon">
            {getFileIcon(mimeType)}
          </div>

          <div className="chat-window__document-info">
            <div className="chat-window__document-name">{fileName}</div>
            <div className="chat-window__document-size">
              {mimeType || "Documento"}
            </div>
          </div>

          {/* <Download
            className="chat-window__document-download"
            onClick={(event) => {
              event.preventDefault()
              void handleDownload(fileName)
            }}
          /> */}
        </a>
      </div>
    )
  }

  const renderContactMessage = (message: MessageDto) => {
    if (!message.contact?.length) return null

    return (
      <div className="chat-window__contact-list">
        {message.contact.map((contact, index) => (
          <div
            key={`${contact.phones ?? index}`}
            className="chat-window__contact-card"
          >
            <div className="chat-window__contact-icon">👤</div>

            <div className="chat-window__contact-info">
              <p className="chat-window__contact-name">
                {contact.name?.formatted_name ||
                  contact.name?.first_name ||
                  "Contacto"}
              </p>

              {contact.phones?.map((phone, phoneIndex) => (
                <p
                  key={`${phone.phone ?? phone.wa_id ?? phoneIndex}`}
                  className="chat-window__contact-phone"
                >
                  {phone.phone || phone.wa_id}

                  {phone.type && (
                    <span className="chat-window__contact-type">
                      {phone.type}
                    </span>
                  )}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderMessage = (message: MessageDto) => {
    const isOut =
      !message.senderContactId &&
      !message.isIncoming &&
      (!message.senderUserId || message.senderUserId === userId)

    return (
      <div
        ref={registerMessageRef(message.messageId)}
        className={`${getMessagePosition(message)} ${
          highlightedId === message.messageId
            ? "chat-window__message--highlighted"
            : ""
        }`}
        onPointerDown={(event) => startLongPress(event, message)}
        onPointerUp={cancelLongPress}
        onPointerLeave={cancelLongPress}
        onPointerCancel={cancelLongPress}
      >
        {!isOut && (
          <span className="chat-window__message-sender">
            {message.senderContactName ||
              message.senderUserName ||
              message.senderClientName ||
              "Cliente"}
          </span>
        )}

        <div
          className={getMessageClassName(message)}
          title={message.localError ?? ""}
          onDoubleClick={() => beginReply(message)}
        >
          {renderReplyPreview(message)}

          <div className="chat-window__message-content">
            {message.referral && (
              <MetaAdReferralCard referral={message.referral} />
            )}

            {hasMedia(message) && (
              <div className="chat-window__media">
                {message.attachments?.map((attachment) => (
                  <React.Fragment key={attachment.attachmentId}>
                    {renderAttachment(attachment)}
                  </React.Fragment>
                ))}
              </div>
            )}

            {message.messageType === "Contact" && renderContactMessage(message)}

            {(message.messageType === "Template" || message.waTemplateId) && (
              <span className="chat-window__template-tag">Plantilla</span>
            )}

            {hasText(message) && (
              <p className="chat-window__message-text">
                {renderMessageContent(message.content ?? "", searchTerm)}
              </p>
            )}

            {!hasText(message) &&
              (message.messageType === "Template" || message.waTemplateId) && (
              <p className="chat-window__message-text">
                {message.templateName || "Plantilla"}
              </p>
            )}
          </div>

          <div className="chat-window__message-info">
            <span className="chat-window__message-time">
              {formatearHoraNicaragua(message.sentAt)}
            </span>

            {getStatusIcon(message, isOut)}
          </div>
        </div>
      </div>
    )
  }

  if (!conversationId) {
    return (
      <section className="chat-window">
        <div className="chat-window__empty">
          <MessageSquareMore className="chat-window__empty-icon" />
          <h3 className="chat-window__empty-title">
            Seleccioná una conversación
          </h3>
          <p className="chat-window__empty-text">
            Elegí un chat de la lista para comenzar a responder.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="chat-window">
      {showMobileBackButton && (
        <div className="chat-window__mobile-topbar">
          <button
            type="button"
            className="chat-window__mobile-back"
            onClick={onMobileBack}
            aria-label="Regresar"
            title="Regresar"
          >
            <ArrowLeft size={18} />
          </button>

          <span className="chat-window__mobile-title">Chat</span>

          <div className="chat-window__mobile-actions">
            {showMobileDetailButton && (
              <button
                type="button"
                className={`chat-window__mobile-action ${
                  mobileDetailOpen ? "is-active" : ""
                }`}
                onClick={onMobileToggleDetail}
                title={mobileDetailOpen ? "Ocultar detalle" : "Mostrar detalle"}
                aria-label={
                  mobileDetailOpen ? "Ocultar detalle" : "Mostrar detalle"
                }
              >
                {!mobileDetailOpen ? (
                  <>
                    <AiOutlineShoppingCart size={18} />
                    <span>Abrir Ventas</span>
                  </>
                ) : (
                  <>
                    <TbShoppingCartX size={18} />
                    <span>Cerrar Panel</span>
                  </>
                )}
              </button>
            )}

            {showMobileActions && !mobileDetailOpen && (
              <>
                <button
                  type="button"
                  className="chat-window__mobile-action chat-window__mobile-action--close"
                  onClick={() => {
                    if (mobileIsClosed || mobileIsClosing) return
                    onMobileClose?.()
                  }}
                  disabled={mobileIsClosed || mobileIsClosing}
                  aria-busy={mobileIsClosing}
                  title="Cerrar"
                >
                  {mobileIsClosing ? (
                    <>
                      <LoaderCircle size={15} className="button-loading-icon" />
                      <span>Cerrando...</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={15} />
                      <span>Cerrar</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="chat-window__mobile-action chat-window__mobile-action--assign"
                  onClick={onMobileAssign}
                  disabled={mobileIsClosed || !mobileCanAssign}
                  title={mobileAssignLabel}
                >
                  <UserCheck size={15} />
                  <span>{mobileAssignLabel}</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showSearchBar && (
        <div className="chat-window__searchbar">
          <input
            className="chat-window__searchbar-input"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar en el chat"
          />

          <div className="chat-window__searchbar-meta">
            <span>
              {matchIds.length ? matchIndex + 1 : 0}/{matchIds.length}
            </span>

            <button
              type="button"
              onClick={() => gotoMatch(-1)}
              disabled={!matchIds.length}
            >
              ↑
            </button>

            <button
              type="button"
              onClick={() => gotoMatch(1)}
              disabled={!matchIds.length}
            >
              ↓
            </button>
          </div>
        </div>
      )}

      <div
        ref={messagesContainerRef}
        className="chat-window__messages"
        onScroll={handleMessagesScroll}
      >
        {hasMoreMessages && (
          isFetchingOlderMessages ? (
            <ListSkeleton variant="message" count={2} />
          ) : (
            <div className="chat-window__loading-older">
              Deslizá hacia arriba
            </div>
          )
        )}

        {loadingMessages && !visibleMessages.length && (
          <ListSkeleton
            variant="message"
            count={14}
            className="list-skeleton--fill"
          />
        )}

        {messagesError && (
          <div className="chat-window__loading-older">
            No se pudieron cargar los mensajes.
          </div>
        )}

        {groupedMessages.map(({ message, showDate, dateLabel }) => (
          <React.Fragment key={message.clientTempId ?? message.messageId}>
            {showDate && (
              <div className="chat-window__date-divider">
                <span className="chat-window__date-text">
                  {dateLabel}
                </span>
              </div>
            )}

            <div className="chat-window_message-group_container">
              {renderMessage(message)}
            </div>
          </React.Fragment>
        ))}

        <div ref={bottomRef} />

        {showScrollButton && (
          <button
            type="button"
            className="chat-window__scroll-button"
            onClick={() => {
              shouldStickToBottomRef.current = true
              scrollToBottom("smooth")
              setShowScrollButton(false)
            }}
            title="Ir al final"
          >
            <ChevronDown className="chat-window__scroll-buttonIcon" />
          </button>
        )}
      </div>

      {replyTo && (
        <div className="chat-window__reply-pill">
          <div>
            <div className="chat-window__reply-pill-text">
              Respondiendo a {replyTo.author}
            </div>

            <button
              type="button"
              className="chat-window__reply-pill-jump"
              onClick={() => scrollToMessage(replyTo.messageId)}
            >
              {replyTo.preview}
            </button>
          </div>

          <button
            type="button"
            className="chat-window__reply-pill-close"
            onClick={() => {
              cancelReply()
              focusComposer()
            }}
          >
            ✕
          </button>
        </div>
      )}

      <footer className="chat-window__composer">
        <Tooltip title="Adjuntar archivo" arrow slotProps={composerTooltipSlotProps}>
          <span className="chat-window__composer-tip">
            <button
              type="button"
              className="chat-window__composer-attachment"
              onClick={() => {
                fileInputRef.current?.click()
                focusComposer()
              }}
              disabled={!canType}
              aria-label="Adjuntar archivo"
            >
              <Paperclip size={19} strokeWidth={1.8} />
            </button>
          </span>
        </Tooltip>

        <input
          ref={fileInputRef}
          type="file"
          className="chat-window__composer-file-input"
          onChange={handleFileChange}
          multiple={true}
        />

        {files.length > 0 && (
          <div className="chat-window__composer-files-preview">
            <div className="chat-window__composer-files-header">
              <span className="chat-window__composer-files-count">
                {files.length} archivo{files.length === 1 ? "" : "s"} seleccionado
                {files.length === 1 ? "" : "s"}
              </span>

              <button
                type="button"
                className="chat-window__composer-files-clear"
                onClick={() => {
                  clearFiles()
                  focusComposer()
                }}
                title="Quitar todos los archivos"
              >
                Quitar todos
              </button>
            </div>

            <div className="chat-window__composer-files-list">
              {files.map((selectedFile, index) => (
                <div
                  key={`${selectedFile.name}-${selectedFile.size}-${selectedFile.lastModified}`}
                  className="chat-window__composer-file-preview"
                >
                  <span className="chat-window__composer-file-icon">
                    {getFileIcon(
                      selectedFile.type || "application/octet-stream"
                    )}
                  </span>

                  <span
                    className="chat-window__composer-file-name"
                    title={selectedFile.name}
                  >
                    {selectedFile.name}
                  </span>

                  <button
                    type="button"
                    className="chat-window__composer-file-remove"
                    onClick={() => {
                      removeFile(index)
                      focusComposer()
                    }}
                    title={`Quitar ${selectedFile.name}`}
                    aria-label={`Quitar ${selectedFile.name}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="chat-window__quick">
          <Tooltip title="Plantillas" arrow slotProps={composerTooltipSlotProps}>
            <span className="chat-window__composer-tip">
              <button
                ref={templatesButtonRef}
                type="button"
                className="chat-window__quick-toggle"
                disabled={!canType || sendingTemplate}
                aria-label="Plantillas"
                onClick={toggleTemplates}
              >
                <FileText size={19} strokeWidth={1.8} />
              </button>
            </span>
          </Tooltip>

          <Tooltip title="Mensajes personalizados" arrow slotProps={composerTooltipSlotProps}>
            <span className="chat-window__composer-tip">
              <button
                ref={customMessagesButtonRef}
                type="button"
                className="chat-window__quick-toggle"
                disabled={!canType}
                aria-label="Mensajes personalizados"
                onClick={toggleCustomMessages}
              >
                <MessageSquareMore size={19} strokeWidth={1.8} />
              </button>
            </span>
          </Tooltip>
        </div>

        <div className="chat-window__composer-input-container">
          <textarea
            ref={textAreaRef}
            className="chat-window__composer-input"
            value={text}
            onChange={handleTextareaChange}
            onPaste={handlePaste}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                shouldStickToBottomRef.current = true
              }

              onComposerKeyDown(event)
            }}
            placeholder="Escribí un mensaje..."
            disabled={!canType}
          />
        </div>

        <div className="chat-window__composer-actions">
            <div className="chat-window__emoji-container" ref={emojiPickerRef}>
              <Tooltip title="Agregar emoji" arrow slotProps={composerTooltipSlotProps}>
                <span className="chat-window__composer-tip">
                  <button
                    type="button"
                    className="chat-window__emoji-btn"
                    disabled={!canType}
                    aria-label="Agregar emoji"
                    onClick={() => {
                      setCustomMessagesOpen(false)
                      setShowEmojiPicker((current) => !current)
                      focusComposer()
                    }}
                  >
                    <Smile size={19} strokeWidth={1.8} />
                  </button>
                </span>
              </Tooltip>

              {showEmojiPicker && (
                <div className="chat-window__emoji-picker">
                  <EmojiPicker
                    onEmojiClick={insertEmoji}
                    width="100%"
                    height={300}
                    searchPlaceHolder="Buscar emoji"
                    previewConfig={{
                      showPreview: false,
                    }}
                    skinTonesDisabled
                    lazyLoadEmojis
                  />
                </div>
              )}
            </div>

            <div className="chat-window__composer-audio">
              {!isRecording && !audioBlob && (
                <Tooltip title="Grabar audio" arrow slotProps={composerTooltipSlotProps}>
                  <span className="chat-window__composer-tip">
                    <button
                      type="button"
                      className="chat-window__audio-btn"
                      onClick={startRecording}
                      disabled={!canType}
                      aria-label="Grabar audio"
                    >
                      <Mic className="chat-window__audio-icons" size={19} strokeWidth={1.8} />
                    </button>
                  </span>
                </Tooltip>
              )}

              {isRecording && (
                <>
                  <span className="chat-window__audio-timer audio-timer__recording">
                    {secondsToTime(recordingTime)}
                  </span>

                  <Tooltip title="Detener grabación" arrow slotProps={composerTooltipSlotProps}>
                    <span className="chat-window__composer-tip">
                      <button
                        type="button"
                        className="chat-window__audio-btn chat-window__audio-btn--stop"
                        onClick={stopRecording}
                        aria-label="Detener grabación"
                      >
                        <Square size={16} />
                      </button>
                    </span>
                  </Tooltip>
                </>
              )}

              {audioBlob && !isRecording && (
                <>
                  <Tooltip title="Eliminar audio" arrow slotProps={composerTooltipSlotProps}>
                    <span className="chat-window__composer-tip">
                      <button
                        type="button"
                        className="chat-window__audio-btn chat-window__audio-btn--trash"
                        onClick={clearRecording}
                        aria-label="Eliminar audio"
                      >
                        <Trash2 size={16} />
                      </button>
                    </span>
                  </Tooltip>

                  <Tooltip title="Enviar audio" arrow slotProps={composerTooltipSlotProps}>
                    <span className="chat-window__composer-tip">
                      <button
                        type="button"
                        className="chat-window__audio-btn chat-window__audio-btn--send"
                        onClick={() => {
                          shouldStickToBottomRef.current = true
                          void handleSendAudio()
                          focusComposer()
                        }}
                        disabled={sending}
                        aria-label="Enviar audio"
                      >
                        <Check size={16} />
                      </button>
                    </span>
                  </Tooltip>
                </>
              )}
            </div>
        </div>

        <Tooltip
          title={
            files.length > 1 ? `Enviar ${files.length} archivos` : "Enviar mensaje"
          }
          arrow
          slotProps={composerTooltipSlotProps}
        >
          <span className="chat-window__composer-tip">
            <button
              type="button"
              className="chat-window__composer-send"
              onClick={handleSendNow}
              disabled={
                !canType || sending || (!text.trim() && files.length === 0)
              }
              aria-label={
                files.length > 1 ? `Enviar ${files.length} archivos` : "Enviar mensaje"
              }
            >
              <Send size={19} strokeWidth={1.8} />
            </button>
          </span>
        </Tooltip>
      </footer>

      <TemplatesFlyout
        anchorRect={templatesAnchor}
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onPick={(template) => {
          void sendTemplateToChat(template)
        }}
      />

      <CustomMessagesFlyout
        anchorRect={customMessagesAnchor}
        open={customMessagesOpen}
        onClose={closeCustomMessages}
        items={activeCustomMessages}
        loading={loadingCustomMessages}
        error={customMessagesError}
        onCreate={create}
        onUpdate={update}
        onToggle={toggleStatus}
        onInsertToComposer={handleInsertCustomMessage}
        onSendNow={handleSendCustomMessageNow}
      />

      {ismaximize && previewImageUrl && (
        <div
          className="chat-window__image-preview-overlay"
          onClick={closeImagePreview}
        >
          <img
            src={previewImageUrl}
            alt="Vista previa"
            className="chat-window__image-preview-full"
            decoding="async"
          />
        </div>
      )}
    </section>
  )
}

export default ChatWindow;