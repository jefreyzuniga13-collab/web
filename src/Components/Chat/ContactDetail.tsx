
import React, { useEffect, useState, useCallback, type ChangeEvent } from 'react'
import type { ConversationDto } from '@/Interfaces/Chat/ChatInterfaces'
import { getConversation, updateConversation } from '@/Services/ConversationService'
import { User, Clock, AlertCircle, Tag, ChevronDown, Edit, X, Check, Info } from 'lucide-react'
import { useSignalR } from '@/Context/SignalRContext'
import '@/Styles/Chat/ContactDetail.css'
interface ContactDetailProps {
  conversationId?: number
}

export const ContactDetail: React.FC<ContactDetailProps> = ({ conversationId }) => {
  const [conv, setConv] = useState<ConversationDto | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAddingTag, setIsAddingTag] = useState(false)

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

  // 2) Persistir cambio de etiquetas usando el PUT genérico
  const saveTags = useCallback(
    async (newTags: string[]) => {
      if (!conv) return
      try {
        await updateConversation(conv.conversationId, { tags: newTags })
        setTags(newTags)
        setConv(v => v ? { ...v, tags: newTags } : v)
      } catch (err) {
        console.error('Error al guardar etiquetas:', err)
      }
    },
    [conv]
  )

  const handleAddTag = () => {
    const name = newTag.trim()
    if (!name) return
    saveTags([...tags, name])
    setNewTag('')
    setIsAddingTag(false)
  }

  const handleRemoveTag = (tag: string) => {
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag()
    } else if (e.key === 'Escape') {
      setIsAddingTag(false)
      setNewTag('')
    }
  }

  if (!conversationId) {
    return (
      <div className="contact-detail-empty">
        <div className="contact-detail-empty-icon">
          <Info size={24} />
        </div>
        <h3>Sin conversación seleccionada</h3>
        <p>Selecciona una conversación para ver los detalles del contacto.</p>
      </div>
    )
  }
  
  if (loading) {
    return (
      <div className="contact-detail-loading">
        <div className="loading-spinner"></div>
        <p>Cargando detalles...</p>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="contact-detail-error">
        <div className="error-icon">
          <AlertCircle size={24} />
        </div>
        <h3>Error</h3>
        <p>{error}</p>
        <button 
          className="retry-button" 
          onClick={() => conversationId && fetchDetail(conversationId)}
        >
          Reintentar
        </button>
      </div>
    )
  }
  
  if (!conv) return null

  const createdAt = new Date(conv.createdAt).toLocaleString()
  const updatedAt = conv.updatedAt
    ? new Date(conv.updatedAt).toLocaleString()
    : null
  const duration = conv.duration ?? '—'

  const statusClass = `status-indicator status-${conv.status?.toLowerCase()}`

  return (
    <section className="contact-detail" aria-label="Detalles de contacto">
      <header className="contact-header">
        <div className="contact-avatar" role="img" aria-label="Avatar del contacto">
          {conv.clientContactName?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="contact-info">
          <h3 className="contact-name">{conv.clientContactName || 'Usuario'}</h3>
          <div className="contact-meta">
            <span className={statusClass}></span>
            <span className="status-text">{conv.status}</span>
          </div>
          {conv.contactNumber && (
            <p className="contact-number">{conv.contactNumber}</p>
          )}
        </div>
      </header>

      <div className="contact-detail-body">
        <div className="contact-detail-section">
          <div className="section-header">
            <h4 className="section-title">
              <span className="section-icon"><Info size={16} /></span>
              Información principal
            </h4>
            <button className="section-toggle">
              <ChevronDown size={16} />
            </button>
          </div>
          
          <div className="section-content">
            <ul className="info-list">
              <li className="info-item">
                <div className="info-item-icon">
                  <Clock size={16} />
                </div>
                <div className="info-item-content">
                  <span className="info-label">Creado</span>
                  <time className="info-value" dateTime={conv.createdAt}>
                    {createdAt}
                  </time>
                </div>
              </li>
              
              {updatedAt && (
                <li className="info-item">
                  <div className="info-item-icon">
                    <Clock size={16} />
                  </div>
                  <div className="info-item-content">
                    <span className="info-label">Última actualización</span>
                    <time className="info-value" dateTime={conv.updatedAt!}>
                      {updatedAt}
                    </time>
                  </div>
                </li>
              )}
              
              {conv.assignedAgentId && (
                <li className="info-item">
                  <div className="info-item-icon">
                    <User size={16} />
                  </div>
                  <div className="info-item-content">
                    <span className="info-label">Agente asignado</span>
                    <span className="info-value info-value-highlight">{conv.assignedAgentName}</span>
                  </div>
                </li>
              )}
              
              <li className="info-item">
                <div className="info-item-icon">
                  <Clock size={16} />
                </div>
                <div className="info-item-content">
                  <span className="info-label">Duración</span>
                  <span className="info-value">{duration}</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="contact-detail-section">
          <div className="section-header">
            <h4 className="section-title">
              <span className="section-icon"><Tag size={16} /></span>
              Etiquetas
            </h4>
            {!isAddingTag && (
              <button 
                className="section-action"
                onClick={() => setIsAddingTag(true)}
              >
                <Edit size={14} />
                <span>Editar</span>
              </button>
            )}
          </div>
          
          <div className="section-content">
            <div className="tags-container">
              {tags.length === 0 ? (
                <p className="empty-tags">No hay etiquetas</p>
              ) : (
                <div className="tag-list">
                  {tags.map(tag => (
                    <div key={tag} className="tag">
                      <span className="tag-text">{tag}</span>
                      {isAddingTag && (
                        <button
                          className="tag-remove"
                          onClick={() => handleRemoveTag(tag)}
                          aria-label={`Eliminar etiqueta ${tag}`}
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {isAddingTag && (
                <div className="tag-editor">
                  <div className="tag-input-container">
                    <input
                      className="tag-input"
                      value={newTag}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setNewTag(e.target.value)}
                      placeholder="Nueva etiqueta..."
                      autoFocus
                      onKeyDown={handleKeyDown}
                    />
                    <div className="tag-input-actions">
                      <button 
                        className="tag-action-btn tag-add-btn" 
                        onClick={handleAddTag}
                        disabled={!newTag.trim()}
                      >
                        <Check size={16} />
                      </button>
                      <button 
                        className="tag-action-btn tag-cancel-btn" 
                        onClick={() => {
                          setNewTag('');
                          setIsAddingTag(false);
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}