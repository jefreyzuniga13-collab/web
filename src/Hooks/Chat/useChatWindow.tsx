import type { MessageDto } from "@/Interfaces/Chat/ChatInterfaces"
import { DownloadMedia, sendMedia, sendText } from "@/Services/MessageService"
import { Check, CheckCheck } from "lucide-react"
import { useEffect, useRef, useState, type ChangeEvent } from "react"
import useMessages from "@/Hooks/useMessages"

export const useChatWindow = () => {
  const [conversationId, setConversationId] = useState<number>(0)
  const [userId, setUserId] = useState<number>(0)
  const messages = useMessages(conversationId)

  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [ismaximize, setismaximize] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (file) return
    const clipboardItems = Array.from(e.clipboardData.items)
    for (const item of clipboardItems) {
      if (item.kind === 'file') {
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = async () => {
    if (!conversationId || sending) return
    setSending(true)
    try {
      if (file) {
        await sendMedia(conversationId, file, text.trim() || undefined)
        setFile(null)
        setText('')
        if (fileInputRef.current) fileInputRef.current.value = ''
      } else if (text.trim()) {
        await sendText({
          conversationId,
          senderId: userId,
          content: text.trim(),
          messageType: 'Text'
        })
        setText('')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const handleDownload = async ( fileName: string) => {
    try {
      const response = DownloadMedia(fileName);

      const blob = new Blob([(await response).data])
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = fileName || 'archivo'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error descargando archivo:', error)
    }
  }

  const getStatusIcon = (m: MessageDto, isOut: boolean) => {
    if (!isOut) return null
    if (m.readAt)
      return <CheckCheck size={14} className="chat-window__message-status chat-window__message-status--read" />
    if (m.deliveredAt)
      return <CheckCheck size={14} className="chat-window__message-status chat-window__message-status--delivered" />
    if (m.status === 'Sent')
      return <Check size={14} className="chat-window__message-status chat-window__message-status--sent" />
    return null
  }

  const getMessageClassName = (m: MessageDto) => {
    if (m.senderContactId) {
      return 'chat-window__message chat-window__message--incoming'
    } else if (m.senderUserId && m.senderUserId !== userId) {
      return 'chat-window__message chat-window__message--agent'
    } else {
      return 'chat-window__message chat-window__message--outgoing'
    }
  }

  const getMessagePosition = (m: MessageDto) => {
    if (m.senderUserId === userId) {
      return 'chat-window__message-group chat-window__message-group--outgoing'
    } else {
      return 'chat-window__message-group chat-window__message-group--incoming'
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType.startsWith('video/')) return '🎥'
    if (mimeType.startsWith('audio/')) return '🎵'
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️'
    return '📎'
  }

  const openImagePreview = (url: string) => {
    setPreviewImageUrl(url)
    setismaximize(true)
  }

  const closeImagePreview = () => {
    setPreviewImageUrl(null)
    setismaximize(false)
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
  }
}