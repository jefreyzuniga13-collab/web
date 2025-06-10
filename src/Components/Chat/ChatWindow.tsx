import React, { useEffect, useState, useRef, type ChangeEvent } from 'react'
import { Send, Paperclip, Download, CheckCheck, Check, MessageSquareMore } from 'lucide-react'
import type { MessageDto } from '@/Interfaces/Chat/ChatInterfaces'
import '@/styles/Chat/ChatWindow.css'
import useMessages from '@/Hooks/useMessages'
import { sendMedia, sendText } from '@/Services/MessageService'

interface Props {
  conversationId?: number
  userId: number
}

export const ChatWindow: React.FC<Props> = ({ conversationId, userId }) => {
  const messages = useMessages(conversationId)
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Maneja cambios desde el input type="file"
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  // NUEVO: Maneja el pegado desde el portapapeles dentro del textarea
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Si ya hay un archivo en estado, no hacemos nada
    if (file) return

    const clipboardItems = Array.from(e.clipboardData.items)
    for (const item of clipboardItems) {
      // Solo nos interesan elementos que sean archivos
      if (item.kind === 'file') {
        const pastedFile = item.getAsFile()
        if (pastedFile) {
          e.preventDefault() // evitamos que el browser pegue texto extra
          setFile(pastedFile)
          // Si tu lógica quiere también agregar texto en el textarea, podrías concatenar:
          // setText(prev => prev + '\n[Archivo adjunto: ' + pastedFile.name + ']')
          break
        }
      }
    }
  }

  const handleSend = async () => {
    if (!conversationId || sending) return
    setSending(true)
    try {
      if (file) {
        // Si hay un archivo (ya sea adjuntado via input o pegado), lo enviamos
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

  // const handleDownload = async (mediaUrl: string, fileName: string) => {
  //   try {
  //     const response = await fetch(mediaUrl)
  //     const blob = await response.blob()
  //     const url = window.URL.createObjectURL(blob)
  //     const link = document.createElement('a')
  //     link.href = url
  //     link.download = fileName || 'archivo'
  //     document.body.appendChild(link)
  //     link.click()
  //     document.body.removeChild(link)
  //     window.URL.revokeObjectURL(url)
  //   } catch (error) {
  //     console.error('Error descargando archivo:', error)
  //   }
  // }

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

  if (!conversationId) {
    return (
      <div className="chat-window__empty">
        <div className="chat-window__empty-icon">
          <MessageSquareMore size={64} />
        </div>
        <h3 className="chat-window__empty-title">Ninguna conversación seleccionada</h3>
        <p className="chat-window__empty-text">Selecciona una conversación para chatear.</p>
      </div>
    )
  }

  return (
    <div className="chat-window">
      <div className="chat-window__messages">
        {messages.length > 0 && (
          <div className="chat-window__date-divider">
            <span className="chat-window__date-text">Hoy</span>
          </div>
        )}

        {messages.map((m, i) => {
          const isCurrentUser = m.senderUserId === userId
          const prev = i > 0 ? messages[i - 1] : null
          const showSender = !prev || prev.senderUserId !== m.senderUserId

          return (
            <div key={m.messageId} className={getMessagePosition(m)}>
              {showSender && !isCurrentUser && (
                <div className="chat-window__message-sender">
                  {m.senderContactId ? m.senderContactName || 'Cliente' : m.senderUserName || 'Sistema'}
                </div>
              )}

              <div className={getMessageClassName(m)}>
                <div className="chat-window__message-content">
                  {m.attachments?.length ? (
                    <div className="chat-window__media">
                      {/* Imágenes y Multimedia */}
                      {(m.attachments[0].mimeType?.startsWith('image/') ||
                        m.attachments[0].mimeType === 'image/webp') && (
                        <div className="chat-window__media-image">
                          <div className="chat-window__image-container">
                            <img
                              src={m.attachments[0].mediaUrl}
                              alt={m.attachments[0].fileName || 'Imagen'}
                              className="chat-window__image"
                              loading="lazy"
                            />
                            {/* <button
                              className="chat-window__download-btn"
                              onClick={() =>
                                handleDownload(m.attachments![0].mediaUrl!, m.attachments![0].fileName || 'imagen')
                              }
                              aria-label="Descargar imagen"
                            >
                              <Download size={16} />
                            </button> */}
                          </div>
                        </div>
                      )}

                      {m.attachments[0].mimeType?.startsWith('video/') && (
                        <div className="chat-window__media-video">
                          <video controls className="chat-window__video" src={m.attachments[0].mediaUrl} preload="metadata">
                            Tu navegador no soporta el elemento video.
                          </video>
                        </div>
                      )}

                      {m.attachments[0].mimeType?.startsWith('audio/') && (
                        <div className="chat-window__media-audio">
                          <div className="chat-window__audio-container">
                            <div className="chat-window__audio-icon">🎵</div>
                            <div className="chat-window__audio-info">
                              <div className="chat-window__audio-name">{m.attachments[0].fileName || 'Audio'}</div>
                              <audio
                                controls
                                className="chat-window__audio-player"
                                src={m.attachments[0].mediaUrl}
                                preload="metadata"
                              >
                                Tu navegador no soporta el elemento audio.
                              </audio>
                            </div>
                          </div>
                        </div>
                      )}

                      {m.messageType === 'Document' && (
                        <div className="chat-window__media-document">
                          <a
                            href={m.attachments[0].mediaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="chat-window__document-link"
                          >
                            <div className="chat-window__document-icon">
                              {getFileIcon(m.attachments[0].mimeType || '')}
                            </div>
                            <div className="chat-window__document-info">
                              <div className="chat-window__document-name">
                                {m.attachments[0].fileName || 'Documento'}
                              </div>
                              <div className="chat-window__document-size">{m.attachments[0].mimeType || 'Archivo'}</div>
                            </div>
                            <div className="chat-window__document-download">
                              <Download size={16} />
                            </div>
                          </a>
                        </div>
                      )}

                      {m.content && (
                        <div className="chat-window__message-caption">{m.content}</div>
                      )}
                    </div>
                  ) : (
                    <div className="chat-window__message-text">{m.content}</div>
                  )}
                </div>

                <div className="chat-window__message-info">
                  <span className="chat-window__message-time">
                    {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {getStatusIcon(m, isCurrentUser)}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="chat-window__composer">
        {/* Ícono de adjuntar archivo tradicional */}
        <label htmlFor="file-upload" className="chat-window__composer-attachment" aria-label="Adjuntar archivo">
          <Paperclip size={20} />
        </label>
        <input
          id="file-upload"
          ref={fileInputRef}
          type="file"
          className="chat-window__composer-file-input"
          onChange={handleFileChange}
          disabled={!conversationId || sending}
        />

        {/* Vista previa del archivo seleccionado */}
        {file && (
          <div className="chat-window__composer-file-preview">
            <span className="chat-window__composer-file-name">{file.name}</span>
            <button
              className="chat-window__composer-file-remove"
              onClick={() => setFile(null)}
              aria-label="Eliminar archivo"
            >
              ×
            </button>
          </div>
        )}

        <div className="chat-window__composer-input-container">
          <textarea
            className="chat-window__composer-input"
            placeholder="Escribe un mensaje…"
            value={text}
            onChange={e => setText(e.target.value)}
            onPaste={handlePaste}  
            disabled={!conversationId || sending}
            rows={1}
          />
        </div>

        <button
          className="chat-window__composer-send"
          onClick={handleSend}
          disabled={!conversationId || sending || (!text.trim() && !file)}
          aria-label="Enviar mensaje"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}