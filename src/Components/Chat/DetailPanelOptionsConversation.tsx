import { Check, Edit, Tag, X } from 'lucide-react';
import React, { useCallback, useState } from 'react'
import { FaWhatsapp } from 'react-icons/fa';
import { IoIosOptions } from 'react-icons/io';
import { SetHaltedConversation } from '@/Services/ConversationService';
import { useContactDetail } from '@/Hooks/Chat/useContactDetail';

interface Props {
    conversationId: number;
    formatDate: (v?: string | number | Date | null) => string;
}

const DetailPanelOptionsConversation: React.FC<Props> = ({
    conversationId,
    formatDate
}) => {
    const [showConversarionOptions, setShowConversarionOptions] = useState(false);

      const {
        conv,
        conversationTone,
        tags,
        isAddingTag,
        newTag,
        setIsAddingTag,
        setNewTag,
        handleAddTag,
        handleRemoveTag,
        handleKeyDown,
      } = useContactDetail(Number(conversationId))
      
    const handleSetHaltedConversation = useCallback(async () => {
        if (!conv) return
        try {
          await SetHaltedConversation(conv.conversationId)
        } catch (e) {
          console.error(e)
        }
      }, [conv])
      
    return (
        <div className="detailPanel-card"
            style={{
                paddingLeft: 12,
                paddingRight: 12
            }}>

            <header className="detailPanel-quick__header">
                <h5>Conversación Actual</h5>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                        className="btn btn--ghost"
                        onClick={() => {
                            setShowConversarionOptions(s => !s)
                        }}
                        title="Opciones"
                        aria-expanded={showConversarionOptions}
                        aria-controls="convOptions"
                        type="button"
                    >
                        <IoIosOptions size={14} />
                        <span style={{ marginLeft: 6 }}>Opciones</span>
                    </button>
                </div>

                {/* Pendiente: El actualizar la convesación o mediante un estado, para no hacer peticiones extra de actualización */}
                {showConversarionOptions && (
                    <div id="convOptions" role="menu" aria-label="Opciones de conversación" className="conv-options">
                        {conv?.conversationId && (
                            <button
                                className="menu-item"
                                onClick={handleSetHaltedConversation}
                                type="button"
                            >
                                {conv?.isHalted ? "Reanudar conversación" : "Pausar conversación"}
                            </button>
                        )}
                    </div>
                )}
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                <div className="detailPanel-contactGroup">
                    <p className="detailPanel-clientGroup__title">Empresa</p>
                    <span className="detailPanel-clientGroup__cliente">
                        {conv?.systemDefinedCompanyName ?? '---'}
                    </span>
                </div>
                <div className="detailPanel-contactGroup">
                    <p className="detailPanel-clientGroup__title">Contacto</p>
                    <span className="detailPanel-clientGroup__cliente">{conv?.clientContactName ?? '---'}</span>
                </div>
                <div className="detailPanel-contactGroup">
                    <p className="detailPanel-clientGroup__title">Nombre</p>
                    <span className="detailPanel-clientGroup__cliente">{conv?.contactNumber ?? '---'}</span>
                </div>
                <div className="detailPanel-contactGroup">
                    <p className="detailPanel-clientGroup__title">Canal</p>
                    <span className="detailPanel-clientGroup__cliente"><FaWhatsapp style={{ verticalAlign: 'middle' }} /></span>
                </div>
                <div className="detailPanel-contactGroup">
                    <p className="detailPanel-clientGroup__title">Estado Reciente</p>
                    <span className="detailPanel-clientGroup__cliente">{conv?.status ?? '---'}</span>
                </div>

                <div className="detailPanel-contactGroup">
                    <p className="detailPanel-clientGroup__title">Creado</p>
                    <span className="detailPanel-clientGroup__cliente">{formatDate(conv?.createdAt)}</span>
                </div>
                <div className="detailPanel-contactGroup">
                    <p className="detailPanel-clientGroup__title">solicitud de agente</p>
                    <span className="detailPanel-clientGroup__cliente">{formatDate(conv?.agentRequestAt)}</span>
                </div>
                <div className="detailPanel-contactGroup">
                    <p className="detailPanel-clientGroup__title">Asignación de agente</p>
                    <span className="detailPanel-clientGroup__cliente">{formatDate(conv?.assignedAt)}</span>
                </div>
                <div className="detailPanel-contactGroup">
                    <p className="detailPanel-clientGroup__title">Primer mensaje del agente</p>
                    <span className="detailPanel-clientGroup__cliente">{formatDate(conv?.agentFirstMessageAt)}</span>
                </div>
                <div className="detailPanel-contactGroup">
                    <p className="detailPanel-clientGroup__title">Último mensaje del agente</p>
                    <span className="detailPanel-clientGroup__cliente">{formatDate(conv?.agentLastMessageAt)}</span>
                </div>
                <div className="detailPanel-contactGroup">
                    <p className="detailPanel-clientGroup__title">Último mensaje del cliente</p>
                    <span className="detailPanel-clientGroup__cliente">{formatDate(conv?.clientLastMessageAt)}</span>
                </div>
                <div className="detailPanel-contactGroup">
                    <p className="detailPanel-clientGroup__title">Última actualización</p>
                    <span className="detailPanel-clientGroup__cliente">{formatDate(conv?.updatedAt)}</span>
                </div>
                <div className="detailPanel-contactGroup">
                    <p className="detailPanel-clientGroup__title">Cierre</p>
                    <span className="detailPanel-clientGroup__cliente">{formatDate(conv?.closedAt)}</span>
                </div>
            </div>

            {conversationTone && (
                <div className="detailPanel-contactGroup">
                    <p className="detailPanel-contactGroup__title">Tono de conversación</p>
                    <span className="detailPanel-clientGroup__cliente">
                        <strong className={`conversation-toneText__${conversationTone.trim()}`}>{conversationTone}</strong>
                    </span>
                </div>
            )}

            <div className="detailPanel-tags" style={{ marginTop: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Tag size={16} />
                    <h6 style={{ margin: 0 }}>Etiquetas</h6>
                    {!isAddingTag && (
                        <button className="section-action" onClick={() => setIsAddingTag(true)}>
                            <Edit size={14} /> <span>Editar</span>
                        </button>
                    )}
                </div>
                {tags.length > 0 && (
                    <div className="tag-list" style={{ marginTop: 6 }}>
                        {tags.map((t) => (
                            <div key={t} className="tag">
                                <span className="tag-text">{t}</span>
                                {isAddingTag && (
                                    <button className="tag-remove" onClick={() => handleRemoveTag(t)} aria-label={`Quitar ${t}`}>
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
                                onChange={(e) => setNewTag(e.target.value)}
                                placeholder="Nueva etiqueta…"
                                onKeyDown={handleKeyDown}
                                maxLength={60}
                                autoFocus
                            />
                            <div className="tag-input-actions">
                                <button className="tag-action-btn tag-add-btn" onClick={handleAddTag} disabled={!newTag.trim()} aria-label="Agregar etiqueta">
                                    <Check size={16} />
                                </button>
                                <button className="tag-action-btn tag-cancel-btn" onClick={() => { setNewTag(''); setIsAddingTag(false) }} aria-label="Cancelar edición">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default DetailPanelOptionsConversation