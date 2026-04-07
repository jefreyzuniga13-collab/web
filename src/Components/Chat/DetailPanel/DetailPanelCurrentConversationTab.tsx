import React, { useCallback, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { IoIosOptions } from "react-icons/io";
import { Check, Edit, Tag, X } from "lucide-react";
import { SetHaltedConversation } from "@/Services/chat/ConversationService";
import { useContactDetail } from "@/Hooks/Chat/useContactDetail";
import "@/Styles/Chat/DetailPanel/DetailPanelCurrentConversationTab.css";
import { RiMessengerLine } from "react-icons/ri";
import { FaInstagram } from "react-icons/fa6";
interface Props {
  conversationId: number;
  formatDate: (v?: string | number | Date | null) => string;
  isAdmin?: boolean;
}

const DetailPanelCurrentConversationTab: React.FC<Props> = ({
  conversationId,
  formatDate,
  isAdmin
}) => {
  const [showConversationOptions, setShowConversationOptions] = useState(false);

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
    // toggleHaltedLocal,
  } = useContactDetail(Number(conversationId));

  // const handleSetHaltedConversation = useCallback(async () => {
  //   if (!conv?.conversationId) return;
  //   try {
  //     await SetHaltedConversation(conv.conversationId);
  //     toggleHaltedLocal();
  //     setShowConversationOptions(false);
  //   } catch (e) {
  //     console.error(e);
  //   }
  // }, [conv, toggleHaltedLocal]);

  const handleSetHaltedConversation = useCallback(async () => {
  if (!conv?.conversationId) return;

  try {
    await SetHaltedConversation(conv.conversationId);
    // NO toggleHaltedLocal aquí
    setShowConversationOptions(false);
    // Dejas que SignalR actualice conv.isHalted
  } catch (e) {
    console.error(e);
  }
}, [conv?.conversationId]);


  return (
    <div className="detailPanel-card detailPanel-currentConv">
      <header className="detailPanel-quick__header detailPanel-currentConv__header">
        <h5 className="detailPanel-content-header__title">
          Conversación Actual
        </h5>

        {isAdmin && (
          
        <div className="detailPanel-currentConv__header-actions">
          <button
            className="btn btn--ghost detailPanel-currentConv__options-btn"
            onClick={() => {
              setShowConversationOptions((s) => !s);
            }}
            title="Opciones"
            aria-expanded={showConversationOptions}
            aria-controls="convOptions"
            type="button"
          >
            <IoIosOptions size={18} />
          </button>
        </div>

        )}
        {showConversationOptions && (
          <div
            id="convOptions"
            role="menu"
            aria-label="Opciones de conversación"
            className="conv-options detailPanel-currentConv__options-menu"
          >
            {conv?.conversationId && (
              <button
                className="menu-item detailPanel-currentConv__options-item"
                onClick={handleSetHaltedConversation}
                type="button"
              >
                {conv.isHalted
                  ? "Reanudar conversación"
                  : "Pausar conversación"}
              </button>
            )}
          </div>
        )}
      </header>

      <div className="detailPanel-currentConv__grid">
        <div className="detailPanel-contactGroup">
          <p className="detailPanel-clientGroup__title">Empresa</p>
          <span className="detailPanel-clientGroup__cliente">
            {conv?.systemDefinedCompanyName ?? "---"}
          </span>
        </div>

        <div className="detailPanel-contactGroup">
          <p className="detailPanel-clientGroup__title">Contacto</p>
          <span className="detailPanel-clientGroup__cliente">
            {conv?.clientContactName ?? "---"}
          </span>
        </div>

        <div className="detailPanel-contactGroup">
          <p className="detailPanel-clientGroup__title">Canal</p>
          <span className="detailPanel-clientGroup__cliente">
            {conv?.metaChannelId == 1 ? <FaWhatsapp className="whatsapp-icon" />
            :  conv?.metaChannelId == 2 ? <RiMessengerLine size={18} className="messenger-icon"/> 
          : <FaInstagram size={16} className="instagram-icon"/>}
          </span>
        </div>

        <div className="detailPanel-contactGroup">
          <p className="detailPanel-clientGroup__title">Numero</p>
          <span className="detailPanel-clientGroup__cliente">
            {conv?.contactNumber ?? "---"}
          </span>
        </div>

        <div className="detailPanel-contactGroup">
          <p className="detailPanel-clientGroup__title">Canal</p>
          <span className="detailPanel-clientGroup__cliente">
            <FaWhatsapp className="detailPanel-currentConv__whatsappIcon" />
          </span>
        </div>

        <div className="detailPanel-contactGroup">
          <p className="detailPanel-clientGroup__title">Estado Reciente</p>
          <span className="detailPanel-clientGroup__cliente">
            {conv?.status ?? "---"}
          </span>
        </div>

        <div className="detailPanel-contactGroup">
          <p className="detailPanel-clientGroup__title">Creado</p>
          <span className="detailPanel-clientGroup__cliente">
            {formatDate(conv?.createdAt)}
          </span>
        </div>

        <div className="detailPanel-contactGroup">
          <p className="detailPanel-clientGroup__title">Solicitud de agente</p>
          <span className="detailPanel-clientGroup__cliente">
            {formatDate(conv?.agentRequestAt)}
          </span>
        </div>

        <div className="detailPanel-contactGroup">
          <p className="detailPanel-clientGroup__title">Asignación de agente</p>
          <span className="detailPanel-clientGroup__cliente">
            {formatDate(conv?.assignedAt)}
          </span>
        </div>

        <div className="detailPanel-contactGroup">
          <p className="detailPanel-clientGroup__title">
            Primer mensaje del agente
          </p>
          <span className="detailPanel-clientGroup__cliente">
            {formatDate(conv?.agentFirstMessageAt)}
          </span>
        </div>

        <div className="detailPanel-contactGroup">
          <p className="detailPanel-clientGroup__title">
            Último mensaje del agente
          </p>
          <span className="detailPanel-clientGroup__cliente">
            {formatDate(conv?.agentLastMessageAt)}
          </span>
        </div>

        <div className="detailPanel-contactGroup">
          <p className="detailPanel-clientGroup__title">
            Último mensaje del cliente
          </p>
          <span className="detailPanel-clientGroup__cliente">
            {formatDate(conv?.clientLastMessageAt)}
          </span>
        </div>

        <div className="detailPanel-contactGroup">
          <p className="detailPanel-clientGroup__title">Última actualización</p>
          <span className="detailPanel-clientGroup__cliente">
            {formatDate(conv?.updatedAt)}
          </span>
        </div>

        <div className="detailPanel-contactGroup">
          <p className="detailPanel-clientGroup__title">Cierre</p>
          <span className="detailPanel-clientGroup__cliente">
            {formatDate(conv?.closedAt)}
          </span>
        </div>
      </div>

      {conversationTone && (
        <div className="detailPanel-contactGroup detailPanel-currentConv__tone">
          <p className="detailPanel-contactGroup__title">Tono</p>
          <span className="detailPanel-clientGroup__cliente">
            <strong
              className={`conversation-toneText__${conversationTone.trim()}`}
            >
              {conversationTone}
            </strong>
          </span>
        </div>
      )}

      <div className="detailPanel-tags detailPanel-currentConv__tags">
        <div className="detailPanel-currentConv__tags-header">
          <Tag size={16} />
          <h6 className="detailPanel-currentConv__tags-title">Etiquetas</h6>
          {!isAddingTag && (
            <button
              className="section-action detailPanel-currentConv__tags-edit"
              onClick={() => setIsAddingTag(true)}
              type="button"
            >
              <Edit size={14} /> <span>Editar</span>
            </button>
          )}
        </div>

        {tags.length > 0 && (
          <div className="tag-list detailPanel-currentConv__tag-list">
            {tags.map((t) => (
              <div key={t} className="tag">
                <span className="tag-text">{t}</span>
                {isAddingTag && (
                  <button
                    className="tag-remove"
                    onClick={() => handleRemoveTag(t)}
                    aria-label={`Quitar ${t}`}
                    type="button"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {isAddingTag && (
          <div className="tag-editor detailPanel-currentConv__tag-editor">
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
                <button
                  className="tag-action-btn tag-add-btn"
                  onClick={handleAddTag}
                  disabled={!newTag.trim()}
                  aria-label="Agregar etiqueta"
                  type="button"
                >
                  <Check size={16} />
                </button>
                <button
                  className="tag-action-btn tag-cancel-btn"
                  onClick={() => {
                    setNewTag("");
                    setIsAddingTag(false);
                  }}
                  aria-label="Cancelar edición"
                  type="button"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailPanelCurrentConversationTab;