
import React, { useEffect, useState, useRef, type ChangeEvent } from 'react'
import useMessages from '@/Hooks/useMessages'
import { sendText, sendMedia } from '@/Services/MessageService'
import { Send, Paperclip, Check, CheckCheck, MessageSquareMore } from 'lucide-react'
import type { MessageDto } from '@/Interfaces/Chat/ChatInterfaces'
import '@/Styles/Chat/ChatWindow.css'

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

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  const handleSend = async () => {
    if (!conversationId || sending) return
    setSending(true)
    try {
      if (file) {
        await sendMedia(conversationId, file, text.trim() || undefined)
        setFile(null)
        setText('')
        fileInputRef.current!.value = ''
      } else if (text.trim()) {
        console.log("ID de conversacion el chatWindows es: ", conversationId);
        console.log("ID de serder desde el chatWindows es: ", userId);

        await sendText({
          conversationId,
          senderId: userId,
          content: text.trim(),
          messageType: 'Text'
        })
        setText('')
      }
    } finally {
      setSending(false)
    }
  }

  // const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
  //   if (e.key === 'Enter' && !e.shiftKey) {
  //     e.preventDefault()
  //     handleSend()
  //   }
  // }

  const getStatusIcon = (m: MessageDto, isOut: boolean) => {
    if (!isOut) return null
    if (m.readAt) return <CheckCheck size={14} className="message-status message-status--read" />
    if (m.deliveredAt) return <CheckCheck size={14} className="message-status message-status--delivered" />
    if (m.status === 'Sent') return <Check size={14} className="message-status message-status--sent" />
    return null
  }

  const getMessageClassName = (m: MessageDto) => {
    // Caso 1: Mensaje de cliente
    if (m.senderContactId) {
      return 'chat-window__message chat-window__message--client'
    }
    // Caso 2: Mensaje de otro agente
    else if (m.senderUserId && m.senderUserId !== userId) {
      return 'chat-window__message chat-window__message--agent'
    }
    // Caso 3: Mensaje del usuario actual
    else {
      return 'chat-window__message chat-window__message--out'
    }
  }

  const getMessagePosition = (m: MessageDto) => {
    // Si es del usuario actual, va a la derecha
    if (m.senderUserId === userId) {
      return 'message-group message-group--out'
    } 
    // Todos los demás van a la izquierda
    else {
      return 'message-group message-group--in'
    }
  }

  if (!conversationId) {
    return (
      <div className="chat-empty-state">
        <div className="empty-icon"><MessageSquareMore size={64} /></div>
        <h3 className="empty-title">Ninguna conversación seleccionada</h3>
        <p className="empty-text">Selecciona una conversación para chatear.</p>
      </div>
    )
  }

  return (
    <div className="chat-window">
      <div className="chat-window__messages">
        {messages.length > 0 && <div className="messages-date-divider">Hoy</div>}
        {messages.map((m, i) => {
          const isCurrentUser = m.senderUserId === userId
          const prev = i > 0 ? messages[i - 1] : null
          const showSender = !prev || prev.senderUserId !== m.senderUserId

          return (
            <div key={m.messageId} className={getMessagePosition(m)}>
              {showSender && !isCurrentUser && (
                <div className="message-sender">
                  {m.senderContactId ? m.senderContactName || 'Cliente' : m.senderUserName || 'Sistema'}
                </div>
              )}
              
              <div className={getMessageClassName(m)}>
                {m.attachments?.length ? (
                <div className="message-media-container">
                  {/* si es imagen */}
                  {m.attachments[0].mimeType?.startsWith('image/') && (
                    <img
                      src={m.attachments[0].mediaUrl}
                      alt={m.attachments[0].fileName}
                      className="chat-window__image"
                    />
                  )}

                  {/* si es audio */}
                  {m.attachments[0].mimeType?.startsWith('audio/') && (
                    <audio controls src={m.attachments[0].mediaUrl} />
                  )}

                      {/* si es video */}
                      {m.attachments[0].mimeType?.startsWith('video/') && (
                        <video controls className="chat-window__video" src={m.attachments[0].mediaUrl} />
                      )}

                      {/* si es sticker o documento, lo tratamos como imagen o link */}
                      {m.attachments[0].mimeType === 'image/webp' && (
                        <img
                          src={m.attachments[0].mediaUrl}
                          alt={m.attachments[0].fileName}
                          className="chat-window__image"
                        />
                      )}
                      {m.messageType === 'Document' && (
                        <a href={m.attachments[0].mediaUrl} target="_blank" rel="noopener noreferrer">
                          📎 {m.attachments[0].fileName}
                        </a>
                      )}

                      {/* pie de foto */}
                      {m.content && <p className="message-caption">{m.content}</p>}
                    </div>
                  ) : (
                    <p className="chat-window__text">{m.content}</p>
                  )}
                <div className="message-info">
                  {getStatusIcon(m, isCurrentUser)}
                  <span className="message-time">
                    {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      
      <div className="chat-window__composer">
        <label htmlFor="file-upload" className="attachment-button" aria-label="Adjuntar archivo">
          <Paperclip size={20} />
        </label>
        <input
          id="file-upload"
          ref={fileInputRef}
          type="file"
          className="file-input-hidden"
          onChange={handleFileChange}
          disabled={!conversationId || sending}
        />
        
        {file && (
          <div className="file-preview">
            <span className="file-name">{file.name}</span>
            <button 
              className="file-remove" 
              onClick={() => setFile(null)} 
              aria-label="Eliminar archivo"
            >×</button>
          </div>
        )}
        
        <div className="chat-window__input-wrap">
          <textarea
            // type="text"
            className="chat-window__input"
            placeholder="Escribe un mensaje..."
            value={text}
            onChange={e => setText(e.target.value)}
            // onKeyDown={handleKeyPress}
            disabled={!conversationId || sending}
          />
        </div>
        
        <button
          className="chat-window__send"
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