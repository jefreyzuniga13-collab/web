import React, { useEffect, useState } from "react";
import { InboxList } from "@/Components/Chat/InboxList";
import { ChatWindow } from "@/Components/Chat/ChatWindow";
import { ContactDetail } from "@/Components/Chat/ContactDetail";
import "@/Styles/Chat/SupportPage.css";
import { FaFilter, FaUserAlt } from "react-icons/fa";
import { useSupportPage } from "@/Hooks/Chat/useSupportPage";
import FilterOrderModal from "@/Components/Chat/FilterOrderModal";
import Input from "@/Components/Common/Input";
import { useConversations } from "@/Hooks/useConversations";
import DetailPanel from "@/Components/Chat/DetailPanel";

const SupportPage: React.FC = () => {
  const [searchConversation, setSearchConversation] = useState<string>("");

  const {
    conversation,
    setOrderModalVisible,
    saveOrder,
    filterOrder,
    DEFAULT_OPTIONS,
    orderModalVisible,
    setContactDetailToggle,
    contactDetailToggle,
    detailToggle,
    setDetailToggle,
    convId,
    isAdmin,
    handleAssignClick,
    sortedOptions,
    handleOptionChange,
    setConvId,
    filter,
    userId,
    extraerNumero,
    selectedParam,
  } = useSupportPage();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const convHook = useConversations(filter as any, searchConversation);

  useEffect(() => {
    if (!convHook.loading && convId && !convHook.conversations.some((c) => c.conversationId === convId)) {
      setConvId(null);
    }
  }, [convId, convHook.conversations, convHook.loading, setConvId]);

  useEffect(() => {
    if (!convId || conversation?.status === "Closed") setDetailToggle(false);
  }, [convId, conversation?.status, setDetailToggle]);


    //Captura de evento de esc, para cerrar la conversación.
  const handleScapePress = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setDetailToggle(false);
      setContactDetailToggle(false);
      setConvId(null);
      setSearchConversation("");
      convHook.clearFilter();
    }
  }


  useEffect(() => {
    window.addEventListener("keydown", handleScapePress);
    return () => {
      window.removeEventListener("keydown", handleScapePress);
    };
  }, []);

  return (
    <div className={`support-layout ${detailToggle && convId ? "details-open" : ""}`}>
      <aside className="sidebar">
        <div className="inbox-header">
          <div className="inbox-title-container">
            <h3 className="inbox-title">Conversaciones</h3>
            <button className="sort-button" onClick={() => setOrderModalVisible(true)} title="Ordenar filtros">
              <FaFilter className="sort-button-icon" />
            </button>
          </div>

          <div className="inbox-status__container">
            {sortedOptions.map((opt) => (
              <label key={opt.value} className="inbox-status__label">
                <input
                  id={opt.value}
                  type="radio"
                  name="filters"
                  value={opt.value}
                  checked={filter === opt.value}
                  onChange={handleOptionChange}
                  className="inbox-status__input"
                />
                {opt.content}
              </label>
            ))}
          </div>

          <div className="inbox-title-container__filter">
            <Input
              className="inbox-title-container__filter__input"
              value={searchConversation}
              onChange={(e) => setSearchConversation(e.target.value)}
              placeholder="Filtrar Conversaciones"
            />
          </div>
        </div>

        <InboxList
          selectedId={convId ?? undefined}
          onSelect={setConvId}
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
          <h2 className="main-title">
            {(convId != null && conversation?.systemDefinedCompanyName != null
              ? conversation?.systemDefinedCompanyName + " | "
              : "")}
            {(convId != null && conversation?.clientContactName != null
              ? "Contacto: " + conversation?.clientContactName + " | "
              : " ")}
            {convId != null && "Télefono: "}
            {conversation?.contactNumber == null ? "" : extraerNumero(conversation!.contactNumber)}
          </h2>

          <div className="btn-container">
            <button
              className={`assign-button ${isAdmin ? "" : "button-cerrar"} ${
                conversation?.status == "Closed" ? "btnDisabled" : ""
              } ${conversation?.status == "Incomplete" ? "btnDisabled" : ""}`}
              onClick={handleAssignClick}
            >
              <FaUserAlt size={16} /> {isAdmin ? "Asignar" : "Cerrar"}
            </button>
          </div>
        </header>

        <ChatWindow
          key={convId ?? 0}
          conversationId={convId ?? undefined}
          userId={userId}
          conversationStatus={conversation?.status}
          selectedParam={selectedParam}
          highlightTerm={searchConversation}
        />
      </main>

      <aside className="detail-aside">
        {/* {detailToggle && convId && ( */}
        {convId && (
          <DetailPanel
            key={convId}
            contactId={conversation?.clientContactId}
            selectedParam={selectedParam}
            conversationId={convId ?? undefined}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onSendNow={(txt) => (window as any).__CHAT_SEND_QUICK__?.(txt)}
          />

        )}
      </aside>

      {/* <button
        type="button"
        className={`detail-aside__handle ${detailToggle ? "is-open" : "is-closed"}`}
        onClick={() => setDetailToggle((t) => !t)}
        disabled={!convId}
        aria-label={detailToggle ? "Ocultar detalles" : "Mostrar detalles"}
        title={detailToggle ? "Ocultar detalles" : "Mostrar detalles"}
      >
        {detailToggle ? "›" : "‹"}
      </button> */}

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