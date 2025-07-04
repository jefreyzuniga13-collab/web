import React from "react";

import { InboxList } from "@/Components/Chat/InboxList";
import { ChatWindow } from "@/Components/Chat/ChatWindow";
import { ContactDetail } from "@/Components/Chat/ContactDetail";
import { ConversationHistoryModal } from "@/Components/Chat/ConversationHistoryModal";
import "@/Styles/Chat/SupportPage.css";
import { FaFilter } from "react-icons/fa";
import { RiChatHistoryFill } from "react-icons/ri";
import { FaUserAlt, FaClipboard } from "react-icons/fa";
import { useSupportPage } from "@/Hooks/Chat/useSupportPage";
import FilterOrderModal from "@/Components/Chat/FilterOrderModal";

const SupportPage: React.FC = () => {
  const {
    setOrderModalVisible,
    saveOrder,
    filterOrder,
    DEFAULT_OPTIONS,
    orderModalVisible,
    setShowHistoryModal,
    showHistoryModal,
    setContactDetailToggle,
    contactDetailToggle,
    convId,
    isAdmin,
    handleAssignClick,
    sortedOptions,
    handleOptionChange,
    setConvId,
    filter,
    userId,
  } = useSupportPage();
  return (
    <div className="support-layout">
      <aside className="sidebar">
        <div className="inbox-header">
          <div className="inbox-title-container">
            <h3 className="inbox-title">Conversaciones</h3>
            <button
              className="sort-button"
              onClick={() => setOrderModalVisible(true)}
              title="Ordenar filtros"
            >
              <FaFilter className="sort-button-icon" />
            </button>
          </div>

          <div className="inbox-status__container">
            {sortedOptions.map((opt) => (
              <>
                <input
                  id={opt.value}
                  type="radio"
                  name="filters"
                  value={opt.value}
                  checked={filter === opt.value}
                  onChange={handleOptionChange}
                  className="inbox-status__input"
                />
                <label htmlFor={opt.value} className="inbox-status__label">
                  {opt.content}
                </label>
              </>
            ))}
          </div>
        </div>

        <InboxList
          selectedId={convId ?? undefined}
          onSelect={setConvId}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          filter={filter as any}
        />
      </aside>

      <main className="main-content">
        <header className="main-header">
          <h2 className="main-title">Chat</h2>
          <div className="btn-container">
            {convId && (
              <>
                <button
                  className={`contact-detail-button ${
                    convId ? "active" : "disabled"
                  }`}
                  onClick={() => setShowHistoryModal(true)}
                  disabled={!convId}
                >
                  <RiChatHistoryFill size={16} /> Historial
                </button>
                <button
                  className={`contact-detail-button ${
                    convId ? "active" : "disabled"
                  }`}
                  onClick={() => setContactDetailToggle((t) => !t)}
                  disabled={!convId}
                >
                  <FaClipboard size={16} /> Detalles
                </button>
              </>
            )}
            <button
              className={`assign-button ${isAdmin ? "" : "button-cerrar"}`}
              disabled={!convId}
              onClick={handleAssignClick}
            >
              <FaUserAlt size={16} /> {isAdmin ? "Asignar" : "Cerrar"}
            </button>
          </div>
        </header>

        <ChatWindow conversationId={convId ?? undefined} userId={userId} />
      </main>

      {contactDetailToggle && (
        <div className="modal-overlay">
          <aside className="info-sidebar">
            <ContactDetail
              conversationId={convId ?? undefined}
              contactDetailToggle={contactDetailToggle}
              setContactDetailToggle={setContactDetailToggle}
            />
          </aside>
        </div>
      )}

      <ConversationHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        conversationId={convId || 0}
      />

      {orderModalVisible && (
        <FilterOrderModal
          currentOrder={filterOrder}
          options={DEFAULT_OPTIONS}
          onSave={(newOrder) => {
            saveOrder(newOrder);
            setOrderModalVisible(false);
          }}
          onClose={() => setOrderModalVisible(false)}
        />
      )}
    </div>
  );
};

export default SupportPage;