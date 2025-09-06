/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Send, Paperclip, Download, MessageSquareMore } from 'lucide-react'
import '@/styles/Chat/ChatWindow.css'
import { useChatWindow } from '@/Hooks/Chat/useChatWindow'
import type { SystemParamResponseDto } from '@/Interfaces/Auth/AuthInterface'
import type { MessageDto } from '@/Interfaces/Chat/ChatInterfaces'
import { sendText } from '@/Services/MessageService'

const formatTime = (iso?: string) => {
  if (!iso) return ''
  const match = iso.match(/T(\d{2}:\d{2})/)
  return match ? match[1] : ''
}

interface Props {
  conversationId?: number
  conversationStatus?: string | null
  userId: number
  selectedParam: SystemParamResponseDto | null
}

export const ChatWindow: React.FC<Props> = ({ conversationId, userId, conversationStatus, selectedParam }) => {
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
    handleKeyPress,
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
    replyTo
  } = useChatWindow()

  const LONG_PRESS_MS = 400
  const [quickMenuOpen, setQuickMenuOpen] = useState(false)
  const [quickMenuPos, setQuickMenuPos] = useState<{ x: number, y: number }>({ x: 0, y: 0 })
  const [quickMenuMsg, setQuickMenuMsg] = useState<MessageDto | null>(null)
  const longPressTimerRef = useRef<number | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    setConversationId(Number(conversationId))
    setUserId(Number(userId))
    return () => {
      setConversationId(0)
      setUserId(0)
    }
  }, [conversationId])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!popoverRef.current) return
      if (!popoverRef.current.contains(e.target as Node)) {
        setQuickMenuOpen(false)
        setQuickMenuMsg(null)
      }
    }
    if (quickMenuOpen) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [quickMenuOpen])

  const quickOptions: string[] = useMemo(() => {
    if (Array.isArray(selectedParam)) return (selectedParam as any).filter((v: any) => typeof v === 'string')
    if (typeof selectedParam === 'string') {
      try {
        const parsed = JSON.parse(selectedParam)
        if (Array.isArray(parsed)) return parsed.filter((v: any) => typeof v === 'string')
      } catch { /* noop */ }
    }
    if (typeof (selectedParam as any)?.value === 'string') {
      try {
        const parsed = JSON.parse((selectedParam as any).value)
        if (Array.isArray(parsed)) return parsed.filter((v: any) => typeof v === 'string')
      } catch {
        return String((selectedParam as any).value).split('|').map((s: string) => s.trim()).filter(Boolean)
      }
    }
    if (Array.isArray((selectedParam as any)?.value)) {
      return (selectedParam as any).value.filter((v: any) => typeof v === 'string')
    }
    return []
  }, [selectedParam])

const sendQuickNow = async (msg: MessageDto, opt: string) => {
  try {
    await sendText({
      conversationId: Number(conversationId),
      senderId: Number(userId),
      content: opt,
      messageType: 'Text',
      externalId: (msg as any)?.externalId ?? null,
      repliedParentMessageId: msg.messageId
    });
  } finally {
    setSelectedOption(null);
    cancelReply();
    setQuickMenuOpen(false);
  }
};

const sendQuick = (opt: string) => {
  if (quickMenuMsg) {
    void sendQuickNow(quickMenuMsg, opt); // envía ya
  } else {
    setSelectedOption(opt);
    handleSend();
  }
};




  const startLongPress = (e: React.PointerEvent, msg: MessageDto) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const x = e.clientX ?? (rect.left + rect.width / 2)
    const y = e.clientY ?? rect.top
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = window.setTimeout(() => {
      setQuickMenuPos({ x, y })
      setQuickMenuMsg(msg)
      setQuickMenuOpen(true)
    }, LONG_PRESS_MS)
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
      <div className="chat-window__messages" onDoubleClick={focusTextarea}>
        {visibleMessages.length > 0 && (
          <div className="chat-window__date-divider">
            <span className="chat-window__date-text">Hoy</span>
          </div>
        )}

        {visibleMessages.map((m, i) => {
          const isCurrentUser = m.senderUserId === userId
          const isIncomingFromContact = !isCurrentUser
          const prev = i > 0 ? visibleMessages[i - 1] : null
          const showSender = !prev || prev.senderUserId !== m.senderUserId
          const sentAt = formatTime(m.sentAt)
          return (
            <div key={m.messageId} className={getMessagePosition(m)}>
              {showSender && !isCurrentUser && (
                <div className="chat-window__message-sender">
                  {m.senderContactId ? m.senderContactName || 'Cliente' : m.senderUserName || 'Sistema'}
                </div>
              )}
              <div
                className={getMessageClassName(m)}
                {...(isIncomingFromContact ? {
                  onPointerDown: (e: React.PointerEvent) => startLongPress(e, m),
                  onPointerUp: cancelLongPress,
                  onPointerLeave: cancelLongPress,
                  onPointerCancel: cancelLongPress,
                } : {
                  onDoubleClick: focusTextarea
                })}
              >
            {/* Mostrar el contenido si el mensaje si tierne una relación recursiba con otro mensaje como reply
             */}
                {m.replyToMessage && (
                        <div className="chat-window__reply-preview">
                          <div className="chat-window__reply-author">
                            {m.replyToMessage.senderContactId
                              ? (m.replyToMessage.senderContactName || 'Cliente')
                              : (m.replyToMessage.senderUserName || 'Sistema')}
                          </div>
                          <div className="chat-window__reply-content">
                            {m.replyToMessage.attachments?.length
                              ? (m.replyToMessage.attachments[0].fileName
                                  || (m.replyToMessage.attachments[0].mimeType?.startsWith('image/') ? '[Imagen]'
                                  : m.replyToMessage.attachments[0].mimeType?.startsWith('video/') ? '[Video]'
                                  : m.replyToMessage.attachments[0].mimeType?.startsWith('audio/') ? '[Audio]'
                                  : '[Adjunto]'))
                              : (m.replyToMessage.content
                                  ? (m.replyToMessage.content.length > 80
                                      ? m.replyToMessage.content.slice(0, 80) + '…'
                                      : m.replyToMessage.content)
                                  : 'Mensaje sin contenido')}
                          </div>
                        </div>
                      )}

                <div className="chat-window__message-content">
                  {m.attachments?.length ? (
                    <div className="chat-window__media">
                      {(m.attachments[0].mimeType?.startsWith('image/') ||
                        m.attachments[0].mimeType === 'image/webp') && (
                        <div className="chat-window__media-image">
                          <div className="chat-window__image-container">
                            <img
                              src={m.attachments[0].mediaUrl}
                              alt={m.attachments[0].fileName || 'Imagen'}
                              className="chat-window__image"
                              loading="lazy"
                              onClick={() => openImagePreview(m.attachments![0].mediaUrl!)}
                            />
                          </div>
                        </div>
                      )}
                      {m.attachments[0].mimeType?.startsWith('video/') && (
                        <div className="chat-window__media-video">
                          <video controls className="chat-window__video" src={m.attachments[0].mediaUrl}>
                            Tu navegador no soporta el elemento video.
                          </video>
                        </div>
                      )}
                      {m.attachments[0].mimeType?.startsWith('audio/') && (
                        <div className="chat-window__media-audio">
                          <div className="chat-window__audio-container">
                            <div className="chat-window__audio-icon">🎵</div>
                            <div className="chat-window__audio-info">
                              <div className="chat-window__audio-name">
                                {m.attachments[0].fileName || 'Audio'}
                              </div>
                              <audio
                                controls
                                className="chat-window__audio-player"
                                src={m.attachments[0].mediaUrl}
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
                              <div className="chat-window__document-size">
                                {m.attachments[0].mimeType || 'Archivo'}
                              </div>
                            </div>
                            <div className="chat-window__document-download">
                              <Download size={16} />
                            </div>
                          </a>
                        </div>
                      )}
                      {hasText(m) && <div className="chat-window__message-caption">{m.content}</div>}
                    </div>
                  ) : (
                    hasText(m) && <div className="chat-window__message-text">{m.content}</div>
                  )}
                </div>
                <div className="chat-window__message-info">
                  <span className="chat-window__message-time">{sentAt}</span>
                  {getStatusIcon(m, isCurrentUser)}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} className="butttonRef" />
      </div>

      <div className="chat-window__composer">
        {replyTo && (
          <div
            className="chat-window__reply-pill"
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              background: '#f3f4f6',
              borderLeft: '4px solid #10b981',
              padding: '8px 10px',
              borderRadius: 8,
              margin: '0 12px 8px'
            }}
          >
            <div style={{ fontSize: 12, opacity: .8 }}>Respondiendo a {replyTo.author}</div>
            <div style={{ flex: 1, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {replyTo.preview}
            </div>
            <button onClick={cancelReply} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        <label htmlFor="file-upload" className="chat-window__composer-attachment" aria-label="Adjuntar archivo">
          <Paperclip size={20} />
        </label>

        <input
          id="file-upload"
          ref={fileInputRef}
          type="file"
          className="chat-window__composer-file-input"
          onChange={handleFileChange}
          disabled={!conversationId || sending || conversationStatus == 'Closed'}
        />

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
            ref={textAreaRef}
            className="chat-window__composer-input"
            placeholder="Escribe un mensaje…"
            value={text}
            onChange={(e) => { setSelectedOption(null); setText(e.target.value) }}
            onKeyDown={handleKeyPress}
            onPaste={handlePaste}
            disabled={!conversationId || sending || conversationStatus == 'Closed'}
            rows={1}
          />
        </div>

        <button
          className="chat-window__composer-send"
          onClick={handleSend}
          disabled={!conversationId || sending || (!text.trim() && !file) || conversationStatus == 'Closed'}
          aria-label="Enviar mensaje"
        >
          <Send size={18} />
        </button>
      </div>

      {ismaximize && previewImageUrl && (
        <div className="chat-window__image-preview-overlay" onClick={closeImagePreview}>
          <img src={previewImageUrl} alt="Vista previa" className="chat-window__image-preview-full" />
        </div>
      )}

      {quickMenuOpen && (
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: quickMenuPos.y,
            left: quickMenuPos.x,
            transform: 'translate(-50%, -100%)',
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            padding: 8,
            width: 260,
            zIndex: 9999
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (quickMenuMsg) beginReply(quickMenuMsg)
              setQuickMenuOpen(false)
              textAreaRef.current?.focus()
            }}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '10px 12px',
              borderRadius: 10,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            ↩️ Responder
          </button>

          {quickOptions.length > 0 && (
            <>
              <div style={{ height: 1, background: '#eee', margin: '6px 0' }} />
              <div style={{ fontSize: 12, opacity: .7, padding: '4px 8px' }}>Respuestas rápidas</div>
              <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                {quickOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => sendQuick(opt)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: 14
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
//Al enviar un reply se deve de mandar el id del mensaje del mensaje al clual le hace reply en la api lo espera el campo RepliedParentMessageId para cuando es texto, o media, o repuesta rapida.
//Cuando es respuesta rapida, no se esta enviando bien el externalId, queda null. Con texto y padre si se inlcuye y el reply lleg abien a usuario de whatsappp.

//Que devo de hacer.
//Ademas que cuando tiene relacion con otro mensaje por reply me gusatria que se vienra arroaba del mensajew el contenido del mensaje que esta hacineod reply, como una previsualizacion del mensaje al cual se esta respondiendo.