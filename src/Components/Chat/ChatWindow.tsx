import React, { useEffect, useState, useRef, type ChangeEvent } from 'react'
import useMessages from '@/Hooks/useMessages'
import { sendText, uploadAttachment, sendMedia } from '@/Utils/ApiConfig'
import { Send, Paperclip } from 'lucide-react'
import '@/Styles/Chat/ChatWindow.css'
import {MessageSquareMore} from 'lucide-react'
interface Props {
  conversationId?: number
  userId: number
}

export const ChatWindow: React.FC<Props> = ({ conversationId, userId }) => {
  const messages = useMessages(conversationId)
  console.log("Mensajes desde la api" +  JSON.stringify(messages));
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSend = async () => {
    if (!conversationId || sending) return
    setSending(true)
    try {
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        const uploadResponse = await uploadAttachment(formData)
        const mediaId = uploadResponse.data.data as string
        await sendMedia(
          conversationId,
          userId.toString(),
          mediaId,
          file.type,
          text.trim() || undefined
        )
        setFile(null)
        setText('')
        if (fileInputRef.current) fileInputRef.current.value = ''
      } else if (text.trim()) {
        await sendText(conversationId, userId.toString(), text.trim())
        setText('')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!conversationId) {
    return (
      <div className="chat-empty-state">
        <div><MessageSquareMore className="empty-icon"/></div>
        <h3 className="empty-title">Ninguna conversación seleccionada</h3>
        <p className="empty-text">
          Selecciona una conversación para chatear.
        </p>
      </div>
    )
  }

  return (
    <div className="chat-window">
      <div className="chat-window__messages">
        {messages.length > 0 && (
          <div className="messages-date-divider">Hoy</div>
        )}

        {messages.map((m, i) => {
          const isOut = m.senderId === userId
          const side = isOut ? 'out' : 'in'
          const prev = i > 0 ? messages[i - 1] : null
          const showSender = !prev || prev.senderId !== m.senderId

          return (
            <div
              key={m.messageId}
              className={`message-group message-group--${side}`}
            >
              {showSender && !isOut && (
                <div className="message-sender">
                  {m.senderName}
                </div>
              )}
              <div
                className={`chat-window__message chat-window__message--${side}`}
              >
                {m.messageType === 'Media' && m.attachments.length > 0 ? (
                  <img
                    src={`${import.meta.env.VITE_API_URL}/Attachments/${m.attachments[0].mediaId}`}
                    alt={m.caption || ''}
                    className="chat-window__image"
                  />
                ) : (
                  <p className="chat-window__text">{m.content}</p>
                )}
              </div>
              <div className={`message-time message-time--${side}`}>
                {new Date(m.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="chat-window__composer">
        <div className="composer-attachment">
          <label htmlFor="file-upload" className="attachment-button">
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
        </div>
        <div className="chat-window__input-wrap">
          <input
            type="text"
            className="chat-window__input"
            placeholder="Escribe un mensaje..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyPress}
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