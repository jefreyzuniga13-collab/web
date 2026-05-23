import React, { useEffect, useMemo, useState } from "react";
import { InboxList } from "@/Components/Chat/InboxList";
import { ChatWindow } from "@/Components/Chat/ChatWindow";
import { ContactDetail } from "@/Components/Chat/ContactDetail";
import { FaFilter, FaPhoneAlt, FaUserAlt } from "react-icons/fa";
// import { BiSolidBuildingHouse } from "react-icons/bi";
import { useSupportPage } from "@/Hooks/Chat/useSupportPage";
import FilterOrderModal from "@/Components/Chat/FilterOrderModal";
import Input from "@/Components/Common/Input";
import DetailPanel from "@/Components/Chat/DetailPanel";
import { Sticker } from "lucide-react";
import { useConversations } from "@/Hooks/Chat/useConversations";
import TicketModal from "@/Components/Crm/TicketModal";
import useContact from "@/Hooks/Auth/useContact";
import { setContactCartBadge } from "@/Context/Slices/Ecommerce/cartBadgeSlice";
import { getProductFromCarAsync } from "@/Context/Slices/Ecommerce/cartSlice";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/Context";
import "@/Styles/Chat/SupportPage.css";
import useLogCart from "@/Hooks/Crm/useLogCard";
import { MdContacts } from "react-icons/md";
import { IoMdCloseCircleOutline } from "react-icons/io";
import { CHANNEL } from "@/Interfaces/Wh/MetaChannelId";

export const useAppDispatch: () => AppDispatch = useDispatch;

const SupportPage: React.FC = () => {
  const [searchConversation, setSearchConversation] = useState<string>("");
  const [ticketOpen, setTicketOpen] = useState(false);
  const dispatch = useAppDispatch();

  const { fetchById, selectedData: contact } = useContact();
  const { fetchByContactId } = useLogCart();

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
    handleCloseClick,
    sortedOptions,
    handleOptionChange,
    setConvId,
    filter,
    userId,
    // extraerNumero,
    selectedParam,
    label,
    canAssign,
  } = useSupportPage();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const convHook = useConversations(filter as any, searchConversation);

  const activeConversation = useMemo(() => {
    if (!convId) return null;

    return (
      convHook.conversations.find((c) => c.conversationId === convId) ??
      conversation ??
      null
    );
  }, [convId, convHook.conversations, conversation]);

  const isClosed =
    activeConversation?.status === "Closed" ||
    activeConversation?.status === "Incomplete";

  useEffect(() => {
    if (!activeConversation?.clientContactId) return;
    fetchById(activeConversation.clientContactId);
  }, [activeConversation?.clientContactId, fetchById]);

  useEffect(() => {
    if (
      !convHook.loading &&
      convId &&
      !convHook.conversations.some((c) => c.conversationId === convId)
    ) {
      setConvId(null);
    }
  }, [convId, convHook.conversations, convHook.loading, setConvId]);

  useEffect(() => {
    const handleEscapePress = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      setContactDetailToggle(false);
      setTicketOpen(false);
      setDetailToggle(false);
      setConvId(null);
      setSearchConversation("");
      convHook.clearFilter();
    };

    window.addEventListener("keydown", handleEscapePress);

    return () => {
      window.removeEventListener("keydown", handleEscapePress);
    };
  }, [
    convHook,
    setContactDetailToggle,
    setConvId,
    setDetailToggle,
  ]);

  useEffect(() => {
    if (!convId) {
      void dispatch(
        getProductFromCarAsync({
          codCliente: contact?.id ?? 0,
          noPedido: 0,
        })
      );
      return;
    }

    if (!contact?.id) return;

    let cancelled = false;

    const loadCart = async () => {
      const log = await fetchByContactId(contact.id);
      if (cancelled) return;

      const noPedido = log?.orderId && log.orderId > 0 ? log.orderId : 0;

      const cart = await dispatch(
        getProductFromCarAsync({
          codCliente: contact.id,
          noPedido,
        })
      ).unwrap();

      if (cancelled) return;

      const arr = Array.isArray(cart) ? cart : [];

          const count = arr[0]?.listDetalle?.reduce((sum, d) => {
        // Solo sumamos si tipoComponente NO es "O"
        if (d.tipoComponente !== "O") {
          return sum + Number(d.cantidad ?? 0);
        }
        // Si es "O", retornamos el acumulador tal cual
        return sum;
      }, 0) ?? 0;

      dispatch(
        setContactCartBadge({
          contactId: contact.id,
          hasCart: count > 0,
          count,
        })
      );
    };

    void loadCart();

    return () => {
      cancelled = true;
    };
  }, [convId, contact?.id, dispatch, fetchByContactId]);

  return (
    <div className={`support-layout ${detailToggle && convId ? "details-open" : ""}`}>
      <aside className="sidebar">
        <div className="inbox-header">
          <div className="inbox-title-container">
            <h3 className="inbox-title">Conversaciones</h3>

            <div>                
                <button
                  className="sort-button"
                  onClick={() => setOrderModalVisible(true)}
                  title="Ordenar filtros"
                >
                  <FaFilter className="sort-button-icon" />
                </button>
            </div>
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
          selectedId={convId ?? 0}
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
            {/* Empresa */}
            {convId != null && activeConversation?.systemDefinedCompanyName != null ? 
               <span style={{ marginLeft: '5px', marginRight: '5px' }} className="main_header-text" >
                <MdContacts fontSize={12} className="main_header-icon" /> {activeConversation.systemDefinedCompanyName}
              </span>  : ""}
            
            {/* Contacto */}
            {convId != null && activeConversation?.clientContactName != null ? 
              <span style={{ marginLeft: '5px', marginRight: '5px' }}  className="main_header-text">
                <MdContacts fontSize={12}  className="main_header-icon"/> {activeConversation.clientContactName}
              </span> 
              : ""}
            
            {/* Telefono */}
            {convId != null && activeConversation?.contactNumber != null ? 
              <span style={{ marginLeft: '5px', marginRight: '5px',  }}  className="main_header-text">
                 <FaPhoneAlt fontSize={12} className="main_header-icon" /> {activeConversation.contactNumber}
              </span> 
              : ""}
          </h2>


          <div className="btn-container">
            {convId && contact?.clienteCodigo && (
              <button
                className="crearTicket-button"
                onClick={() => setTicketOpen(true)}
              >
                <Sticker size={16} /> Crear Ticket
              </button>
            )}
            {convId && (
              
              <div className={`inbox-list__action ${isClosed ? "btnDisabled" : ""}`}>
              <button className={`close-btn`} onClick={handleCloseClick}>
                <IoMdCloseCircleOutline size={14} /> Cerrar
              </button>
            

              <button
                className={`assign-button ${!canAssign ? "button-cerrar" : ""} ${isClosed ? "btnDisabled" : ""}`}
                onClick={handleAssignClick}
                disabled={isClosed}
              >
                <FaUserAlt size={16} /> {label}
              </button>

              </div>
            )}
          </div>
        </header>

        <ChatWindow
          conversationId={convId ?? undefined}
          userId={userId}
          conversationStatus={activeConversation?.status}
          selectedParam={selectedParam}
          highlightTerm={searchConversation}
          validFrom={convHook.form.validFrom}
          validTo={convHook.form.validTo}
        />
      </main>

      <aside className="detail-aside">
        {detailToggle && convId && (
          <DetailPanel
            contactId={activeConversation?.clientContactId}
            selectedParam={selectedParam}
            conversationId={convId ?? 0}
           metaChannel={activeConversation?.metaChannelId === CHANNEL.Whatsapp ? "WhatsApp" : activeConversation?.metaChannelId === CHANNEL.Messenger ? "Messenger" : "Instagram"}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onSendNow={(txt) => (window as any).__CHAT_SEND_QUICK__?.(txt)}
            isAdmin={isAdmin}
          />
        )}
      </aside>

      <button
        type="button"
        className={`detail-aside__handle ${detailToggle ? "is-open" : "is-closed"}`}
        onClick={() => setDetailToggle((t) => !t)}
        disabled={!convId}
        aria-label={detailToggle ? "Ocultar detalles" : "Mostrar detalles"}
        title={detailToggle ? "Ocultar detalles" : "Mostrar detalles"}
      >
        {detailToggle ? "›" : "‹"}
      </button>

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
          handleOptionChange={handleOptionChange}
          sortedOptions={sortedOptions}
          filter={filter}
        />
      )}

      {ticketOpen &&
        convId &&
        contact?.isVerified &&
        activeConversation &&
        contact?.clienteCodigo && (
          <TicketModal
            isOpen={ticketOpen}
            onClose={() => setTicketOpen(false)}
            conversationId={activeConversation.conversationId}
            codCliente={contact.clienteCodigo ?? ""}
            clientName={contact.clienteNombre ?? ""}
            contactId={contact.id}
          />
        )}
    </div>
  );
};

export default SupportPage;