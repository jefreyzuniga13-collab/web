/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Send, Paperclip, Download, MessageSquareMore } from 'lucide-react'
import '@/styles/Chat/ChatWindow.css'
import { useChatWindow } from '@/Hooks/Chat/useChatWindow'
import type { SystemParamResponseDto } from '@/Interfaces/Auth/AuthInterface'

const formatTime = (iso?: string) => {
  if (!iso) return ''
  const match = iso.match(/T(\d{2}:\d{2})/)
  return match ? match[1] : ''
}

interface Props {
  conversationId?: number
  conversationStatus?: string | null
  userId: number
  selectedParam: SystemParamResponseDto | null;
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
    setSelectedOption
  } = useChatWindow()

  const LONG_PRESS_MS = 400
  const [quickMenuOpen, setQuickMenuOpen] = useState(false)
  const [quickMenuPos, setQuickMenuPos] = useState<{x:number, y:number}>({x:0, y:0})
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [quickMenuMsgId, setQuickMenuMsgId] = useState<number | null>(null)
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
        setQuickMenuMsgId(null)
      }
    }
    if (quickMenuOpen) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [quickMenuOpen])

  const quickOptions: string[] = useMemo(() => {
    if (Array.isArray(selectedParam)) return selectedParam.filter(v => typeof v === 'string')
    if (typeof selectedParam === 'string') {
      try {
        const parsed = JSON.parse(selectedParam)
        if (Array.isArray(parsed)) return parsed.filter(v => typeof v === 'string')
      } catch {
        // intentionally ignored
      }
    }
    if (typeof (selectedParam as any)?.value === 'string') {
      try {
        const parsed = JSON.parse((selectedParam as any).value)
        if (Array.isArray(parsed)) return parsed.filter(v => typeof v === 'string')
      } catch {
        return String((selectedParam as any).value).split('|').map((s: string) => s.trim()).filter(Boolean)
      }
    }
    if (Array.isArray((selectedParam as any)?.value)) {
      return (selectedParam as any).value.filter((v: any) => typeof v === 'string')
    }
    return []
  }, [selectedParam])

  const sendQuick = (opt: string) => {
    setQuickMenuOpen(false)
    setSelectedOption(opt)
    setTimeout(() => {
      handleSend()
    }, 0)
  }

  const startLongPress = (e: React.PointerEvent, msgId: number) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const x = e.clientX ?? (rect.left + rect.width / 2)
    const y = e.clientY ?? rect.top
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = window.setTimeout(() => {
      setQuickMenuPos({ x, y })
      setQuickMenuMsgId(msgId)
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
                  onPointerDown: (e: React.PointerEvent) => startLongPress(e, m.messageId),
                  onPointerUp: cancelLongPress,
                  onPointerLeave: cancelLongPress,
                  onPointerCancel: cancelLongPress,
                } : {
                  onDoubleClick: focusTextarea
                })}
              >
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

      {quickMenuOpen && quickOptions.length > 0 && (
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
            maxHeight: 320,
            overflowY: 'auto',
            zIndex: 9999
          }}
        >
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
      )}
    </div>
  )
}