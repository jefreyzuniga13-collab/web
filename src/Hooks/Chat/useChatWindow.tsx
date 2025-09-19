/* eslint-disable @typescript-eslint/no-explicit-any */
import type { MessageDto } from "@/Interfaces/Chat/ChatInterfaces"
import { DownloadMedia, sendMedia, sendText } from "@/Services/MessageService"
import { Check, CheckCheck } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react"
import useMessages from "@/Hooks/useMessages"
import { useAudioRecorder } from "@/Hooks/Chat/useAudioRecorder"
import { toast } from "react-toastify"
import React from "react"

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

export const useChatWindow = (args: UseChatWindowArgs = {}) => {
  const LONG_PRESS_MS = 400

  const [conversationId, setConversationId] = useState<number>(Number(args.conversationId ?? 0))
  const [userId, setUserId] = useState<number>(Number(args.userId ?? 0))
  const messages = useMessages(conversationId)

  const [text, setText] = useState("")
  const [selectedOptionState, _setSelectedOption] = useState<string | null>(null)
  const selectedOptionRef = useRef<string | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [ismaximize, setismaximize] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)

  const hasMedia = (m: MessageDto) => (m.attachments?.length ?? 0) > 0
  const hasText = (m: MessageDto) => typeof m.content === "string" && m.content.trim().length > 0

  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { isRecording, audioBlob, recordingTime, startRecording, stopRecording, clearRecording } = useAudioRecorder()

  const [quickMenuOpen, setQuickMenuOpen] = useState(false)
  const [quickMenuPos, setQuickMenuPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [quickMenuMsg, setQuickMenuMsg] = useState<MessageDto | null>(null)

  const longPressTimerRef = useRef<number | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)

  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const [highlightedId, setHighlightedId] = useState<number | null>(null)

const [searchTerm, setSearchTerm] = useState<string>((args.highlightTerm ?? "").trim());
useEffect(() => { setSearchTerm((args.highlightTerm ?? "").trim()) }, [args.highlightTerm]);

//const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const registerMessageRef = (id: number) => (el: HTMLDivElement | null) => {
    if (el) messageRefs.current.set(id, el)
    else messageRefs.current.delete(id)
  }

  const scrollToMessage = (id?: number) => {
    if (!id) return
    const el = messageRefs.current.get(id)
    if (!el) return
    el.scrollIntoView({ behavior: "smooth", block: "center" })
    setHighlightedId(id)
    window.setTimeout(() => setHighlightedId(null), 1600)
  }

  useEffect(() => {
    setConversationId(Number(args.conversationId ?? 0))
    setUserId(Number(args.userId ?? 0))
  }, [args.conversationId, args.userId])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!popoverRef.current) return
      if (!popoverRef.current.contains(e.target as Node)) {
        setQuickMenuOpen(false)
        setQuickMenuMsg(null)
      }
    }
    if (quickMenuOpen) document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [quickMenuOpen])

  const quickOptions: string[] = useMemo(() => {
    const p = args.selectedParam as any
    if (Array.isArray(p)) return p.filter((v: any) => typeof v === "string")
    if (typeof p === "string") {
      try {
        const parsed = JSON.parse(p)
        if (Array.isArray(parsed)) return parsed.filter((v: any) => typeof v === "string")
      } catch {
        return String(p)
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean)
      }
    }
    if (typeof p?.value === "string") {
      try {
        const parsed = JSON.parse(p.value)
        if (Array.isArray(parsed)) return parsed.filter((v: any) => typeof v === "string")
      } catch {
        return String(p.value)
          .split("|")
          .map((s: string) => s.trim())
          .filter(Boolean)
      }
    }
    if (Array.isArray(p?.value)) return p.value.filter((v: any) => typeof v === "string")
    return []
  }, [args.selectedParam])

  const handleSendAudio = async () => {
    if (!conversationId || sending || !audioBlob) return
    setSending(true)
    try {
      const mime = audioBlob.type || "audio/webm"
      const ext = mime.includes("ogg") ? "ogg" : mime.includes("webm") ? "webm" : mime.includes("mpeg") ? "mp3" : mime.includes("mp4") || mime.includes("aac") ? "m4a" : "bin"
      const audioFile = new File([audioBlob], `grabacion.${ext}`, { type: mime })
      await sendMedia(conversationId, audioFile, "")
      clearRecording()
    } finally {
      setSending(false)
    }
  }

  const visibleMessages = useMemo(
    () => messages.filter((m) => hasMedia(m) || hasText(m) || m.messageType === "Interactive"),
    [messages]
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" })
  }, [visibleMessages])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    let maxSize = 16 * 1024 * 1024
    let errorMsg = "El archivo supera el límite permitido."
    if (file.type.startsWith("application/")) {
      maxSize = 100 * 1024 * 1024
      errorMsg = "Los documentos no pueden superar 100MB."
    } else if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      maxSize = 16 * 1024 * 1024
      errorMsg = "Las imágenes y videos no pueden superar 16MB."
    } else if (file.type === "image/webp") {
      if (file.size > 100 * 1024 && file.size <= 500 * 1024) {
        maxSize = 500 * 1024
        errorMsg = "Los stickers animados no pueden superar 500KB."
      } else {
        maxSize = 100 * 1024
        errorMsg = "Los stickers estáticos no pueden superar 100KB."
      }
    }
    if (file.size > maxSize) {
      toast.warn(errorMsg)
      e.target.value = ""
      return
    }
    setFile(file)
  }

  const setSelectedOption = (opt: string | null) => {
    selectedOptionRef.current = opt
    _setSelectedOption(opt)
  }

  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null)

  const beginReply = (m: MessageDto) => {
    const extId = (m as any).externalId || null
    if (!extId) return
    const author = m.senderContactName || m.senderUserName || "Mensaje"
    const preview =
      (typeof m.content === "string" && m.content.trim()) ||
      m.attachments?.[0]?.fileName ||
      (m.attachments?.[0]?.mimeType?.startsWith("image/") ? "[Imagen]" : m.attachments?.[0]?.mimeType?.startsWith("video/") ? "[Video]" : m.attachments?.[0]?.mimeType?.startsWith("audio/") ? "[Audio]" : m.messageType === "Document" ? "[Documento]" : "[Adjunto]")
    setReplyTo({ messageId: m.messageId, externalId: extId, author, preview })
  }

  const cancelReply = () => setReplyTo(null)

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (file) return
    const clipboardItems = Array.from(e.clipboardData.items)
    for (const item of clipboardItems) {
      if (item.kind === "file") {
        const pastedFile = item.getAsFile()
        if (pastedFile) {
          e.preventDefault()
          setFile(pastedFile)
          break
        }
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = useCallback(async () => {
    if (!conversationId || sending) return
    setSending(true)
    try {
      const msg = text.trim()
      const quick = (selectedOptionRef.current ?? "").trim()
      if (!file && !msg && !quick) return
      const replyExternalId = replyTo?.externalId || null
      const repliedParentMessageId = replyTo?.messageId ?? null
      if (file) {
        await sendMedia(conversationId, file, msg || undefined, replyExternalId, repliedParentMessageId)
        setFile(null)
        setText("")
        if (fileInputRef.current) fileInputRef.current.value = ""
        setReplyTo(null)
        return
      }
      if (quick) {
        await sendText({
          conversationId,
          senderId: userId,
          content: quick,
          messageType: "Text",
          externalId: replyExternalId,
          repliedParentMessageId
        })
        setSelectedOption(null)
        setReplyTo(null)
        return
      }
      if (msg) {
        await sendText({
          conversationId,
          senderId: userId,
          content: msg,
          messageType: "Text",
          externalId: replyExternalId,
          repliedParentMessageId
        })
        setText("")
        setReplyTo(null)
      }
    } finally {
      setSending(false)
    }
  }, [conversationId, file, sending, text, userId, replyTo])

  const handleDownload = async (fileName: string) => {
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
    // eslint-disable-next-line no-empty
    } catch { }
  }

  const getStatusIcon = (m: MessageDto, isOut: boolean) => {
    if (!isOut) return null
    if (m.readAt) return <CheckCheck size={14} className="chat-window__message-status chat-window__message-status--read" />
    if (m.deliveredAt) return <CheckCheck size={14} className="chat-window__message-status chat-window__message-status--delivered" />
    if (m.status === "Sent") return <Check size={14} className="chat-window__message-status chat-window__message-status--sent" />
    return null
  }

  const getMessageClassName = (m: MessageDto) => {
    if (m.senderContactId) return "chat-window__message chat-window__message--incoming"
    if (m.senderUserId && m.senderUserId !== userId) return "chat-window__message chat-window__message--agent"
    return "chat-window__message chat-window__message--outgoing"
  }

  const getMessagePosition = (m: MessageDto) => {
    if (m.senderUserId === userId) return "chat-window__message-group chat-window__message-group--outgoing"
    return "chat-window__message-group chat-window__message-group--incoming"
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return "🖼️"
    if (mimeType.startsWith("video/")) return "🎥"
    if (mimeType.startsWith("audio/")) return "🎵"
    if (mimeType.includes("pdf")) return "📄"
    if (mimeType.includes("word") || mimeType.includes("document")) return "📝"
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "📊"
    if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return "📽️"
    return "📎"
  }

  const openImagePreview = (url: string) => {
    setPreviewImageUrl(url)
    setismaximize(true)
  }

  const closeImagePreview = () => {
    setPreviewImageUrl(null)
    setismaximize(false)
  }

  const getCustomoMessageByAgent = async () => {
    toast.info("Cargando respuestas rápidas…")
  }

  const sendQuickNow = async (msg: MessageDto, opt: string) => {
    try {
      await sendText({
        conversationId: Number(conversationId),
        senderId: Number(userId),
        content: opt,
        messageType: "Text",
        externalId: (msg as any)?.externalId ?? null,
        repliedParentMessageId: msg.messageId
      })
    } finally {
      setSelectedOption(null)
      cancelReply()
      setQuickMenuOpen(false)
    }
  }

  const sendQuick = (opt: string) => {
    if (quickMenuMsg) void sendQuickNow(quickMenuMsg, opt)
    else {
      setSelectedOption(opt)
      handleSend()
    }
  }

  const startLongPress = (e: React.PointerEvent, msg: MessageDto) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const x = (e as any).clientX ?? rect.left + rect.width / 2
    const y = (e as any).clientY ?? rect.top
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = window.setTimeout(() => {
      setQuickMenuPos({ x, y })
      setQuickMenuMsg(msg)
      setQuickMenuOpen(true)
    }, LONG_PRESS_MS) as unknown as number
  }

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const focusTextarea = () => {
    textAreaRef.current?.focus()
  }

  useEffect(() => {
    const onGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (replyTo) {
          e.preventDefault()
          cancelReply()
        } else if (file) {
          e.preventDefault()
          setFile(null)
        }
      }
    }
    window.addEventListener("keydown", onGlobalKeyDown)
    return () => window.removeEventListener("keydown", onGlobalKeyDown)
  }, [replyTo, file])

  const onComposerKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Escape") {
      if (replyTo) {
        e.preventDefault()
        cancelReply()
        return
      }
      if (file) {
        e.preventDefault()
        setFile(null)
        return
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
      return
    }
    handleKeyPress(e)
  }

  useEffect(() => {
    const onGlobalEnter = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null
      const isTyping = el?.tagName === "TEXTAREA" || el?.tagName === "INPUT" || el?.getAttribute("contenteditable") === "true"
      if (e.key === "Enter" && !e.shiftKey && file && !sending && conversationId && args.conversationStatus !== "Closed") {
        if (!isTyping) {
          e.preventDefault()
          handleSend()
        }
      }
    }
    window.addEventListener("keydown", onGlobalEnter)
    return () => window.removeEventListener("keydown", onGlobalEnter)
  }, [file, sending, conversationId, args.conversationStatus, handleSend])

  const visibleState = {
    quickMenuOpen,
    quickMenuPos,
    quickMenuMsg
  }

  const matchIds = useMemo(() => {
  const term = searchTerm.toLowerCase();
  if (!term) return [];
  return visibleMessages
    .filter(m => hasText(m) && (m.content ?? "").toLowerCase().includes(term))
    .map(m => m.messageId);
}, [visibleMessages, searchTerm]);

const [matchIndex, setMatchIndex] = useState(0);

useEffect(() => {
  if (matchIds.length) {
    setMatchIndex(0);
    scrollToMessage(matchIds[0]);       // auto-scroll a la primera coincidencia
  }
}, [matchIds]);

const gotoMatch = (dir: 1 | -1) => {
  if (!matchIds.length) return;
  const next = (matchIndex + dir + matchIds.length) % matchIds.length;
  setMatchIndex(next);
  scrollToMessage(matchIds[next]);
  setHighlightedId(matchIds[next]);
};

  const highlightText = (text: string, term: string) => {
  const t = term.trim()
  if (!t) return text
  const re = new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig")
    return text.split(re).map((part, i) =>
      i % 2 === 1
        ? <mark key={i} className="chat-window__hl">{part}</mark>
        : <React.Fragment key={i}>{part}</React.Fragment>
    )
  }

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
    isRecording,
    audioBlob,
    recordingTime,
    startRecording,
    stopRecording,
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

    //Buscar texto
    searchTerm,
    setSearchTerm,
    matchIds,
    matchIndex,
    gotoMatch,
    highlightText
  }
}