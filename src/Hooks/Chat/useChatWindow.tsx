/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react"
import { Check, CheckCheck } from "lucide-react"
import { toast } from "react-toastify"
import type { MessageDto } from "@/Interfaces/Chat/ChatInterfaces"
import {
  DownloadMedia,
  sendMedia,
  sendText,
} from "@/Services/chat/MessageService"
import useMessages from "@/Hooks/Chat/useMessages"
import { useAudioRecorder } from "@/Hooks/Chat/useAudioRecorder"

type ReplyTarget = {
  messageId: number
  externalId: string
  author: string
  preview: string
}

type UseChatWindowArgs = {
  conversationId?: number
  userId?: number
  conversationStatus?: string | null
  selectedParam?: unknown
  highlightTerm?: string
}

export const useChatWindow = (
  args: UseChatWindowArgs = {},
  validFrom?: Date | null,
  validTo?: Date | null
) => {
  const LONG_PRESS_MS = 400

  const [conversationId, setConversationId] = useState<number>(
    Number(args.conversationId ?? 0)
  )
  const [userId, setUserId] = useState<number>(Number(args.userId ?? 0))

  const messages = useMessages(validFrom, validTo, conversationId)

  const [text, setText] = useState("")
  const [selectedOptionState, _setSelectedOption] = useState<string | null>(null)
  const selectedOptionRef = useRef<string | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [ismaximize, setismaximize] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const longPressTimerRef = useRef<number | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  const [quickMenuOpen, setQuickMenuOpen] = useState(false)
  const [quickMenuPos, setQuickMenuPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  })
  const [quickMenuMsg, setQuickMenuMsg] = useState<MessageDto | null>(null)

  const [highlightedId, setHighlightedId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>(
    (args.highlightTerm ?? "").trim()
  )
  const [matchIndex, setMatchIndex] = useState(0)
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null)

  const {
    isRecording,
    audioBlob,
    recordingTime,
    startRecording,
    stopRecording,
    clearRecording,
  } = useAudioRecorder()

  const hasMedia = useCallback((message: MessageDto) => {
    return (message.attachments?.length ?? 0) > 0
  }, [])

  const hasText = useCallback((message: MessageDto) => {
    return (
      typeof message.content === "string" &&
      message.content.trim().length > 0
    )
  }, [])

  const setSelectedOption = useCallback((option: string | null) => {
    selectedOptionRef.current = option
    _setSelectedOption(option)
  }, [])

  useEffect(() => {
    setConversationId(Number(args.conversationId ?? 0))
    setUserId(Number(args.userId ?? 0))
  }, [args.conversationId, args.userId])

  useEffect(() => {
    setSearchTerm((args.highlightTerm ?? "").trim())
  }, [args.highlightTerm])

  useEffect(() => {
    // Limpia estados propios al cambiar de conversación.
    setText("")
    setFile(null)
    setReplyTo(null)
    setSelectedOption(null)
    setQuickMenuOpen(false)
    setQuickMenuMsg(null)
    setHighlightedId(null)
    setMatchIndex(0)
    setismaximize(false)
    setPreviewImageUrl(null)
    messageRefs.current.clear()

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [args.conversationId, setSelectedOption])

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!popoverRef.current) return

      if (!popoverRef.current.contains(event.target as Node)) {
        setQuickMenuOpen(false)
        setQuickMenuMsg(null)
      }
    }

    if (quickMenuOpen) {
      document.addEventListener("mousedown", onClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", onClickOutside)
    }
  }, [quickMenuOpen])

  const quickOptions: string[] = useMemo(() => {
    const param = args.selectedParam as any

    if (Array.isArray(param)) {
      return param.filter((value: any) => typeof value === "string")
    }

    if (typeof param === "string") {
      try {
        const parsed = JSON.parse(param)

        if (Array.isArray(parsed)) {
          return parsed.filter((value: any) => typeof value === "string")
        }
      } catch {
        return param
          .split("|")
          .map((value) => value.trim())
          .filter(Boolean)
      }
    }

    if (typeof param?.value === "string") {
      try {
        const parsed = JSON.parse(param.value)

        if (Array.isArray(parsed)) {
          return parsed.filter((value: any) => typeof value === "string")
        }
      } catch {
        return String(param.value)
          .split("|")
          .map((value: string) => value.trim())
          .filter(Boolean)
      }
    }

    if (Array.isArray(param?.value)) {
      return param.value.filter((value: any) => typeof value === "string")
    }

    return []
  }, [args.selectedParam])

  const visibleMessages = useMemo(() => {
    return messages.filter(
      (message) =>
        hasMedia(message) ||
        hasText(message) ||
        message.messageType === "Interactive" ||
        message.messageType === "Contact"
    )
  }, [messages, hasMedia, hasText])

  useEffect(() => {
    const element = bottomRef.current

    if (element?.isConnected) {
      element.scrollIntoView({ block: "end" })
    }
  }, [conversationId, visibleMessages.length])

  const registerMessageRef = useCallback(
    (id: number) => (element: HTMLDivElement | null) => {
      if (element) {
        messageRefs.current.set(id, element)
        return
      }

      messageRefs.current.delete(id)
    },
    []
  )

  const scrollToMessage = useCallback((id?: number) => {
    if (!id) return

    const element = messageRefs.current.get(id)

    if (!element) return

    element.scrollIntoView({ behavior: "smooth", block: "center" })
    setHighlightedId(id)

    window.setTimeout(() => {
      setHighlightedId(null)
    }, 1600)
  }, [])

  const handleSendAudio = useCallback(async () => {
    if (!conversationId || sending || !audioBlob) return

    // Valida límite permitido por Meta.
    if (audioBlob.size > 16 * 1024 * 1024) {
      toast.error("El audio supera el tamaño máximo permitido (16 MB).")
      return
    }

    setSending(true)

    try {
      const fileName = `audio_${Date.now()}.mp3`
      const audioFile = new File([audioBlob], fileName, {
        type: "audio/mpeg",
      })

      await sendMedia(conversationId, audioFile, "")
      clearRecording()
    } catch (error) {
      console.error(error)
      toast.error("No se pudo enviar el audio.")
    } finally {
      setSending(false)
    }
  }, [audioBlob, clearRecording, conversationId, sending])

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]

    if (!selectedFile) return

    let maxSize = 16 * 1024 * 1024
    let errorMsg = "El archivo supera el límite permitido."

    if (selectedFile.type.startsWith("application/")) {
      maxSize = 100 * 1024 * 1024
      errorMsg = "Los documentos no pueden superar 100MB."
    } else if (
      selectedFile.type.startsWith("image/") ||
      selectedFile.type.startsWith("video/")
    ) {
      maxSize = 16 * 1024 * 1024
      errorMsg = "Las imágenes y videos no pueden superar 16MB."
    } else if (selectedFile.type === "image/webp") {
      if (selectedFile.size > 100 * 1024 && selectedFile.size <= 500 * 1024) {
        maxSize = 500 * 1024
        errorMsg = "Los stickers animados no pueden superar 500KB."
      } else {
        maxSize = 100 * 1024
        errorMsg = "Los stickers estáticos no pueden superar 100KB."
      }
    }

    if (selectedFile.size > maxSize) {
      toast.warn(errorMsg)
      event.target.value = ""
      return
    }

    setFile(selectedFile)
  }, [])

  const beginReply = useCallback((message: MessageDto) => {
    const externalId = (message as any).externalId || null

    if (!externalId) return

    const author =
      message.senderContactName || message.senderUserName || "Mensaje"

    const preview =
      (typeof message.content === "string" && message.content.trim()) ||
      message.attachments?.[0]?.fileName ||
      (message.attachments?.[0]?.mimeType?.startsWith("image/")
        ? "[Imagen]"
        : message.attachments?.[0]?.mimeType?.startsWith("video/")
          ? "[Video]"
          : message.attachments?.[0]?.mimeType?.startsWith("audio/")
            ? "[Audio]"
            : message.messageType === "Document"
              ? "[Documento]"
              : "[Adjunto]")

    setReplyTo({
      messageId: message.messageId,
      externalId,
      author,
      preview,
    })
  }, [])

  const cancelReply = useCallback(() => {
    setReplyTo(null)
  }, [])

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      if (file) return

      const clipboardItems = Array.from(event.clipboardData.items)

      for (const item of clipboardItems) {
        if (item.kind !== "file") continue

        const pastedFile = item.getAsFile()

        if (!pastedFile) continue

        event.preventDefault()
        setFile(pastedFile)
        break
      }
    },
    [file]
  )

  const highlightText = useCallback((value: string, term: string) => {
    const cleanTerm = term.trim()

    if (!cleanTerm) return value

    const regex = new RegExp(
      `(${cleanTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "ig"
    )

    return value.split(regex).map((part, index) =>
      index % 2 === 1 ? (
        <mark key={index} className="chat-window__hl">
          {part}
        </mark>
      ) : (
        <React.Fragment key={index}>{part}</React.Fragment>
      )
    )
  }, [])

  const renderMessageContent = useCallback(
    (content: string, term: string) => {
      const urlRegex = /(https?:\/\/[^\s]+)/g
      const parts = content.split(urlRegex)

      return parts.map((part, index) => {
        const isUrl = /^https?:\/\/[^\s]+$/.test(part)

        if (isUrl) {
          return (
            <a
              key={`url-${index}`}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#8595f0ff",
                textDecoration: "underline",
              }}
            >
              {part}
            </a>
          )
        }

        return (
          <React.Fragment key={`txt-${index}`}>
            {highlightText(part, term)}
          </React.Fragment>
        )
      })
    },
    [highlightText]
  )

  const handleSend = useCallback(
    async (fileOverride?: File | null, textOverride?: string) => {
      if (!conversationId || sending) return

      const fileToSend = fileOverride ?? file
      const messageText = (textOverride ?? text).trim()
      const quickText = (selectedOptionRef.current ?? "").trim()

      if (!fileToSend && !messageText && !quickText) return

      setSending(true)

      try {
        const replyExternalId = replyTo?.externalId || null
        const repliedParentMessageId = replyTo?.messageId ?? null

        if (fileToSend) {
          await sendMedia(
            conversationId,
            fileToSend,
            messageText || undefined,
            replyExternalId,
            repliedParentMessageId
          )

          setFile(null)
          setText("")
          setReplyTo(null)

          if (fileInputRef.current) {
            fileInputRef.current.value = ""
          }

          return
        }

        if (quickText) {
          await sendText({
            conversationId,
            senderId: userId,
            content: quickText,
            messageType: "Text",
            externalId: replyExternalId,
            repliedParentMessageId,
          })

          setSelectedOption(null)
          setReplyTo(null)
          return
        }

        await sendText({
          conversationId,
          senderId: userId,
          content: messageText,
          messageType: "Text",
          externalId: replyExternalId,
          repliedParentMessageId,
        })

        setText("")
        setReplyTo(null)
      } finally {
        setSending(false)
      }
    },
    [
      conversationId,
      file,
      replyTo,
      sending,
      setSelectedOption,
      text,
      userId,
    ]
  )

  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key !== "Enter" || event.shiftKey) return

      event.preventDefault()
      void handleSend()
    },
    [handleSend]
  )

  const handleDownload = useCallback(async (fileName: string) => {
    try {
      const response = DownloadMedia(fileName)
      const blob = new Blob([(await response).data])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")

      link.href = url
      link.download = fileName || "archivo"

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      window.URL.revokeObjectURL(url)
    } catch {
      toast.error("No se pudo descargar el archivo.")
    }
  }, [])

  const getStatusIcon = useCallback((message: MessageDto, isOut: boolean) => {
    if (!isOut) return null

    if (message.readAt) {
      return (
        <CheckCheck
          size={14}
          className="chat-window__message-status chat-window__message-status--read"
        />
      )
    }

    if (message.deliveredAt) {
      return (
        <CheckCheck
          size={14}
          className="chat-window__message-status chat-window__message-status--delivered"
        />
      )
    }

    if (message.status === "Sent") {
      return (
        <Check
          size={14}
          className="chat-window__message-status chat-window__message-status--sent"
        />
      )
    }

    return null
  }, [])

  const getMessageClassName = useCallback(
    (message: MessageDto) => {
      if (message.senderContactId) {
        return "chat-window__message chat-window__message--incoming"
      }

      if (message.senderUserId && message.senderUserId !== userId) {
        return message.isAutoSend
          ? "chat-window__message chat-window__message--agent chat-window__message--autoSend"
          : "chat-window__message chat-window__message--agent"
      }

      return "chat-window__message chat-window__message--outgoing"
    },
    [userId]
  )

  const getMessagePosition = useCallback(
    (message: MessageDto) => {
      if (message.senderUserId === userId) {
        return "chat-window__message-group chat-window__message-group--outgoing"
      }

      return "chat-window__message-group chat-window__message-group--incoming"
    },
    [userId]
  )

  const getFileIcon = useCallback((mimeType: string) => {
    if (mimeType.startsWith("image/")) return "🖼️"
    if (mimeType.startsWith("video/")) return "🎥"
    if (mimeType.startsWith("audio/")) return "🎵"
    if (mimeType.includes("pdf")) return "📄"
    if (mimeType.includes("word") || mimeType.includes("document")) return "📝"
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "📊"

    if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) {
      return "📽️"
    }

    return "📎"
  }, [])

  const openImagePreview = useCallback((url: string) => {
    setPreviewImageUrl(url)
    setismaximize(true)
  }, [])

  const closeImagePreview = useCallback(() => {
    setPreviewImageUrl(null)
    setismaximize(false)
  }, [])

  const getCustomoMessageByAgent = useCallback(async () => {
    toast.info("Cargando respuestas rápidas…")
  }, [])

  const sendQuickNow = useCallback(
    async (message: MessageDto, option: string) => {
      try {
        await sendText({
          conversationId: Number(conversationId),
          senderId: Number(userId),
          content: option,
          messageType: "Text",
          externalId: (message as any)?.externalId ?? null,
          repliedParentMessageId: message.messageId,
        })
      } finally {
        setSelectedOption(null)
        cancelReply()
        setQuickMenuOpen(false)
      }
    },
    [cancelReply, conversationId, setSelectedOption, userId]
  )

  const sendQuick = useCallback(
    (option: string) => {
      if (quickMenuMsg) {
        void sendQuickNow(quickMenuMsg, option)
        return
      }

      setSelectedOption(option)
      void handleSend()
    },
    [handleSend, quickMenuMsg, sendQuickNow, setSelectedOption]
  )

  const startLongPress = useCallback(
    (event: React.PointerEvent, message: MessageDto) => {
      const rect = (event.target as HTMLElement).getBoundingClientRect()
      const x = (event as any).clientX ?? rect.left + rect.width / 2
      const y = (event as any).clientY ?? rect.top

      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current)
      }

      longPressTimerRef.current = window.setTimeout(() => {
        setQuickMenuPos({ x, y })
        setQuickMenuMsg(message)
        setQuickMenuOpen(true)
      }, LONG_PRESS_MS) as unknown as number
    },
    []
  )

  const cancelLongPress = useCallback(() => {
    if (!longPressTimerRef.current) return

    window.clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = null
  }, [])

  const focusTextarea = useCallback(() => {
    textAreaRef.current?.focus()
  }, [])

  useEffect(() => {
    const onGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return

      if (replyTo) {
        event.preventDefault()
        cancelReply()
        return
      }

      if (file) {
        event.preventDefault()
        setFile(null)
      }
    }

    window.addEventListener("keydown", onGlobalKeyDown)

    return () => {
      window.removeEventListener("keydown", onGlobalKeyDown)
    }
  }, [cancelReply, file, replyTo])

  const onComposerKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> =
    useCallback(
      (event) => {
        if (event.key === "Escape") {
          if (replyTo) {
            event.preventDefault()
            cancelReply()
            return
          }

          if (file) {
            event.preventDefault()
            setFile(null)
            return
          }
        }

        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault()
          void handleSend()
        }
      },
      [cancelReply, file, handleSend, replyTo]
    )

  useEffect(() => {
    const onGlobalEnter = (event: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement | null
      const isTyping =
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.tagName === "INPUT" ||
        activeElement?.getAttribute("contenteditable") === "true"

      if (
        event.key === "Enter" &&
        !event.shiftKey &&
        file &&
        !sending &&
        conversationId &&
        args.conversationStatus !== "Closed" &&
        !isTyping
      ) {
        event.preventDefault()
        void handleSend()
      }
    }

    window.addEventListener("keydown", onGlobalEnter)

    return () => {
      window.removeEventListener("keydown", onGlobalEnter)
    }
  }, [args.conversationStatus, conversationId, file, handleSend, sending])

  const visibleState = useMemo(
    () => ({
      quickMenuOpen,
      quickMenuPos,
      quickMenuMsg,
    }),
    [quickMenuMsg, quickMenuOpen, quickMenuPos]
  )

  const matchIds = useMemo(() => {
    const term = searchTerm.toLowerCase()

    if (!term) return []

    return visibleMessages
      .filter(
        (message) =>
          hasText(message) &&
          (message.content ?? "").toLowerCase().includes(term)
      )
      .map((message) => message.messageId)
  }, [hasText, searchTerm, visibleMessages])

  useEffect(() => {
    if (!matchIds.length) {
      setMatchIndex(0)
      return
    }

    setMatchIndex(0)

    requestAnimationFrame(() => {
      scrollToMessage(matchIds[0])
    })
  }, [matchIds, scrollToMessage])

  const gotoMatch = useCallback(
    (direction: 1 | -1) => {
      if (!matchIds.length) return

      const nextIndex =
        (matchIndex + direction + matchIds.length) % matchIds.length

      setMatchIndex(nextIndex)
      scrollToMessage(matchIds[nextIndex])
      setHighlightedId(matchIds[nextIndex])
    },
    [matchIds, matchIndex, scrollToMessage]
  )

  const secondsToTime = useCallback((totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    const paddedHours = String(hours).padStart(2, "0")
    const paddedMinutes = String(minutes).padStart(2, "0")
    const paddedSeconds = String(seconds).padStart(2, "0")

    return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`
  }, [])

  return {
    setConversationId,
    setUserId,
    messages,
    text,
    setText,
    file,
    setFile,
    sending,
    setSending,
    handleSend,
    bottomRef,
    fileInputRef,
    handleFileChange,
    handlePaste,
    handleKeyPress,
    handleDownload,
    getStatusIcon,
    getMessageClassName,
    getMessagePosition,
    getFileIcon,
    ismaximize,
    setismaximize,
    previewImageUrl,
    openImagePreview,
    closeImagePreview,

    // Audio.
    isRecording,
    audioBlob,
    recordingTime,
    startRecording,
    stopRecording,
    secondsToTime,
    clearRecording,
    handleSendAudio,

    visibleMessages,
    hasMedia,
    hasText,
    setSelectedOption,
    selectedOption: selectedOptionState,
    beginReply,
    cancelReply,
    replyTo,
    getCustomoMessageByAgent,
    quickOptions,
    sendQuick,
    startLongPress,
    cancelLongPress,
    focusTextarea,
    onComposerKeyDown,
    popoverRef,
    textAreaRef,
    registerMessageRef,
    scrollToMessage,
    highlightedId,
    visibleState,

    // Búsqueda.
    searchTerm,
    setSearchTerm,
    matchIds,
    matchIndex,
    gotoMatch,
    highlightText,
    renderMessageContent,
  }
}