import React, { useState } from "react";

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
import Input from "@/Components/Common/Input";
import { useConversations } from "@/Hooks/useConversations";

const SupportPage: React.FC = () => {

  const [searchConversation, setSearchConversation] = useState<string>('')
  const {
    conversation,
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
    extraerNumero,
    selectedParam
  } = useSupportPage();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const convHook = useConversations(filter as any, searchConversation);
  
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

        {/* Puede habr agente asignado o no. Se deve de selecciona a uno al hazar */}
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

          <div className="inbox-title-container__filter">
              {/* <h3 className="inbox-title">Filtrar</h3> */}
             <Input className="inbox-title-container__filter__input" value={searchConversation} onChange={e=> setSearchConversation(e.target.value)}
             placeholder="Filtrar Conversaciones"/>
          </div>
        </div>

        <InboxList
          selectedId={convId ?? undefined}
          onSelect={setConvId}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          // filter={filter as any}
          // searchConversation={searchConversation}

          conversations={convHook.conversations}
          loading={convHook.loading}
          error={convHook.error}
          page={convHook.page}
          pagination={convHook.pagination}
          onPageChange={convHook.onPageChange}
        />
      </aside>

      <main className="main-content">
        <header className="main-header">
          <h2 className="main-title">{(convId != null && conversation?.systemDefinedCompanyName != null ? (conversation?.systemDefinedCompanyName + " | ") : "")} {(convId != null && conversation?.clientContactName != null ? ("Contacto: " + conversation?.clientContactName) + " | " : " ")}
          {convId != null && ("Télefono: ")} {conversation?.contactNumber == null ? "" : extraerNumero(conversation!.contactNumber)}</h2>
          
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
              className={`assign-button ${isAdmin ? "" : "button-cerrar"} ${conversation?.status == "Closed" ? "btnDisabled" : ""}
              ${conversation?.status == "Incomplete" ? "btnDisabled" : ""}`}
              // disabled={!convId || conversation?.status == "Closed" || conversation?.status == "Incomplete"}
              onClick={handleAssignClick}
            >
              <FaUserAlt size={16} /> {isAdmin ? "Asignar" : "Cerrar"}
            </button>
          </div>
        </header>

        <ChatWindow conversationId={convId ?? undefined} 
        userId={userId} conversationStatus={conversation?.status} selectedParam={selectedParam}/>
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
          form={convHook.form}
          handleDate={convHook.handleDate}
          applyDateFilter={convHook.applyDateFilter}
          clearFilter={convHook.clearFilter}
        />
      )}
    </div>
  );
};

export default SupportPage;