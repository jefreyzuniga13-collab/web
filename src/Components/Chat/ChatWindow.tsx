import React, { useEffect, useRef, useState } from "react"
import {
  Send,
  Paperclip,
  Download,
  MessageSquareMore,
  Mic,
  Square,
  Trash2,
  Check,
} from "lucide-react"
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react"
import { useChatWindow } from "@/Hooks/Chat/useChatWindow"
import type { SystemParamResponseDto } from "@/Interfaces/Auth/AuthInterface"
import {
  format,
  isToday,
  isYesterday,
  parseISO,
  differenceInCalendarDays,
} from "date-fns"
import { es } from "date-fns/locale/es"
import SmsIcon from "@mui/icons-material/Sms"
import { useCustomMessage } from "@/Hooks/Chat/useCustomMesssage"
import { CustomMessagesFlyout } from "@/Components/Chat/CustomMessagesFlyout"
import { FaArrowDown } from "react-icons/fa"
import "@/styles/Chat/ChatWindow.css"
import "@/Styles/Chat/custom-messages-flyout.css"
import { BsEmojiLaughing } from "react-icons/bs"
import { IoCloseSharp } from "react-icons/io5"
import { formatTime } from "@/Utils/ECommerce/formatters"
import type {
  AttachmentDto,
  MessageDto,
} from "@/Interfaces/Chat/ChatInterfaces"

declare global {
  interface Window {
    __CHAT_SEND_QUICK__?: (text: string) => Promise<void>
  }
}

interface Props {
  conversationId?: number
  conversationStatus?: string | null
  userId: number
  agentId?: number
  selectedParam: SystemParamResponseDto | null
  highlightTerm?: string
  validFrom: Date | null
  validTo: Date | null
}

type ContactPhone = {
  wa_id?: string | null
  phone?: string | null
  type?: string | null
}

type ContactPayload = {
  name?: {
    formatted_name?: string | null
  } | null
  phones?: ContactPhone[] | null
}

type RepliedMessage = {
  messageId?: number | null
  senderContactId?: number | null
  senderContactName?: string | null
  senderUserName?: string | null
  incognitoMode?: boolean | null
  content?: string | null
  attachments?: AttachmentDto[] | null
}

type ChatMessageView = MessageDto & {
  contact?: ContactPayload[] | null
  repliedMessage?: RepliedMessage | null
  repliedMessageId?: number | null
}

const SCROLL_TOP_THRESHOLD = 80

const cap = (value: string) => {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value
}

const getConversationStringDate = (sentAt: string) => {
  const fecha = parseISO(sentAt)

  if (isToday(fecha)) return "Hoy"
  if (isYesterday(fecha)) return "Ayer"

  const diff = differenceInCalendarDays(new Date(), fecha)

  if (diff >= 2 && diff < 7) {
    return cap(format(fecha, "EEEE", { locale: es }))
  }

  return format(fecha, "d 'de' MMMM 'de' yyyy", { locale: es })
}

const isAtBottom = (element: HTMLElement) => {
  return element.scrollTop >= element.scrollHeight - element.clientHeight - 12
}

const getReplyAuthor = (message: RepliedMessage | null) => {
  if (!message) return "Mensaje"

  if (message.senderContactId) {
    return message.senderContactName || "Cliente"
  }

  return !message.incognitoMode ? message.senderUserName || "" : ""
}

const getReplyPreview = (message: RepliedMessage | null) => {
  if (!message) return ""

  const attachment = message.attachments?.[0]
  const text = String(message.content ?? "").trim()

  if (attachment) {
    const mime = String(attachment.mimeType ?? "")

    if (mime.startsWith("image/") || mime === "image/webp") {
      return attachment.fileName || "Imagen"
    }

    if (mime.startsWith("video/")) return attachment.fileName || "Video"
    if (mime.startsWith("audio/")) return attachment.fileName || "Audio"

    return attachment.fileName || attachment.mimeType || "Adjunto"
  }

  if (!text) return ""

  return text.length > 90 ? `${text.slice(0, 90)}…` : text
}

const getReplyIcon = (message: RepliedMessage | null) => {
  const attachment = message?.attachments?.[0]

  if (!attachment) return null

  const mime = String(attachment.mimeType ?? "")

  if (mime.startsWith("image/") || mime === "image/webp") return "📷"
  if (mime.startsWith("video/")) return "🎬"
  if (mime.startsWith("audio/")) return "🎵"

  return "📎"
}

const getReplyThumb = (message: RepliedMessage | null) => {
  const attachment = message?.attachments?.[0]

  if (!attachment) return null

  const mime = String(attachment.mimeType ?? "")

  if (mime.startsWith("image/") || mime === "image/webp") {
    return attachment.mediaUrl ?? null
  }

  return null
}

export const ChatWindow: React.FC<Props> = ({
  conversationId,
  userId,
  agentId = 0,
  conversationStatus,
  selectedParam,
  highlightTerm,
  validFrom,
  validTo,
}) => {
  const smsBtnRef = useRef<HTMLDivElement | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)
  const composerRef = useRef<HTMLDivElement | null>(null)
  const dateRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const loadingOlderRef = useRef(false)
  const lastConversationIdRef = useRef<number | undefined>(conversationId)
  const shouldAutoScrollRef = useRef(true)

  const [flyoutOpen, setFlyoutOpen] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [stickyDate, setStickyDate] = useState<string | null>(null)

  const {
    customMessages,
    create,
    update,
    toggleSystemParam,
    loading,
    error,
    load,
    loaded,
  } = useCustomMessage(false)

  const {
    setConversationId,
    setUserId,
    visibleMessages,
    hasText,
    text,
    setText,
    file,
    setFile,
    sending,
    handleSend,
    bottomRef,
    fileInputRef,
    handleFileChange,
    handlePaste,
    getStatusIcon,
    getMessageClassName,
    getMessagePosition,
    getFileIcon,
    ismaximize,
    previewImageUrl,
    openImagePreview,
    closeImagePreview,
    setSelectedOption,
    beginReply,
    cancelReply,
    replyTo,
    startLongPress,
    cancelLongPress,
    focusTextarea,
    onComposerKeyDown,
    textAreaRef,
    registerMessageRef,
    scrollToMessage,
    highlightedId,
    searchTerm,
    setSearchTerm,
    matchIds,
    matchIndex,
    gotoMatch,
    renderMessageContent,

    isRecording,
    clearRecording,
    handleSendAudio,
    recordingTime,
    startRecording,
    stopRecording,
    secondsToTime,

    loadingMessages,
    fetchOlderMessages,
    hasMoreMessages,
    isFetchingOlderMessages,
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

  const computeStickyDate = React.useCallback(() => {
    const root = messagesContainerRef.current

    if (!root) return

    const y = root.scrollTop + 8

    const entries = Object.entries(dateRefs.current)
      .filter(([, element]) => element !== null)
      .sort((a, b) => {
        const first = a[1]?.offsetTop ?? 0
        const second = b[1]?.offsetTop ?? 0

        return first - second
      })

    let current: string | null = null

    for (const [label, element] of entries) {
      if (element && element.offsetTop <= y) {
        current = label
        continue
      }

      break
    }

    if (!current && entries.length) {
      current = entries[0][0]
    }

    setStickyDate(current)
  }, [])

  const autoResizeTextarea = React.useCallback(() => {
    const textarea = textAreaRef.current

    if (!textarea) return

    textarea.style.height = "auto"

    const maxHeight = 120
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight)

    textarea.style.height = `${nextHeight}px`
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? "auto" : "hidden"
  }, [textAreaRef])

  const loadOlderMessages = React.useCallback(async () => {
    const root = messagesContainerRef.current

    if (!root) return
    if (!hasMoreMessages) return
    if (isFetchingOlderMessages) return
    if (loadingOlderRef.current) return

    loadingOlderRef.current = true

    const previousScrollHeight = root.scrollHeight
    const previousScrollTop = root.scrollTop

    await fetchOlderMessages()

    requestAnimationFrame(() => {
      const nextScrollHeight = root.scrollHeight
      const heightDifference = nextScrollHeight - previousScrollHeight

      root.scrollTop = previousScrollTop + heightDifference
      loadingOlderRef.current = false
    })
  }, [fetchOlderMessages, hasMoreMessages, isFetchingOlderMessages])

  useEffect(() => {
    if (flyoutOpen && !loaded) void load()
  }, [flyoutOpen, loaded, load])

  useEffect(() => {
    setConversationId(Number(conversationId ?? 0))
    setUserId(Number(userId))

    return () => {
      setConversationId(0)
      setUserId(0)
    }
  }, [conversationId, setConversationId, setUserId, userId])

  useEffect(() => {
    const root = messagesContainerRef.current

    if (!root) return

    const onScroll = () => {
      computeStickyDate()

      const atBottom = isAtBottom(root)

      shouldAutoScrollRef.current = atBottom
      setShowScrollButton(!atBottom)

      if (root.scrollTop <= SCROLL_TOP_THRESHOLD) {
        void loadOlderMessages()
      }
    }

    root.addEventListener("scroll", onScroll, { passive: true })
    requestAnimationFrame(onScroll)

    return () => root.removeEventListener("scroll", onScroll)
  }, [computeStickyDate, loadOlderMessages])

  useEffect(() => {
    dateRefs.current = {}
    requestAnimationFrame(computeStickyDate)
  }, [visibleMessages.length, computeStickyDate])

  useEffect(() => {
    autoResizeTextarea()
  }, [text, autoResizeTextarea])

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const emoji = emojiData.emoji
    const textarea = textAreaRef.current

    if (!textarea) {
      setText(text + emoji)
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const nextText = text.slice(0, start) + emoji + text.slice(end)

    setSelectedOption(null)
    setText(nextText)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.selectionStart = start + emoji.length
      textarea.selectionEnd = start + emoji.length
      autoResizeTextarea()
    })
  }

  const handleSendNow = React.useCallback(
    async (txt: string) => {
      setSelectedOption(txt)
      setEmojiOpen(false)
      await handleSend()
    },
    [setSelectedOption, handleSend]
  )

  useEffect(() => {
    const sendQuick = async (txt: string) => {
      if (txt.trim()) {
        await handleSendNow(txt)
      }
    }

    window.__CHAT_SEND_QUICK__ = sendQuick

    const onEvt = (event: Event) => {
      const customEvent = event as CustomEvent<{ text?: string }>
      const txt = customEvent.detail?.text

      if (typeof txt === "string") {
        void sendQuick(txt)
      }
    }

    window.addEventListener("chat:sendQuick", onEvt as EventListener)

    return () => {
      delete window.__CHAT_SEND_QUICK__
      window.removeEventListener("chat:sendQuick", onEvt as EventListener)
    }
  }, [handleSendNow])

  useEffect(() => {
    const root = messagesContainerRef.current
    const composer = composerRef.current

    if (!root || !composer) return

    const setVar = () => {
      root.style.setProperty("--composer-h", `${composer.offsetHeight}px`)
    }

    setVar()

    const resizeObserver = new ResizeObserver(setVar)

    resizeObserver.observe(composer)
    window.addEventListener("resize", setVar)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("resize", setVar)
    }
  }, [])

  useEffect(() => {
    const root = messagesContainerRef.current

    if (!root) return

    const conversationChanged = lastConversationIdRef.current !== conversationId

    if (conversationChanged) {
      lastConversationIdRef.current = conversationId

      requestAnimationFrame(() => {
        root.scrollTop = root.scrollHeight
        setShowScrollButton(false)
        shouldAutoScrollRef.current = true
      })

      return
    }

    if (loadingOlderRef.current || isFetchingOlderMessages) return

    if (shouldAutoScrollRef.current) {
      requestAnimationFrame(() => {
        root.scrollTop = root.scrollHeight
        setShowScrollButton(false)
      })
    }
  }, [conversationId, visibleMessages.length, isFetchingOlderMessages])

  useEffect(() => {
    if (isRecording) {
      setEmojiOpen(false)
    }
  }, [isRecording])

  const scrollToBottom = () => {
    const root = messagesContainerRef.current

    if (!root) return

    root.scrollTo({ top: root.scrollHeight, behavior: "auto" })
    setShowScrollButton(false)
    shouldAutoScrollRef.current = true
  }

  const handleInsertToComposer = (txt: string) => {
    const glue = text.trim().length ? (text.endsWith(" ") ? "" : " ") : ""

    setSelectedOption(null)
    setText(text + glue + txt)

    requestAnimationFrame(() => {
      textAreaRef.current?.focus()
      autoResizeTextarea()
    })
  }

  const onJumpToReplied = (message: ChatMessageView) => {
    const id = message.repliedMessageId ?? message.repliedMessage?.messageId

    if (!id) return

    scrollToMessage(Number(id))
  }

  const showEmpty = !conversationId

  if (showEmpty) {
    return (
      <div className="chat-window__empty">
        <div className="chat-window__empty-icon">
          <MessageSquareMore size={64} />
        </div>

        <h3 className="chat-window__empty-title">
          Ninguna conversación seleccionada
        </h3>

        <p className="chat-window__empty-text">
          Selecciona una conversación para chatear.
        </p>
      </div>
    )
  }

  const canType = !!conversationId && !sending && conversationStatus !== "Closed"
  const hasAudioToSend = Number(recordingTime ?? 0) > 0

  const onStartRecord = async () => {
    if (!canType) return

    setEmojiOpen(false)
    await startRecording()
  }

  const onStopRecord = async () => {
    if (!canType) return

    await stopRecording()
  }

  const onClearRecord = () => {
    clearRecording()
    focusTextarea()
  }

  const onSendRecord = async () => {
    if (!canType || !hasAudioToSend) return

    setEmojiOpen(false)
    await handleSendAudio()
    focusTextarea()
  }

  const onSendTextOrFile = async () => {
    setEmojiOpen(false)
    await handleSend()

    requestAnimationFrame(() => {
      autoResizeTextarea()
    })
  }

  return (
    <div className="chat-window">
      {searchTerm && (
        <div className="chat-window__searchbar">
          <input
            className="chat-window__searchbar-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar en la conversación…"
          />

          <div className="chat-window__searchbar-meta">
            <span>
              {matchIds.length ? `${matchIndex + 1}/${matchIds.length}` : "0/0"}
            </span>

            <button onClick={() => gotoMatch(-1)} disabled={!matchIds.length}>
              ◀
            </button>

            <button onClick={() => gotoMatch(1)} disabled={!matchIds.length}>
              ▶
            </button>

            <button onClick={() => setSearchTerm("")}>✕</button>
          </div>
        </div>
      )}

      <div
        className="chat-window__messages"
        onDoubleClick={focusTextarea}
        ref={messagesContainerRef}
      >
        {isFetchingOlderMessages && (
          <div className="chat-window__loading-older">
            Cargando mensajes anteriores...
          </div>
        )}

        {!hasMoreMessages && visibleMessages.length > 0 && (
          <div className="chat-window__loading-older">
            No hay más mensajes anteriores
          </div>
        )}

        {loadingMessages && visibleMessages.length === 0 && (
          <div className="chat-window__loading-older">Cargando mensajes...</div>
        )}

        {stickyDate && (
          <div className="chat-window__sticky-date">
            <span className="chat-window__date-text chat-window__date-text--dark">
              {stickyDate}
            </span>
          </div>
        )}

        {visibleMessages.map((message, index) => {
          const viewMessage = message as ChatMessageView
          const sentAt = formatTime(message.sentAt)
          const isCurrentUser = message.senderUserId === userId
          const previousMessage = index > 0 ? visibleMessages[index - 1] : null
          const showSender =
            !previousMessage ||
            previousMessage.senderUserId !== message.senderUserId

          const label = getConversationStringDate(message.sentAt)
          const previousLabel = previousMessage
            ? getConversationStringDate(previousMessage.sentAt)
            : null

          const showDivider = !previousMessage || label !== previousLabel
          const isIncomingFromContact = !isCurrentUser

          const contacts = viewMessage.contact ?? []
          const isContactMessage =
            message.messageType === "Contact" || contacts.length > 0

          const repliedMessage = viewMessage.repliedMessage ?? null
          const replyThumb = getReplyThumb(repliedMessage)

          return (
            <React.Fragment key={message.messageId}>
              {showDivider && (
                <div
                  className="chat-window__date-divider"
                  ref={(element) => {
                    if (element) {
                      dateRefs.current[label] = element
                    }
                  }}
                >
                  <span className="chat-window__date-text chat-window__date-text--dark">
                    {label}
                  </span>
                </div>
              )}

              <div
                className="chat-window_message-group_container"
                onDoubleClick={() => {
                  beginReply(message)
                  focusTextarea()
                }}
              >
                <div
                  ref={registerMessageRef(message.messageId)}
                  className={
                    highlightedId === message.messageId
                      ? `${getMessagePosition(message)} chat-window__message--highlighted`
                      : getMessagePosition(message)
                  }
                >
                  {showSender && !isCurrentUser && (
                    <div className="chat-window__message-sender">
                      {message.senderContactId
                        ? message.senderContactName || "Cliente"
                        : !message.incognitoMode
                          ? message.senderUserName || ""
                          : ""}
                    </div>
                  )}

                  <div
                    className={getMessageClassName(message)}
                    {...(isIncomingFromContact
                      ? {
                          onPointerDown: (event: React.PointerEvent) =>
                            startLongPress(event, message),
                          onPointerUp: cancelLongPress,
                          onPointerLeave: cancelLongPress,
                          onPointerCancel: cancelLongPress,
                        }
                      : { onDoubleClick: focusTextarea })}
                    style={
                      message.messageSourceId === 1
                        ? {
                            backgroundColor:
                              message.messageSourceColor ?? "#fff",
                            color: "#fff",
                          }
                        : {}
                    }
                  >
                    <div className="chat-window__message-content">
                      {repliedMessage && (
                        <button
                          type="button"
                          className="chat-window__reply-preview"
                          onClick={() => onJumpToReplied(viewMessage)}
                          title="Ir al mensaje citado"
                        >
                          <div className="chat-window__reply-author">
                            {getReplyAuthor(repliedMessage)}
                          </div>

                          <div className="chat-window__reply-row">
                            {replyThumb ? (
                              <img
                                src={replyThumb}
                                alt="thumb"
                                className="chat-window__reply-thumb-img"
                                loading="lazy"
                              />
                            ) : (
                              <span className="chat-window__reply-ico">
                                {getReplyIcon(repliedMessage) ?? ""}
                              </span>
                            )}

                            <span className="chat-window__reply-text">
                              {getReplyPreview(repliedMessage)}
                            </span>
                          </div>
                        </button>
                      )}

                      {isContactMessage && (
                        <div className="chat-window__contact-list">
                          {contacts.map((contact, contactIndex) => {
                            const phone = contact.phones?.[0] ?? null

                            const key =
                              phone?.phone ||
                              contact.name?.formatted_name ||
                              `${message.messageId}-${contactIndex}`

                            return (
                              <div
                                key={key}
                                className="chat-window__media chat-window__contact-card"
                              >
                                <div className="chat-window__contact-icon">
                                  👤
                                </div>

                                <div className="chat-window__contact-info">
                                  <p className="chat-window__contact-name">
                                    {contact.name?.formatted_name || "Contacto"}
                                  </p>

                                  {phone?.phone && (
                                    <p className="chat-window__contact-phone">
                                      {phone.phone}

                                      {phone.type ? (
                                        <span className="chat-window__contact-type">
                                          {" "}
                                          ({phone.type})
                                        </span>
                                      ) : null}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {!isContactMessage && message.attachments?.length ? (
                        <div className="chat-window__media">
                          {(message.attachments[0].mimeType?.startsWith(
                            "image/"
                          ) ||
                            message.attachments[0].mimeType ===
                              "image/webp") && (
                            <div className="chat-window__media-image">
                              <div className="chat-window__image-container">
                                <img
                                  src={message.attachments[0].mediaUrl}
                                  alt={
                                    message.attachments[0].fileName || "Imagen"
                                  }
                                  className="chat-window__image"
                                  loading="lazy"
                                  decoding="async"
                                  draggable={false}
                                  onClick={() => {
                                    const mediaUrl =
                                      message.attachments?.[0]?.mediaUrl

                                    if (mediaUrl) {
                                      openImagePreview(mediaUrl)
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {message.attachments[0].mimeType?.startsWith(
                            "video/"
                          ) && (
                            <div className="chat-window__media-video">
                              <video
                                controls
                                className="chat-window__video"
                                src={message.attachments[0].mediaUrl}
                              >
                                Tu navegador no soporta el elemento video.
                              </video>
                            </div>
                          )}

                          {message.attachments[0].mimeType?.startsWith(
                            "audio/"
                          ) && (
                            <div className="chat-window__media-audio">
                              <div className="chat-window__audio-container">
                                <div className="chat-window__audio-icon">🎵</div>

                                <div className="chat-window__audio-info">
                                  <div className="chat-window__audio-name">
                                    {message.attachments[0].fileName || "Audio"}
                                  </div>

                                  <audio
                                    controls
                                    className="chat-window__audio-player"
                                    src={message.attachments[0].mediaUrl}
                                  >
                                    Tu navegador no soporta el elemento audio.
                                  </audio>
                                </div>
                              </div>
                            </div>
                          )}

                          {message.messageType === "Document" && (
                            <div className="chat-window__media-document">
                              <a
                                href={message.attachments[0].mediaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="chat-window__document-link"
                              >
                                <div className="chat-window__document-icon">
                                  {getFileIcon(
                                    message.attachments[0].mimeType || ""
                                  )}
                                </div>

                                <div className="chat-window__document-info">
                                  <div className="chat-window__document-name">
                                    {message.attachments[0].fileName ||
                                      "Documento"}
                                  </div>

                                  <div className="chat-window__document-size">
                                    {message.attachments[0].mimeType ||
                                      "Archivo"}
                                  </div>
                                </div>

                                <div className="chat-window__document-download">
                                  <Download size={16} />
                                </div>
                              </a>
                            </div>
                          )}

                          {hasText(message) && (
                            <div className="chat-window__message-caption">
                              {renderMessageContent(
                                String(message.content ?? ""),
                                searchTerm
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        hasText(message) && (
                          <div className="chat-window__message-text">
                            {renderMessageContent(
                              String(message.content ?? ""),
                              searchTerm
                            )}
                          </div>
                        )
                      )}
                    </div>

                    <div className="chat-window__message-info">
                      <span className="chat-window__message-time">{sentAt}</span>

                      {getStatusIcon(message, isCurrentUser)}
                    </div>
                  </div>
                </div>
              </div>
            </React.Fragment>
          )
        })}

        <div ref={bottomRef} className="butttonRef" style={{ height: 1 }} />

        {showScrollButton && (
          <button
            className="chat-window__scroll-button"
            onClick={scrollToBottom}
            title="Bajar al último mensaje"
          >
            <FaArrowDown className="chat-window__scroll-buttonIcon" />
          </button>
        )}
      </div>

      <div className="chat-window__composer" ref={composerRef}>
        <label
          htmlFor="file-upload"
          className="chat-window__composer-attachment"
          aria-label="Adjuntar archivo"
        >
          <Paperclip size={20} />
        </label>

        <input
          id="file-upload"
          ref={fileInputRef}
          type="file"
          className="chat-window__composer-file-input"
          onChange={handleFileChange}
          disabled={
            !conversationId ||
            sending ||
            conversationStatus === "Closed" ||
            isRecording
          }
        />

        {file && (
          <div className="chat-window__composer-file-preview">
            <span className="chat-window__composer-file-name">{file.name}</span>

            <button
              className="chat-window__composer-file-remove"
              onClick={() => setFile(null)}
              aria-label="Eliminar archivo"
              type="button"
            >
              ×
            </button>
          </div>
        )}

        <div className="chat-window__composer-input-container">
          {replyTo && (
            <div className="chat-window__reply-pill">
              <div className="chat-window__reply-pill-text">
                Respondiendo a {replyTo.author}
              </div>

              <button
                type="button"
                onClick={() => scrollToMessage(replyTo.messageId)}
                className="chat-window__reply-pill-jump"
                title="Ir al mensaje citado"
              >
                {replyTo.preview}
              </button>

              <button
                onClick={cancelReply}
                className="chat-window__reply-pill-close"
                type="button"
              >
                ✕
              </button>
            </div>
          )}

          <div className="chat-window__composer-input-container__divisor">
            <div
              className="custom_messages__container"
              ref={smsBtnRef}
              onClick={() => setFlyoutOpen(true)}
              title="Mensajes personalizados"
            >
              <SmsIcon className="custom_messages__icon" />
            </div>

            <textarea
              ref={textAreaRef}
              className="chat-window__composer-input"
              placeholder={isRecording ? "Grabando..." : "Escribe un mensaje…"}
              value={text}
              autoCapitalize="sentences"
              lang="es"
              spellCheck={true}
              autoFocus
              disabled={isRecording}
              onChange={(e) => {
                setSelectedOption(null)
                setText(e.target.value)
              }}
              onKeyDown={onComposerKeyDown}
              onPaste={handlePaste}
              rows={1}
            />
          </div>

          {flyoutOpen && (
            <div className="cmf-layer">
              <div
                className="cmf-backdrop"
                onClick={() => setFlyoutOpen(false)}
              />

              <CustomMessagesFlyout
                anchorRect={null}
                open={flyoutOpen}
                onClose={() => setFlyoutOpen(false)}
                items={customMessages}
                loading={loading}
                error={error}
                onCreate={create}
                onUpdate={update}
                onToggle={toggleSystemParam}
                onInsertToComposer={handleInsertToComposer}
                onSendNow={handleSendNow}
              />
            </div>
          )}
        </div>

        <div className="chat-window__composer-audio">
          <div className="chat-window__emoji-container">
            <button
              type="button"
              className="chat-window__emoji-btn"
              onClick={() => setEmojiOpen((prev) => !prev)}
              disabled={!canType || isRecording}
              title="Agregar emoji"
            >
              {!emojiOpen ? (
                <BsEmojiLaughing fontSize={18} />
              ) : (
                <IoCloseSharp fontSize={18} />
              )}
            </button>

            {emojiOpen && (
              <div className="chat-window__emoji-picker">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  searchDisabled={false}
                  skinTonesDisabled={false}
                  previewConfig={{ showPreview: false }}
                  height={360}
                  width={320}
                />
              </div>
            )}
          </div>

          <div
            className={`chat-window__audio-timer ${
              isRecording ? "audio-timer__recording" : ""
            }`}
          >
            {hasAudioToSend ? secondsToTime(recordingTime) : ""}
          </div>

          {!isRecording && !hasAudioToSend && (
            <button
              type="button"
              className="chat-window__audio-btn"
              onClick={onStartRecord}
              disabled={!canType}
              title="Grabar audio"
            >
              <Mic size={24} className="chat-window__audio-icons" />
            </button>
          )}

          {isRecording && (
            <button
              type="button"
              className="chat-window__audio-btn chat-window__audio-btn--stop"
              onClick={onStopRecord}
              disabled={!canType}
              title="Detener"
            >
              <Square size={18} />
            </button>
          )}

          {!isRecording && hasAudioToSend && (
            <>
              <button
                type="button"
                className="chat-window__audio-btn chat-window__audio-btn--send"
                onClick={onSendRecord}
                disabled={!canType}
                title="Enviar audio"
              >
                <Check size={18} />
              </button>

              <button
                type="button"
                className="chat-window__audio-btn chat-window__audio-btn--trash"
                onClick={onClearRecord}
                title="Eliminar audio"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>

        <button
          className="chat-window__composer-send"
          onClick={onSendTextOrFile}
          disabled={
            !conversationId ||
            sending ||
            (!text.trim() && !file) ||
            conversationStatus === "Closed" ||
            isRecording
          }
          aria-label="Enviar mensaje"
          type="button"
        >
          <Send size={18} />
        </button>
      </div>

      {ismaximize && previewImageUrl && (
        <div
          className="chat-window__image-preview-overlay"
          onClick={closeImagePreview}
        >
          <img
            src={previewImageUrl}
            alt="Vista previa"
            className="chat-window__image-preview-full"
          />
        </div>
      )}
    </div>
  )
}