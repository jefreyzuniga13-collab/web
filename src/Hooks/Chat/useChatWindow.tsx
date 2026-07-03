import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react"
import { Check, CheckCheck, CircleX, Clock3 } from "lucide-react"
import { toast } from "react-toastify"
import type {
  AttachmentDto,
  MessageDto,
  MessageType,
} from "@/Interfaces/Chat/ChatInterfaces"
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
  agentId?: number
  conversationStatus?: string | null
  selectedParam?: unknown
  highlightTerm?: string
}

type QuickParamObject = {
  value?: unknown
}

type MessageWithExternal = MessageDto & {
  externalId?: string | null
}

const LONG_PRESS_MS = 400
const AUDIO_MAX_SIZE = 16 * 1024 * 1024

const isObject = (value: unknown): value is QuickParamObject => {
  return typeof value === "object" && value !== null
}

const parseQuickOptions = (param: unknown): string[] => {
  if (Array.isArray(param)) {
    return param.filter((value): value is string => typeof value === "string")
  }

  if (typeof param === "string") {
    try {
      const parsed: unknown = JSON.parse(param)

      if (Array.isArray(parsed)) {
        return parsed.filter(
          (value): value is string => typeof value === "string"
        )
      }
    } catch {
      return param
        .split("|")
        .map((value) => value.trim())
        .filter(Boolean)
    }
  }

  if (!isObject(param)) return []

  const value = param.value

  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value)

      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string")
      }
    } catch {
      return value
        .split("|")
        .map((item) => item.trim())
        .filter(Boolean)
    }
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string")
  }

  return []
}

const getExternalId = (message: MessageDto): string | null => {
  return (message as MessageWithExternal).externalId ?? null
}

const getMessagePreview = (message: MessageDto): string => {
  const content = message.content?.trim()

  if (content) return content

  const attachment = message.attachments?.[0]

  if (attachment?.fileName) return attachment.fileName
  if (attachment?.mimeType?.startsWith("image/")) return "[Imagen]"
  if (attachment?.mimeType?.startsWith("video/")) return "[Video]"
  if (attachment?.mimeType?.startsWith("audio/")) return "[Audio]"

  if (message.messageType === "Document") return "[Documento]"

  return "[Adjunto]"
}

const getMediaMessageType = (file: File): MessageType => {
  if (file.type.startsWith("image/")) {
    if (file.type === "image/webp") return "Sticker"

    return "Image"
  }

  if (file.type.startsWith("video/")) return "Video"
  if (file.type.startsWith("audio/")) return "Audio"

  return "Document"
}

const getLocalTempId = () => {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const normalizeText = (value?: string | null) => {
  return String(value ?? "").trim()
}

const normalizeName = (value?: string | null) => {
  return String(value ?? "")
    .trim()
    .toLowerCase()
}

const buildLocalAttachment = (
  file: File,
  messageId: number,
  mediaUrl: string
): AttachmentDto => {
  return {
    attachmentId: messageId,
    messageId,
    mediaId: "",
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    mediaUrl,
    createdAt: new Date().toISOString(),
  }
}

const isOutgoingByCurrentUser = (message: MessageDto, userId: number) => {
  if (message.senderContactId) return false
  if (message.isIncoming) return false

  if (message.senderUserId && message.senderUserId !== userId) {
    return false
  }

  return true
}

const isCompatibleMessageType = (
  serverMessage: MessageDto,
  localMessage: MessageDto
) => {
  if (serverMessage.messageType === localMessage.messageType) return true

  const localAttachment = localMessage.attachments?.[0]
  const serverAttachment = serverMessage.attachments?.[0]

  if (!localAttachment || !serverAttachment) return false

  const localMime = localAttachment.mimeType ?? ""
  const serverMime = serverAttachment.mimeType ?? ""

  if (localMime.startsWith("image/") && serverMime.startsWith("image/")) {
    return true
  }

  if (localMime.startsWith("video/") && serverMime.startsWith("video/")) {
    return true
  }

  if (localMime.startsWith("audio/") && serverMime.startsWith("audio/")) {
    return true
  }

  if (
    localMessage.messageType === "Document" ||
    serverMessage.messageType === "Document"
  ) {
    return true
  }

  return false
}

const isSameServerMessage = (
  serverMessage: MessageDto,
  localMessage: MessageDto,
  currentUserId: number
) => {
  if (serverMessage.isLocal) return false
  if (!localMessage.isLocal) return false

  if (serverMessage.conversationId !== localMessage.conversationId) {
    return false
  }

  if (!isOutgoingByCurrentUser(serverMessage, currentUserId)) {
    return false
  }

  if (!isOutgoingByCurrentUser(localMessage, currentUserId)) {
    return false
  }

  if (!isCompatibleMessageType(serverMessage, localMessage)) {
    return false
  }

  const serverText = normalizeText(serverMessage.content)
  const localText = normalizeText(localMessage.content)

  if (serverText !== localText) {
    return false
  }

  const localAttachment = localMessage.attachments?.[0]
  const serverAttachment = serverMessage.attachments?.[0]

  if (!localAttachment) return true

  if (!serverAttachment) return false

  const localMime = localAttachment.mimeType ?? ""
  const serverMime = serverAttachment.mimeType ?? ""

  if (localMime && serverMime) {
    if (localMime.startsWith("image/") && serverMime.startsWith("image/")) {
      return true
    }

    if (localMime.startsWith("video/") && serverMime.startsWith("video/")) {
      return true
    }

    if (localMime.startsWith("audio/") && serverMime.startsWith("audio/")) {
      return true
    }
  }

  const localName = normalizeName(localAttachment.fileName)
  const serverName = normalizeName(serverAttachment.fileName)

  if (localName && serverName && localName === serverName) {
    return true
  }

  return localMessage.messageType === serverMessage.messageType
}

const sortServerMessages = (items: MessageDto[]) => {
  return [...items].sort((a, b) => {
    const idA = Number(a.messageId ?? 0)
    const idB = Number(b.messageId ?? 0)

    if (idA !== idB) return idA - idB

    return String(a.sentAt ?? "").localeCompare(String(b.sentAt ?? ""))
  })
}

const sortLocalMessages = (items: MessageDto[]) => {
  return [...items].sort((a, b) => {
    const aId = Math.abs(Number(a.messageId ?? 0))
    const bId = Math.abs(Number(b.messageId ?? 0))

    if (aId !== bId) return aId - bId

    return String(a.clientTempId ?? "").localeCompare(String(b.clientTempId ?? ""))
  })
}

export const useChatWindow = (
  args: UseChatWindowArgs = {},
  validFrom: Date | null = null,
  validTo: Date | null = null
) => {
  const [conversationId, setConversationId] = useState<number>(
    Number(args.conversationId ?? 0)
  )

  const [userId, setUserId] = useState<number>(Number(args.userId ?? 0))
  const agentId = Number(args.agentId ?? 0)

  const {
    messages,
    loading: loadingMessages,
    error: messagesError,
    fetchOlderMessages,
    hasMoreMessages,
    isFetchingOlderMessages,
  } = useMessages(validFrom, validTo, agentId, conversationId)

  const [localMessages, setLocalMessages] = useState<MessageDto[]>([])
  const localObjectUrlsRef = useRef<Map<string, string>>(new Map())

  const [text, setText] = useState("")
  const [selectedOptionState, setSelectedOptionState] = useState<string | null>(
    null
  )

  const selectedOptionRef = useRef<string | null>(null)
  const sendingRef = useRef(false)

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
    return typeof message.content === "string" && message.content.trim() !== ""
  }, [])

  const setSelectedOption = useCallback((option: string | null) => {
    selectedOptionRef.current = option
    setSelectedOptionState(option)
  }, [])

  const updateLocalMessage = useCallback(
    (
      clientTempId: string,
      patch: Partial<Pick<MessageDto, "localStatus" | "status" | "localError">>
    ) => {
      if (!clientTempId) return

      setLocalMessages((prev) =>
        prev.map((item) =>
          item.clientTempId === clientTempId ? { ...item, ...patch } : item
        )
      )
    },
    []
  )

  const removeDuplicatedLocalMessages = useCallback(
    (serverItems: MessageDto[]) => {
      if (!serverItems.length) return

      setLocalMessages((prev) => {
        const duplicatedIds = new Set(
          prev
            .filter((localMessage) =>
              serverItems.some((serverMessage) =>
                isSameServerMessage(serverMessage, localMessage, userId)
              )
            )
            .map((message) => message.clientTempId)
            .filter((id): id is string => Boolean(id))
        )

        if (!duplicatedIds.size) return prev

        prev.forEach((message) => {
          if (!message.clientTempId) return
          if (!duplicatedIds.has(message.clientTempId)) return

          const objectUrl = localObjectUrlsRef.current.get(message.clientTempId)

          if (objectUrl) {
            URL.revokeObjectURL(objectUrl)
            localObjectUrlsRef.current.delete(message.clientTempId)
          }
        })

        return prev.filter(
          (message) =>
            !message.clientTempId || !duplicatedIds.has(message.clientTempId)
        )
      })
    },
    [userId]
  )

  const createLocalMessage = useCallback(
    (params: {
      content: string
      file?: File | null
      reply?: ReplyTarget | null
    }): MessageDto => {
      const clientTempId = getLocalTempId()
      const tempMessageId = -Date.now()
      const now = new Date().toISOString()

      let mediaUrl = ""
      let attachments: AttachmentDto[] = []
      let messageType: MessageType = "Text"

      if (params.file) {
        mediaUrl = URL.createObjectURL(params.file)
        localObjectUrlsRef.current.set(clientTempId, mediaUrl)
        attachments = [buildLocalAttachment(params.file, tempMessageId, mediaUrl)]
        messageType = getMediaMessageType(params.file)
      }

      return {
        messageId: tempMessageId,
        conversationId,
        senderUserId: userId,
        senderUserName: "",
        senderContactId: undefined,
        senderContactName: undefined,
        senderClientName: undefined,
        incognitoMode: false,
        isIncoming: false,
        content: params.content,
        externalId: "",
        messageType,
        interactiveId: undefined,
        isAutoSend: false,
        interactiveTitle: undefined,
        status: "Sent",
        sentAt: now,
        deliveredAt: undefined,
        readAt: undefined,
        attachments,
        waTemplateId: null,
        templateName: null,
        templateLanguage: null,
        templateBodyVars: null,
        repliedMessageId: params.reply?.messageId,
        repliedMessage: params.reply
          ? ({
              messageId: params.reply.messageId,
              conversationId,
              senderContactName: params.reply.author,
              content: params.reply.preview,
              externalId: params.reply.externalId,
              isIncoming: true,
              isAutoSend: false,
              messageType: "Text",
              status: "Sent",
              sentAt: now,
              attachments: [],
              contact: [],
            } as MessageDto)
          : null,
        messageSourceId: null,
        messageSourceName: null,
        messageSourceColor: null,
        contact: [],
        clientTempId,
        localStatus: "sending",
        isLocal: true,
      }
    },
    [conversationId, userId]
  )

  useEffect(() => {
    setConversationId(Number(args.conversationId ?? 0))
    setUserId(Number(args.userId ?? 0))
  }, [args.conversationId, args.userId])

  useEffect(() => {
    setSearchTerm((args.highlightTerm ?? "").trim())
  }, [args.highlightTerm])

  useEffect(() => {
    localObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    localObjectUrlsRef.current.clear()

    setLocalMessages([])
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

    sendingRef.current = false
    setSending(false)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [args.conversationId, setSelectedOption])

  useEffect(() => {
    return () => {
      localObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      localObjectUrlsRef.current.clear()
    }
  }, [])

  useEffect(() => {
    removeDuplicatedLocalMessages(messages)
  }, [messages, removeDuplicatedLocalMessages])

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

  const quickOptions = useMemo(() => {
    return parseQuickOptions(args.selectedParam)
  }, [args.selectedParam])

  const mergedMessages = useMemo(() => {
    const serverMessages = sortServerMessages(
      messages.filter((message) => !message.isLocal)
    )

    const validLocalMessages = localMessages.filter(
      (message) => message.conversationId === conversationId
    )

    const localWithoutDuplicated = validLocalMessages.filter(
      (localMessage) =>
        !serverMessages.some((serverMessage) =>
          isSameServerMessage(serverMessage, localMessage, userId)
        )
    )

    return [...serverMessages, ...sortLocalMessages(localWithoutDuplicated)]
  }, [conversationId, localMessages, messages, userId])

  const visibleMessages = useMemo(() => {
    return mergedMessages.filter(
      (message) =>
        hasMedia(message) ||
        hasText(message) ||
        message.messageType === "Interactive" ||
        message.messageType === "Contact"
    )
  }, [mergedMessages, hasMedia, hasText])

  useEffect(() => {
    const element = bottomRef.current

    if (element?.isConnected && !isFetchingOlderMessages) {
      element.scrollIntoView({ block: "end" })
    }
  }, [conversationId, visibleMessages.length, isFetchingOlderMessages])

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
    if (!conversationId || sendingRef.current || !audioBlob) return

    if (audioBlob.size > AUDIO_MAX_SIZE) {
      toast.error("El audio supera el tamaño máximo permitido (16 MB).")
      return
    }

    sendingRef.current = true

    const currentReply = replyTo
    const fileName = `audio_${Date.now()}.mp3`
    const audioFile = new File([audioBlob], fileName, {
      type: "audio/mpeg",
    })

    const localMessage = createLocalMessage({
      content: "",
      file: audioFile,
      reply: currentReply,
    })

    setLocalMessages((prev) => [...prev, localMessage])
    clearRecording()
    setReplyTo(null)
    setSending(true)

    try {
      await sendMedia(
        conversationId,
        audioFile,
        "",
        currentReply?.externalId ?? null,
        currentReply?.messageId ?? null
      )

      updateLocalMessage(localMessage.clientTempId ?? "", {
        localStatus: "sent",
        status: "Sent",
      })
    } catch (error) {
      console.error(error)

      updateLocalMessage(localMessage.clientTempId ?? "", {
        localStatus: "error",
        status: "Failed",
        localError: "No se pudo enviar el audio.",
      })

      toast.error("No se pudo enviar el audio.")
    } finally {
      sendingRef.current = false
      setSending(false)
    }
  }, [
    audioBlob,
    clearRecording,
    conversationId,
    createLocalMessage,
    replyTo,
    updateLocalMessage,
  ])

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
    const externalId = getExternalId(message)

    if (!externalId && !message.isLocal) return

    const author = message.senderContactName || message.senderUserName || "Mensaje"

    setReplyTo({
      messageId: message.messageId,
      externalId: externalId ?? "",
      author,
      preview: getMessagePreview(message),
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
      if (!conversationId || sendingRef.current) return

      const fileToSend = fileOverride ?? file
      const messageText = (textOverride ?? text).trim()
      const quickText = (selectedOptionRef.current ?? "").trim()
      const finalText = quickText || messageText

      if (!fileToSend && !finalText) return

      sendingRef.current = true

      const currentReply = replyTo

      const localMessage = createLocalMessage({
        content: finalText,
        file: fileToSend,
        reply: currentReply,
      })

      setLocalMessages((prev) => [...prev, localMessage])

      setText("")
      setFile(null)
      setReplyTo(null)
      setSelectedOption(null)

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      setSending(true)

      try {
        const replyExternalId = currentReply?.externalId ?? null
        const repliedParentMessageId = currentReply?.messageId ?? null

        if (fileToSend) {
          await sendMedia(
            conversationId,
            fileToSend,
            finalText || "",
            replyExternalId,
            repliedParentMessageId
          )

          updateLocalMessage(localMessage.clientTempId ?? "", {
            localStatus: "sent",
            status: "Sent",
          })

          return
        }

        await sendText({
          conversationId,
          senderId: userId,
          content: finalText,
          messageType: "Text",
          externalId: replyExternalId,
          repliedParentMessageId,
        })

        updateLocalMessage(localMessage.clientTempId ?? "", {
          localStatus: "sent",
          status: "Sent",
        })
      } catch (error) {
        console.error(error)

        updateLocalMessage(localMessage.clientTempId ?? "", {
          localStatus: "error",
          status: "Failed",
          localError: "No se pudo enviar el mensaje.",
        })

        toast.error("No se pudo enviar el mensaje.")
      } finally {
        sendingRef.current = false
        setSending(false)
      }
    },
    [
      conversationId,
      createLocalMessage,
      file,
      replyTo,
      setSelectedOption,
      text,
      updateLocalMessage,
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
      const response = await DownloadMedia(fileName)
      const blob = new Blob([response.data])
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

    if (message.localStatus === "sending") {
      return (
        <Clock3
          size={14}
          className="chat-window__message-status chat-window__message-status--sending"
        />
      )
    }

    if (message.localStatus === "error" || message.status === "Failed") {
      return (
        <CircleX
          size={15}
          className="chat-window__message-status chat-window__message-status--failed"
        />
      )
    }

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

    if (message.status === "Sent" || message.localStatus === "sent") {
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
      const failedClass =
        message.localStatus === "error" || message.status === "Failed"
          ? " chat-window__message--failed"
          : ""

      const sendingClass =
        message.localStatus === "sending"
          ? " chat-window__message--sending"
          : ""

      if (message.senderContactId || message.isIncoming) {
        return `chat-window__message chat-window__message--incoming${failedClass}${sendingClass}`
      }

      if (message.senderUserId && message.senderUserId !== userId) {
        return message.isAutoSend
          ? `chat-window__message chat-window__message--agent chat-window__message--autoSend${failedClass}${sendingClass}`
          : `chat-window__message chat-window__message--agent${failedClass}${sendingClass}`
      }

      return `chat-window__message chat-window__message--outgoing${failedClass}${sendingClass}`
    },
    [userId]
  )

  const getMessagePosition = useCallback(
    (message: MessageDto) => {
      if (!message.senderContactId && !message.isIncoming) {
        if (!message.senderUserId || message.senderUserId === userId) {
          return "chat-window__message-group chat-window__message-group--outgoing"
        }
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
      if (!conversationId || sendingRef.current) return
      if (!option.trim()) return

      sendingRef.current = true

      const externalId = getExternalId(message)

      setQuickMenuOpen(false)
      setQuickMenuMsg(null)

      const localMessage = createLocalMessage({
        content: option,
        reply: {
          messageId: message.messageId,
          externalId: externalId ?? "",
          author: message.senderContactName || message.senderUserName || "Mensaje",
          preview: getMessagePreview(message),
        },
      })

      setLocalMessages((prev) => [...prev, localMessage])
      setSending(true)

      try {
        await sendText({
          conversationId,
          senderId: userId,
          content: option,
          messageType: "Text",
          externalId,
          repliedParentMessageId: message.messageId,
        })

        updateLocalMessage(localMessage.clientTempId ?? "", {
          localStatus: "sent",
          status: "Sent",
        })
      } catch (error) {
        console.error(error)

        updateLocalMessage(localMessage.clientTempId ?? "", {
          localStatus: "error",
          status: "Failed",
          localError: "No se pudo enviar el mensaje.",
        })

        toast.error("No se pudo enviar el mensaje.")
      } finally {
        setSelectedOption(null)
        cancelReply()
        sendingRef.current = false
        setSending(false)
      }
    },
    [
      cancelReply,
      conversationId,
      createLocalMessage,
      setSelectedOption,
      updateLocalMessage,
      userId,
    ]
  )

  const sendQuick = useCallback(
    (option: string) => {
      if (quickMenuMsg) {
        void sendQuickNow(quickMenuMsg, option)
        return
      }

      setSelectedOption(option)
      void handleSend(null, option)
    },
    [handleSend, quickMenuMsg, sendQuickNow, setSelectedOption]
  )

  const startLongPress = useCallback(
    (event: React.PointerEvent, message: MessageDto) => {
      const rect = event.currentTarget.getBoundingClientRect()
      const x = event.clientX || rect.left + rect.width / 2
      const y = event.clientY || rect.top

      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current)
      }

      longPressTimerRef.current = window.setTimeout(() => {
        setQuickMenuPos({ x, y })
        setQuickMenuMsg(message)
        setQuickMenuOpen(true)
      }, LONG_PRESS_MS)
    },
    []
  )

  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current === null) return

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
        !sendingRef.current &&
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
  }, [args.conversationStatus, conversationId, file, handleSend])

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
          hasText(message) && (message.content ?? "").toLowerCase().includes(term)
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

    messages: mergedMessages,
    loadingMessages,
    messagesError,
    fetchOlderMessages,
    hasMoreMessages,
    isFetchingOlderMessages,

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

    searchTerm,
    setSearchTerm,
    matchIds,
    matchIndex,
    gotoMatch,
    highlightText,
    renderMessageContent,
  }
}