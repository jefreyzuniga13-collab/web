import React, { type ChangeEvent } from "react";
import { Book, AlertCircle, Tag, Edit, X, Check, Info } from "lucide-react";
import { ConversationHistoryModal } from "@/Components/Chat/ConversationHistoryModal";
import "@/Styles/Chat/ContactDetail.css";
import { IoClose } from "react-icons/io5";
import { useContactDetail } from "@/Hooks/Chat/useContactDetail";

interface ContactDetailProps {
  conversationId?: number;
  contactDetailToggle: boolean;
  setContactDetailToggle?: (toggle: boolean) => void;
}

export const ContactDetail: React.FC<ContactDetailProps> = ({
  conversationId,
  contactDetailToggle,
  setContactDetailToggle,
}) => {
  const {
    showHistoryModal,
    newTag,
    isAddingTag,
    tags,
    conversationTone,
    conv,
    loading,
    error,
    handleKeyDown,
    handleAddTag,
    setNewTag,
    setIsAddingTag,
    setShowHistoryModal,
    handleRemoveTag,
    fetchDetail,
  } = useContactDetail(Number(conversationId));

  if (!conversationId) {
    return (
      <div className="contact-detail__empty">
        <button
          className="close-button"
          onClick={() =>
            setContactDetailToggle && setContactDetailToggle(false)
          }
          aria-label="Cerrar detalles del contacto"
        >
          <IoClose />
        </button>
        <div className="contact-detail__empty-icon">
          <Info size={24} />
        </div>
        <h3>Sin conversación seleccionada</h3>
        <p>Selecciona una conversación para ver los detalles del contacto.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="contact-detail__loading">
        <div className="loading-spinner"></div>
        <p>Cargando detalles...</p>
      </div>
    );
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
    );
  }

  if (!conv) return null;

  const createdAt = conv.createdAt
    ? new Date(conv.createdAt).toLocaleString()
    : "----------";
  // const firstResponseAt = new Date(conv.firstResponseAt).toLocaleString()
  const assignedAt = conv.assignedAt
    ? new Date(conv.assignedAt).toLocaleString()
    : "----------";
  const agentFirstMessageAt = conv.agentFirstMessageAt
    ? new Date(conv.agentFirstMessageAt).toLocaleString()
    : "----------";
  const agentLastMessageAt = conv.agentLastMessageAt
    ? new Date(conv.agentLastMessageAt).toLocaleString()
    : "----------";
  const clientLastMessageAt = conv.clientLastMessageAt
    ? new Date(conv.clientLastMessageAt).toLocaleString()
    : "----------";
  const closedAt = conv.closedAt
    ? new Date(conv.closedAt).toLocaleString()
    : "----------";
  const agentRequestAt = conv.agentRequestAt
    ? new Date(conv.agentRequestAt).toLocaleString()
    : "----------";

  const updatedAt = conv.updatedAt
    ? new Date(conv.updatedAt).toLocaleString()
    : null;
  const duration = conv.duration ?? "—";

  const statusClass = `status-indicator status-${conv.status?.toLowerCase()}`;

  return (
    <>
      <section
        className={`contact-detail ${
          contactDetailToggle ? "show-container" : ""
        }`}
        aria-label="Detalles de contacto"
      >
        <header className="contact-header">
          <div
            className={`contact-avatar conversation-tone__${conversationTone.trim()}`}
            role="img"
            aria-label="Avatar del contacto"
          ></div>
          <div className="contact-info">
            <h3 className="contact-name">
              {conv.clientContactName || "Usuario"}
            </h3>
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
            onClick={() =>
              setContactDetailToggle && setContactDetailToggle(false)
            }
            aria-label="Cerrar detalles del contacto"
          >
            <IoClose />
          </button>
        </header>

        <div className="contact-detail__body">
          <div className="contact-detail__section">
            <div className="section-header">
              <h4 className="section-title">
                <Book size={14} />
                Información principal -{" "}
                <span
                  className={`conversation-toneText__${conversationTone.trim()}`}
                >
                  {conversationTone}
                </span>
              </h4>
            </div>

            <div className="section-content">
              <ul className="info-list">
                <div className="info-list-group">
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
                      <time
                        className="info-value"
                        dateTime={conv.agentRequestAt}
                      >
                        {agentRequestAt}
                      </time>
                    </div>
                  </li>
                </div>

                <div className="info-list-group">
                  <li className="info-item">
                    <div className="info-content">
                      <span className="info-label">
                        Fecha Asignación Agente
                      </span>
                      <time className="info-value" dateTime={conv.assignedAt}>
                        {assignedAt}
                      </time>
                    </div>
                  </li>

                  <li className="info-item">
                    <div className="info-content">
                      <span className="info-label">Primer Mensaje Agente</span>
                      <time
                        className="info-value"
                        dateTime={conv.agentFirstMessageAt}
                      >
                        {agentFirstMessageAt}
                      </time>
                    </div>
                  </li>

                  <li className="info-item">
                    <div className="info-content">
                      <span className="info-label">Agente Ultimo Mensaje</span>
                      <time
                        className="info-value"
                        dateTime={conv.agentLastMessageAt}
                      >
                        {agentLastMessageAt}
                      </time>
                    </div>
                  </li>
                </div>

                <div className="info-list-group">
                  <li className="info-item">
                    <div className="info-content">
                      <span className="info-label">Cliente Ultimo Mensaje</span>
                      <time
                        className="info-value"
                        dateTime={conv.clientLastMessageAt!}
                      >
                        {clientLastMessageAt}
                      </time>
                    </div>
                  </li>

                  {updatedAt && (
                    <li className="info-item">
                      <div className="info-content">
                        <span className="info-label">Última actualización</span>
                        <time className="info-value" dateTime={conv.updatedAt!}>
                          {updatedAt}
                        </time>
                      </div>
                    </li>
                  )}

                  <li className="info-item">
                    <div className="info-content">
                      <span className="info-label">Duración</span>
                      <span className="info-value">{duration}</span>
                    </div>
                  </li>
                </div>

                <div className="info-list-group">
                  {conv.assignedByUserId && (
                    <li className="info-item">
                      <div className="info-content">
                        <span className="info-label">Asignado por</span>
                        <span className="info-value">
                          {conv.assignedByUserName}
                        </span>
                      </div>
                    </li>
                  )}

                  {conv.assignedAgentId && (
                    <li className="info-item">
                      <div className="info-content">
                        <span className="info-label">Agente asignado</span>
                        <span className="info-value info-value-highlight">
                          {conv.assignedAgentName}
                        </span>
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
                <span className="section-icon">
                  <Tag size={16} />
                </span>
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
                    {tags.map((tag) => (
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
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setNewTag(e.target.value)
                        }
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
                            setNewTag("");
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
  );
};