import type { MessageDto } from "@/Interfaces/Chat/ChatInterfaces"
import { DownloadMedia, sendMedia, sendText } from "@/Services/MessageService"
import { Check, CheckCheck } from "lucide-react"
import {CustomMessageServices} from '@/Services/Config/CustomMessageServices'
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react"
import useMessages from "@/Hooks/useMessages"
import { useAudioRecorder } from "@/Hooks/Chat/useAudioRecorder";
import { toast } from "react-toastify"
import type { CustomMessage } from "@/Interfaces/Setting/CustomMessage"

type ReplyTarget = {
  messageId: number
  externalId: string
  author: string
  preview: string
}

export const useChatWindow = () => {
  const [conversationId, setConversationId] = useState<number>(0)
  const [userId, setUserId] = useState<number>(0)
  const messages = useMessages(conversationId)

  const [text, setText] = useState('')
  const [selectedOptionState, _setSelectedOption] = useState<string | null>(null)
  const selectedOptionRef = useRef<string | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [ismaximize, setismaximize] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)

  const [customMessages, setCustomMessages] = useState<CustomMessage[] | null>(null)
  const [loadingCustomMessage, setLoadingCustomMessage] = useState<boolean>(false)

  const hasMedia = (m: MessageDto) => (m.attachments?.length ?? 0) > 0;
  const hasText = (m: MessageDto) =>
    typeof m.content === "string" && m.content.trim().length > 0;

  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    isRecording,
    audioBlob,
    recordingTime,
    startRecording,
    stopRecording,
    clearRecording
  } = useAudioRecorder();

  const handleSendAudio = async () => {
    if (!conversationId || sending || !audioBlob) return;
    setSending(true);
    try {
      const mime = audioBlob.type || 'audio/webm'
      const ext =
        mime.includes('ogg') ? 'ogg' :
        mime.includes('webm') ? 'webm' :
        mime.includes('mpeg') ? 'mp3' :
        (mime.includes('mp4') || mime.includes('aac')) ? 'm4a' : 'bin'
      const audioFile = new File([audioBlob], `grabacion.${ext}`, { type: mime })
      await sendMedia(conversationId, audioFile, "")
      clearRecording()
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const visibleMessages = useMemo(
    () => messages.filter((m) => 
       hasMedia(m) 
      || hasText(m) 
      || m.messageType === "Interactive"),
    [messages]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [visibleMessages])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    let maxSize = 16 * 1024 * 1024 // default: 16MB
    let errorMsg = "El archivo supera el límite permitido."

    if (file.type.startsWith("application/")) {
      maxSize = 100 * 1024 * 1024
      errorMsg = "Los documentos no pueden superar 100MB."
    } else if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      maxSize = 16 * 1024 * 1024
      errorMsg = "Las imágenes y videos no pueden superar 16MB."
    } else if (file.type === "image/webp") {
      // Stickers (WhatsApp usa .webp)
      // Está en estático o animado según tamaño esperado
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

  // Comienza reply desde un mensaje (requiere que el mensaje traiga externalId de WhatsApp)
  const beginReply = (m: MessageDto) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extId = (m as any).externalId || null

    if (!extId) return // sin wamid no hay reply real

    const author = m.senderContactName || m.senderUserName || 'Mensaje'

    const preview =
      (typeof m.content === 'string' && m.content.trim()) ||
      m.attachments?.[0]?.fileName ||
      (m.attachments?.[0]?.mimeType?.startsWith('image/') ? '[Imagen]' :
      m.attachments?.[0]?.mimeType?.startsWith('video/') ? '[Video]' :
      m.attachments?.[0]?.mimeType?.startsWith('audio/') ? '[Audio]' :
      m.messageType === 'Document' ? '[Documento]' :
      '[Adjunto]')

    setReplyTo({ messageId: m.messageId, externalId: extId, author, preview })
    // Opcional: enfocar textarea desde componente
  }

  const cancelReply = () => setReplyTo(null)

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
  const handleSend = useCallback(async () => {
  if (!conversationId || sending) return
  setSending(true)
  try {
    const msg = text.trim()
    const quick = (selectedOptionRef.current ?? '').trim()
    if (!file && !msg && !quick) return

    const replyExternalId = replyTo?.externalId || null
    const repliedParentMessageId = replyTo?.messageId ?? null

    if (file) {
      await sendMedia(
        conversationId,
        file,
        msg || undefined,
        replyExternalId,
        repliedParentMessageId        //id interno del padre
      )
      setFile(null)
      setText('')
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      fileInputRef.current && (fileInputRef.current.value = '')
      setReplyTo(null)
      return
    }

    if (quick) {
      await sendText({
        conversationId,
        senderId: userId,
        content: quick,
        messageType: 'Text',
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
        messageType: 'Text',
        externalId: replyExternalId,
        repliedParentMessageId
      })
      setText('')
      setReplyTo(null)
    }
  } catch (err) {
    console.error(err)
  } finally {
    setSending(false)
  }
}, [conversationId, file, sending, text, userId, replyTo])

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

  //Recuperar los mensaje por agente
  const getCustomoMessageByAgent = useCallback(
    async ()  => {
       try{
        setLoadingCustomMessage(true)
          const resp = await CustomMessageServices.getCustomoMessageByAgent();
          setCustomMessages(resp)

      // eslint-disable-next-line no-empty
      }catch{
        
      }finally{
        setLoadingCustomMessage(false);
      }
    },
    [],
  )
  


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
    getCustomoMessageByAgent, //Motrar opciones de mensajes personalizados
    customMessages,
    loadingCustomMessage,
    
    //reply mensajes
      beginReply,
      cancelReply,
      replyTo,

  }
}