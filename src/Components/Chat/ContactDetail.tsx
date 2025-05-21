// src/Components/Chat/ContactDetail.tsx

import React, { useEffect, useState, useCallback, type ChangeEvent } from 'react'
import type { ConversationDto, TagDto } from '@/Interfaces/Chat/ChatInterfaces'
import {
  getConversation,
  updateConversationTags
} from '@/Services/ConversationService'
import {
  User,
  Clock,
  AlertCircle,
   //Tag as TagIcon
} from 'lucide-react'
import '@/Styles/Chat/ContactDetail.css'
import { useSignalR } from '@/Context/SignalRContext'

interface ContactDetailProps {
  conversationId?: number
}

export const ContactDetail: React.FC<ContactDetailProps> = ({ conversationId }) => {
  const [conv, setConv] = useState<ConversationDto | null>(null)
  const [tags, setTags] = useState<TagDto[]>([])
  const [newTag, setNewTag] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    onConversationUpdated,
    offConversationUpdated,
    onConversationCreated,
    offConversationCreated
  } = useSignalR()

  // 1) Carga o recarga datos de la conversación
  const fetchDetail = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await getConversation(id)
      setConv(res.data.data)
      setTags(res.data.data.tags ?? [])
    } catch (err) {
      console.error(err)
      setError('Error al cargar los detalles de la conversación.')
    } finally {
      setLoading(false)
    }
  }, [])

  // 2) Persistir cambio de etiquetas
  const saveTags = useCallback(
    async (updated: TagDto[]) => {
      if (!conv) return
      const tagIds = updated.map(t => t.tagId)
      await updateConversationTags(conv.conversationId, tagIds)
      setTags(updated)
      setConv(v => v ? { ...v, tags: updated } : v)
    },
    [conv]
  )

  const handleAddTag = () => {
    const name = newTag.trim()
    if (!name) return
    // TagId=0 como marcador; el backend puede asignar el real
    saveTags([...tags, { tagId: 0, name }])
    setNewTag('')
  }
  const handleRemoveTag = (tag: TagDto) => {
    saveTags(tags.filter(t => t !== tag))
  }

  // 3) Efecto de inicialización + SignalR
  useEffect(() => {
    if (!conversationId) {
      setConv(null)
      setTags([])
      return
    }
    fetchDetail(conversationId)

    const handler = (updated: ConversationDto) => {
      if (updated.conversationId === conversationId) {
        setConv(updated)
        setTags(updated.tags ?? [])
      }
    }

    onConversationUpdated(handler)
    onConversationCreated(handler)

    return () => {
      offConversationUpdated(handler)
      offConversationCreated(handler)
    }
  }, [
    conversationId,
    fetchDetail,
    onConversationUpdated,
    offConversationUpdated,
    onConversationCreated,
    offConversationCreated
  ])

  if (!conversationId) {
    return (
      <div className="contact-detail__empty">
        Selecciona una conversación para ver los detalles del contacto.
      </div>
    )
  }
  if (loading) {
    return <div className="contact-detail__loading">Cargando detalles...</div>
  }
  if (error) {
    return <div className="contact-detail__error">{error}</div>
  }
  if (!conv) return null

  const createdAt = new Date(conv.createdAt).toLocaleString()
  const updatedAt = conv.updatedAt
    ? new Date(conv.updatedAt).toLocaleString()
    : null
  const duration = conv.duration ?? '—'

  return (
    <section className="contact-detail" aria-label="Detalles de contacto">
      <header className="contact-header">
        <div
          className="contact-avatar"
          role="img"
          aria-label="Avatar del contacto"
        >
          {conv.clientContactName?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="contact-info">
          <h3 className="contact-name">{conv.clientContactName || 'Usuario'}</h3>
          <p className="contact-number">{conv.contactNumber || '—'}</p>
        </div>
      </header>

      <div className="contact-detail__section">
        <h4 className="section-title">Información principal</h4>
        <ul className="info-list">
          <li className="info-item">
            <AlertCircle size={16} />
            <span className="info-label">Estado:</span>{' '}
            <span className="info-value">{conv.status}</span>
          </li>
          <li className="info-item">
            <Clock size={16} />
            <span className="info-label">Creado:</span>{' '}
            <time className="info-value" dateTime={conv.createdAt}>
              {createdAt}
            </time>
          </li>
          {updatedAt && (
            <li className="info-item">
              <Clock size={16} />
              <span className="info-label">Última actualización:</span>{' '}
              <time className="info-value" dateTime={conv.updatedAt!}>
                {updatedAt}
              </time>
            </li>
          )}
          {conv.assignedAgentId && (
            <li className="info-item">
              <User size={16} />
              <span className="info-label">Agente asignado:</span>{' '}
              <span className="info-value">{conv.assignedAgentName}</span>
            </li>
          )}
          <li className="info-item">
            <Clock size={16} />
            <span className="info-label">Duración:</span>{' '}
            <span className="info-value">{duration}</span>
          </li>
        </ul>
      </div>

      <div className="contact-detail__section">
        <div className="section-header">
          <h4 className="section-title">Etiquetas</h4>
        </div>
        <div className="tag-editor">
          {tags.map(tag => (
            <span key={`${tag.tagId}-${tag.name}`} className="tag">
              {tag.name}
              <button
                className="tag-remove"
                onClick={() => handleRemoveTag(tag)}
              >×</button>
            </span>
          ))}
          <input
            className="tag-input"
            value={newTag}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setNewTag(e.target.value)
            }
            placeholder="Nueva etiqueta..."
          />
          <button className="tag-add" onClick={handleAddTag}>
            Añadir
          </button>
        </div>
      </div>
    </section>
  )
}