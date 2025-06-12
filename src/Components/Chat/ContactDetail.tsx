import React, { useEffect, useState, useCallback, type ChangeEvent } from 'react'
import type { ConversationDto } from '@/Interfaces/Chat/ChatInterfaces'
import { getConversation, updateTag } from '@/Services/ConversationService'
// import { User, Clock, AlertCircle, Tag, Edit, X, Check, Info, History, Hourglass, UserPen } from 'lucide-react'
import {Book  , AlertCircle, Tag, Edit, X, Check, Info } from 'lucide-react'
import { useSignalR } from '@/Context/SignalRContext'
import { ConversationHistoryModal } from '@/Components/Chat/ConversationHistoryModal'
import '@/Styles/Chat/ContactDetail.css'
import { IoClose } from "react-icons/io5";

interface ContactDetailProps {
  conversationId?: number
  contactDetailToggle: boolean;
  setContactDetailToggle?: (toggle: boolean) => void
}

export const ContactDetail: React.FC<ContactDetailProps> = ({ conversationId, contactDetailToggle, setContactDetailToggle }) => {
  const [conv, setConv] = useState<ConversationDto | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  const signalR = useSignalR()

  // Carga o recarga datos de la conversación
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

  // Persistir cambio de etiquetas
  const saveTags = useCallback(
    async (newTags: string[]) => {
      if (!conv) return
      try {
        setTags(newTags)
        updateTag(conv.conversationId, newTags);
        setConv(v => v ? { ...v, tags: newTags } : v)
      } catch (err) {
        console.error('Error al guardar etiquetas:', err)
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[conv]
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

    // Handle SignalR events if available
    if (signalR.onConversationUpdated) {
      signalR.onConversationUpdated(handler)
    }
    if (signalR.onConversationCreated) {
      signalR.onConversationCreated(handler)
    }

    return () => {
      if (signalR.offConversationUpdated) {
        signalR.offConversationUpdated(handler)
      }
      if (signalR.offConversationCreated) {
        signalR.offConversationCreated(handler)
      }
    }
  }, [conversationId, fetchDetail, signalR])

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
      <div className="contact-detail__empty">
        <button 
            className="close-button"
            onClick={() => setContactDetailToggle && setContactDetailToggle(false)}
            aria-label="Cerrar detalles del contacto"><IoClose /></button>
        <div className="contact-detail__empty-icon">
          <Info size={24} />
        </div>
        <h3>Sin conversación seleccionada</h3>
        <p>Selecciona una conversación para ver los detalles del contacto.</p>
      </div>
    )
  }
  
  if (loading) {
    return (
      <div className="contact-detail__loading">
        <div className="loading-spinner"></div>
        <p>Cargando detalles...</p> 
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="contact-detail__error">
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

  const createdAt = conv.createdAt ?  new Date(conv.createdAt).toLocaleString() : '----------';
 // const firstResponseAt = new Date(conv.firstResponseAt).toLocaleString()
  const assignedAt = conv.assignedAt ? new Date(conv.assignedAt).toLocaleString() : '----------';
  const agentFirstMessageAt = conv.agentFirstMessageAt ? new Date(conv.agentFirstMessageAt).toLocaleString(): '----------';
  const agentLastMessageAt = conv.agentLastMessageAt ? new Date(conv.agentLastMessageAt).toLocaleString(): '----------';
  const clientLastMessageAt = conv.clientLastMessageAt ? new Date(conv.clientLastMessageAt).toLocaleString(): '----------';
  const closedAt = conv.closedAt ? new Date(conv.closedAt).toLocaleString(): '----------';
  const agentRequestAt = conv.agentRequestAt ? new Date(conv.agentRequestAt).toLocaleString(): '----------';

  const updatedAt = conv.updatedAt
    ? new Date(conv.updatedAt).toLocaleString()
    : null
  const duration = conv.duration ?? '—'

  const statusClass = `status-indicator status-${conv.status?.toLowerCase()}`

  return (
    <>
      <section className={`contact-detail ${contactDetailToggle ? "show-container" : ""}`} aria-label="Detalles de contacto">

        <header className="contact-header">
          <div className="contact-avatar" role="img" aria-label="Avatar del contacto">
            {conv.clientContactName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="contact-info">
            <h3 className="contact-name">{conv.clientContactName || 'Usuario'}</h3>
            <div className="contact-meta">
              <span className={statusClass.toString()}></span>
              <span className="status-text">{conv.status}</span>
            </div>
            {conv.contactNumber && (
              <p className="contact-number">{conv.contactNumber}</p>
            )}
          </div>

          <button 
            className="close-button"
            onClick={() => setContactDetailToggle && setContactDetailToggle(false)}
            aria-label="Cerrar detalles del contacto"><IoClose /></button>
        </header>

        <div className="contact-detail__body">
          <div className="contact-detail__section">
            <div className="section-header">
              <h4 className="section-title">
                <Book size={14}/>
                Información principal
              </h4>
              {/* <button 
                className="section-action"
                onClick={() => setShowHistoryModal(true)}
                title="Ver historial completo"
              >
                <History size={14} />
                <span>Historial</span>
              </button> */}
            </div>
            
            <div className="section-content">
              <ul className="info-list">
                <div className='info-list-group'>
                  
                    <li className="info-item">
                      <div className="info-content">
                        <span className="info-label">Creado</span>
                        <time className="info-value" dateTime={conv.createdAt}>
                          {createdAt}
                        </time>
                      </div>
                    </li>

                     <li className="info-item">
                      <div className="info-content">
                        <span className="info-label">Finalizada</span>
                        <time className="info-value" dateTime={conv.closedAt}>
                          {closedAt}
                        </time>
                      </div>
                </li>

                    <li className="info-item">
                      <div className="info-content">
                        <span className="info-label">Solicitud Agente</span>
                        <time className="info-value" dateTime={conv.agentRequestAt}>
                          {agentRequestAt}
                        </time>
                      </div>
                    </li>
                </div>

                <div className='info-list-group'>
                    <li className="info-item">
                  <div className="info-content">
                    <span className="info-label">Fecha Asignación Agente</span>
                    <time className="info-value" dateTime={conv.assignedAt}>
                      {assignedAt}
                    </time>
                  </div>
                </li>

                <li className="info-item">
                  <div className="info-content">
                    <span className="info-label">Primer Mensaje Agente</span>
                    <time className="info-value" dateTime={conv.agentFirstMessageAt}>
                      {agentFirstMessageAt}
                    </time>
                  </div>
                </li>

                <li className="info-item">
                  <div className="info-content">
                    <span className="info-label">Agente Ultimo Mensaje</span>
                    <time className="info-value" dateTime={conv.agentLastMessageAt}>
                      {agentLastMessageAt}
                    </time>
                  </div>
                </li>
                </div>
                
                <div className='info-list-group'>

                   <li className="info-item">
                        {/* <div className="info-icon">
                          <History size={16} />
                        </div> */}
                        <div className="info-content">
                          <span className="info-label">Cliente Ultimo Mensaje</span>
                          <time className="info-value" dateTime={conv.clientLastMessageAt!}>
                            {clientLastMessageAt}
                          </time>
                        </div>
                      </li>


                    {updatedAt && (
                      <li className="info-item">
                        {/* <div className="info-icon">
                          <History size={16} />
                        </div> */}
                        <div className="info-content">
                          <span className="info-label">Última actualización</span>
                          <time className="info-value" dateTime={conv.updatedAt!}>
                            {updatedAt}
                          </time>
                        </div>
                      </li>
                    )}

                    <li className="info-item">
                      {/* <div className="info-icon">
                        <Hourglass size={16} />
                      </div> */}
                      <div className="info-content">
                        <span className="info-label">Duración</span>
                        <span className="info-value">{duration}</span>
                      </div>
                    </li>
                </div>

                <div className='info-list-group'>
                   {conv.assignedByUserId && (

                  <li className='info-item'>
                    {/* <div className='info-icon'>
                      <UserPen size={16}/>
                    </div> */}
                    <div className='info-content'>
                      <span className='info-label'>Asignado por</span>
                      <span className='info-value'>{conv.assignedByUserName}</span>
                    </div>
                  </li>
                )}
                
                {conv.assignedAgentId && (
                  <li className="info-item">
                    {/* <div className="info-icon">
                      <User size={16} />
                    </div> */}
                    <div className="info-content">
                      <span className="info-label">Agente asignado</span>
                      <span className="info-value info-value-highlight">{conv.assignedAgentName}</span>
                    </div>
                  </li>
                )}
                </div>

              </ul>
            </div>
          </div>
          
          <div className="contact-detail__section">
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
                        maxLength={60}
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

      <ConversationHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        conversationId={conversationId}
      />
    </>
  )
}