import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Tooltip } from "@mui/material";
import { MdAssignmentInd } from "react-icons/md";
import { Building2, Contact, ListFilter, Phone, Users } from "lucide-react";
import { IoMdCloseCircleOutline, IoMdHourglass } from "react-icons/io";
import { LuLoaderCircle } from "react-icons/lu";
import { InboxList } from "@/Components/Chat/InboxList";
import { ChatWindow } from "@/Components/Chat/ChatWindow";
import { ContactDetail } from "@/Components/Chat/ContactDetail";
import FilterOrderModal from "@/Components/Chat/FilterOrderModal";
import CompanyModalFilter from "@/Components/Chat/CompanyModalFilter";
import DetailPanel from "@/Components/Chat/DetailPanel";
import BulkAssignmentModal from "@/Components/Chat/BulkAssignmentModal";
import Input from "@/Components/Common/Input";
import { useSupportPage } from "@/Hooks/Chat/useSupportPage";
import { useConversations, type Filter } from "@/Hooks/Chat/useConversations";
import useContact from "@/Hooks/Auth/useContact";
import { useCompanySystemParamValue } from "@/Hooks/Crm/useCompanySystemParamValue";
import type { AppDispatch, RootState } from "@/Context";
import { selectCompanySistema } from "@/Context/Slices/Auth/authSlice";
import { CHANNEL } from "@/Interfaces/Wh/MetaChannelId";
import { getLicenseMessage } from "@/Utils/ECommerce/formatters";
import { isValidSaleCompany } from "@/Utils/isValidSaleCompany";
import { LICENSE_WARNING_MESSAGE_PARAM_ID } from "@/Constants/systemParams";

import "@/Styles/Chat/SupportPage.css";

export const useAppDispatch: () => AppDispatch = useDispatch;

const MOBILE_QUERY = "(max-width: 768px)";

const SupportPage: React.FC = () => {
  const [searchConversation, setSearchConversation] = useState<string>("");
  const [bulkAssignmentOpen, setBulkAssignmentOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(false);

  const [mobileChatVisible, setMobileChatVisible] = useState(false);
  const chatHistoryPushedRef = useRef(false);

  const { isRoot, licenseExpireAt, showLicenseWarning } = useSelector(
    (state: RootState) => state.auth,
  );

  const companySistema = useSelector(selectCompanySistema);

  const { fetchById, selectedData: contact } = useContact(undefined, {
    loadList: false,
  });

  const {
    conversation,
    setConversationSnapshot,

    setOrderModalVisible,
    orderModalVisible,

    saveOrder,
    filterOrder,
    DEFAULT_OPTIONS,
    sortedOptions,

    setContactDetailToggle,
    contactDetailToggle,

    detailToggle,
    setDetailToggle,

    convId,
    setConvId,

    isAdmin,
    userId,

    handleAssignClick,
    handleCloseClick,

    handleOptionChange,

    filter,
    selectedParam,

    label,
    canAssign,

    showCompanyModal,
    setShowCompanyModal,

    agentOptions,
    loadingAgents,

    isClosing,
  } = useSupportPage();

  const { value: licenseWarningMessageParam } = useCompanySystemParamValue(
    LICENSE_WARNING_MESSAGE_PARAM_ID,
    showLicenseWarning,
  );

  const convHook = useConversations(filter as Filter, searchConversation);

  /**
   * Obtiene la conversación seleccionada desde la lista
   * en tiempo real. Si todavía no existe ahí, utiliza
   * la conversación obtenida por el hook principal.
   */
  const activeConversation = useMemo(() => {
    if (!convId) return null;

    return (
      convHook.conversations.find((item) => item.conversationId === convId) ??
      conversation ??
      null
    );
  }, [convId, convHook.conversations, conversation]);

  /**
   * Evita utilizar accidentalmente el contacto de una
   * conversación seleccionada anteriormente.
   */
  const activeContact = useMemo(() => {
    if (!contact || !activeConversation?.clientContactId) {
      return null;
    }

    return contact.id === activeConversation.clientContactId
      ? contact
      : null;
  }, [activeConversation?.clientContactId, contact]);


  const isClosed =
    activeConversation?.status === "Closed" ||
    activeConversation?.status === "Incomplete";

  const canShowSaleDetail = isValidSaleCompany(companySistema);

  const licenseWarningMessage = useMemo(() => {
    return getLicenseMessage(licenseExpireAt, licenseWarningMessageParam);
  }, [licenseExpireAt, licenseWarningMessageParam]);

  /**
   * Detecta si la interfaz se encuentra
   * en modo móvil.
   */
  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_QUERY);

    const syncMobile = (): void => {
      setIsMobile(mediaQuery.matches);

      if (!mediaQuery.matches) {
        setMobileChatVisible(false);
      }
    };

    syncMobile();

    mediaQuery.addEventListener("change", syncMobile);

    return () => {
      mediaQuery.removeEventListener("change", syncMobile);
    };
  }, []);

  const blurActiveField = (): void => {
    const active = document.activeElement;

    if (active instanceof HTMLElement) {
      active.blur();
    }
  };

  const closeMobileChat = useCallback((): void => {
    blurActiveField();
    setMobileChatVisible(false);
    setDetailToggle(false);
    setContactDetailToggle(false);
  }, [setContactDetailToggle, setDetailToggle]);

  useEffect(() => {
    const root = document.documentElement;

    const syncViewport = (): void => {
      const viewport = window.visualViewport;
      const height = viewport?.height ?? window.innerHeight;

      root.style.setProperty("--app-vvh", `${Math.round(height)}px`);

      if (root.classList.contains("mobile-chat-open")) {
        window.scrollTo(0, 0);
      }
    };

    syncViewport();
    window.visualViewport?.addEventListener("resize", syncViewport);
    window.visualViewport?.addEventListener("scroll", syncViewport);
    window.addEventListener("resize", syncViewport);

    return () => {
      window.visualViewport?.removeEventListener("resize", syncViewport);
      window.visualViewport?.removeEventListener("scroll", syncViewport);
      window.removeEventListener("resize", syncViewport);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const shouldLock = isMobile && mobileChatVisible;

    root.classList.toggle("mobile-chat-open", shouldLock);

    return () => {
      root.classList.remove("mobile-chat-open");
    };
  }, [isMobile, mobileChatVisible]);

  useEffect(() => {
    const handlePopState = (): void => {
      if (!chatHistoryPushedRef.current && !mobileChatVisible) {
        return;
      }

      chatHistoryPushedRef.current = false;
      closeMobileChat();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [closeMobileChat, mobileChatVisible]);

  /**
   * El contacto es información secundaria.
   *
   * Se consulta únicamente cuando se abre el panel de detalle.
   * Así, seleccionar una conversación prioriza la carga del chat.
   */
  useEffect(() => {
    const contactId = activeConversation?.clientContactId;

    if (!detailToggle || !contactId) return;
    if (activeContact?.id === contactId) return;

    void fetchById(contactId);
  }, [
    activeContact?.id,
    activeConversation?.clientContactId,
    detailToggle,
    fetchById,
  ]);

  /**
   * Si la conversación desaparece de la lista,
   * limpia la selección actual.
   */
  useEffect(() => {
    if (
      !convHook.loading &&
      convId &&
      !convHook.conversations.some((item) => item.conversationId === convId)
    ) {
      setConvId(null);
      setConversationSnapshot(null);
      setDetailToggle(false);

      if (chatHistoryPushedRef.current) {
        chatHistoryPushedRef.current = false;
        window.history.back();
      } else {
        setMobileChatVisible(false);
      }
    }
  }, [
    convId,
    convHook.conversations,
    convHook.loading,
    setConvId,
    setConversationSnapshot,
    setDetailToggle,
  ]);

  /**
   * Cierra paneles o la conversación seleccionada
   * cuando se presiona Escape.
   */
  useEffect(() => {
    const handleEscapePress = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") return;

      if (bulkAssignmentOpen) {
        setBulkAssignmentOpen(false);
        return;
      }

      if (isMobile && mobileChatVisible) {
        if (chatHistoryPushedRef.current) {
          chatHistoryPushedRef.current = false;
          window.history.back();
        }

        closeMobileChat();
        return;
      }

      setContactDetailToggle(false);
      setDetailToggle(false);

      if (convId) {
        setConvId(null);
        setConversationSnapshot(null);
      }
    };

    window.addEventListener("keydown", handleEscapePress);

    return () => {
      window.removeEventListener("keydown", handleEscapePress);
    };
  }, [
    bulkAssignmentOpen,
    closeMobileChat,
    convId,
    isMobile,
    mobileChatVisible,
    setContactDetailToggle,
    setConvId,
    setConversationSnapshot,
    setDetailToggle,
  ]);

  /**
   * Selecciona una conversación usando la información que
   * ya se encuentra disponible en la lista paginada.
   *
   * El snapshot permite asignar y cerrar sin ejecutar
   * nuevamente GET /Conversations/{id}.
   */
  const handleSelectConversation = useCallback(
    (id: number | null): void => {
      const selectedConversation =
        id === null
          ? null
          : convHook.conversations.find(
              (item) => item.conversationId === id,
            ) ?? null;

      setConvId(id);
      setConversationSnapshot(selectedConversation);
      setDetailToggle(false);
      setContactDetailToggle(false);

      if (isMobile && id) {
        setMobileChatVisible(true);

        if (!chatHistoryPushedRef.current) {
          window.history.pushState({ mobileChat: true }, "");
          chatHistoryPushedRef.current = true;
        }
      } else if (isMobile) {
        closeMobileChat();
      }
    },
    [
      convHook.conversations,
      isMobile,
      setContactDetailToggle,
      setConversationSnapshot,
      setConvId,
      setDetailToggle,
      closeMobileChat,
    ],
  );

  /**
   * Regresa desde el chat móvil
   * hacia la lista de conversaciones.
   */
  const handleMobileBack = (): void => {
    if (chatHistoryPushedRef.current) {
      chatHistoryPushedRef.current = false;
      window.history.back();
      closeMobileChat();
      return;
    }

    closeMobileChat();
  };

  /**
   * Abre o cierra el detalle
   * desde la vista móvil.
   */
  const handleMobileToggleDetail = (): void => {
    if (!convId) return;

    setDetailToggle((current) => !current);
  };

  const layoutClassName = [
    "support-layout",
    detailToggle && convId ? "details-open" : "",
    isMobile && mobileChatVisible ? "support-layout--mobile-chat" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={layoutClassName}>
      <aside className="sidebar">
        <div className="inbox-header">
          <Input
            className="inbox-title-container__filter__input"
            value={searchConversation}
            onChange={(event) => setSearchConversation(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.stopPropagation();
              }
            }}
            placeholder="Filtrar conversaciones"
          />

          <div className="inbox-title__headerfilters">
            {isRoot && (
              <Tooltip title="Filtrar por empresa">
                <button
                  className="sort-button"
                  onClick={() => setShowCompanyModal(true)}
                  type="button"
                >
                  <Building2 className="sort-button-icon" size={19} strokeWidth={1.8} />
                </button>
              </Tooltip>
            )}

            {(isRoot || isAdmin) && (
              <Tooltip title="Asignar conversaciones">
                <button
                  className="sort-button"
                  onClick={() => setBulkAssignmentOpen(true)}
                  type="button"
                >
                  <Users className="sort-button-icon" size={19} strokeWidth={1.8} />
                </button>
              </Tooltip>
            )}

            <Tooltip title="Filtrar conversaciones">
              <span>
                <button
                  className="sort-button"
                  onClick={() => setOrderModalVisible(true)}
                  type="button"
                >
                  <ListFilter className="sort-button-icon" size={19} strokeWidth={1.8} />
                </button>
              </span>
            </Tooltip>
          </div>
        </div>

        <InboxList
          selectedId={convId ?? 0}
          onSelect={handleSelectConversation}
          conversations={convHook.conversations}
          loading={convHook.loading}
          error={convHook.error ?? undefined}
          page={convHook.page}
          pagination={convHook.pagination}
          onPageChange={convHook.onPageChange}
        />
      </aside>

      <main className="main-content">
        {showLicenseWarning && (
          <div className="main-license__container">
            <IoMdHourglass fontSize={12} className="main-license__icon" />

            <span className="main-license__text">{licenseWarningMessage}</span>
          </div>
        )}

        <header className="main-header">
          <h2 className="main-title">
            {convId !== null &&
            (activeConversation?.systemDefinedCompanyName ||
              activeConversation?.clientContactName) ? (
              <span className="main_header-text">
                <Contact size={17} strokeWidth={1.8} className="main_header-icon" />
                {activeConversation.systemDefinedCompanyName
                  ? ` ${activeConversation.systemDefinedCompanyName}`
                  : ""}
                {activeConversation.systemDefinedCompanyName &&
                activeConversation.clientContactName
                  ? " · "
                  : ""}
                {activeConversation.clientContactName
                  ? ` ${activeConversation.clientContactName}`
                  : ""}
              </span>
            ) : (
              ""
            )}

            {convId !== null && activeConversation?.contactNumber != null ? (
              <span className="main_header-text">
                <Phone size={17} strokeWidth={1.8} className="main_header-icon" />{" "}
                {activeConversation.contactNumber}
              </span>
            ) : (
              ""
            )}
          </h2>

          <div className="btn-container">
            {convId && (
              <div
                className={`inbox-list__action ${
                  isClosed ? "btnDisabled" : ""
                }`}
              >
                <button
                  className="close-btn"
                  onClick={() => {
                    if (isClosed || isClosing) return
                    void handleCloseClick()
                  }}
                  type="button"
                  disabled={isClosed || isClosing}
                  aria-busy={isClosing}
                >
                  {isClosing ? (
                    <>
                      <LuLoaderCircle
                        size={14}
                        className="button-loading-icon"
                      />

                      <span>Cerrando...</span>
                    </>
                  ) : (
                    <>
                      <IoMdCloseCircleOutline size={14} />

                      <span>Cerrar</span>
                    </>
                  )}
                </button>

                <button
                  className={[
                    "assign-button",
                    !canAssign ? "button-cerrar" : "",
                    isClosed ? "btnDisabled" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={handleAssignClick}
                  type="button"
                  disabled={isClosed || isClosing || loadingAgents}
                >
                  {canAssign ? (
                    <MdAssignmentInd size={14} />
                  ) : (
                    <IoMdCloseCircleOutline size={14} />
                  )}
                  <span>{label}</span>
                </button>
              </div>
            )}
          </div>
        </header>

        <ChatWindow
          conversationId={convId ?? 0}
          userId={userId}
          conversationStatus={activeConversation?.status ?? null}
          selectedParam={selectedParam}
          highlightTerm={searchConversation}
          validFrom={convHook.appliedRange.validFrom}
          validTo={convHook.appliedRange.validTo}
          showMobileBackButton={isMobile && mobileChatVisible}
          onMobileBack={handleMobileBack}
          showMobileActions={isMobile && mobileChatVisible && Boolean(convId)}
          mobileAssignLabel={label}
          mobileCanAssign={canAssign}
          mobileIsClosed={isClosed}
          mobileIsClosing={isClosing}
          onMobileClose={() => {
            if (isClosed || isClosing) return
            void handleCloseClick()
          }}
          onMobileAssign={handleAssignClick}
          showMobileDetailButton={
            isMobile &&
            mobileChatVisible &&
            Boolean(convId) &&
            canShowSaleDetail
          }
          mobileDetailOpen={detailToggle}
          onMobileToggleDetail={handleMobileToggleDetail}
        />
      </main>

      <aside className="detail-aside">
        {detailToggle && convId && canShowSaleDetail && (
          <DetailPanel
            contactId={activeConversation?.clientContactId}
            selectedParam={selectedParam}
            conversationId={convId}
            metaChannel={
              activeConversation?.metaChannelId === CHANNEL.Whatsapp
                ? "WhatsApp"
                : activeConversation?.metaChannelId === CHANNEL.Messenger
                  ? "Messenger"
                  : "Instagram"
            }
            isAdmin={isAdmin}
          />
        )}
      </aside>

      {canShowSaleDetail && (
        <button
          type="button"
          className={`detail-aside__handle ${
            detailToggle ? "is-open" : "is-closed"
          }`}
          onClick={() => setDetailToggle((current) => !current)}
          disabled={!convId || isClosing}
          aria-label={detailToggle ? "Ocultar detalles" : "Mostrar detalles"}
          title={detailToggle ? "Ocultar detalles" : "Mostrar detalles"}
        >
          {detailToggle ? "›" : "‹"}
        </button>
      )}

      {contactDetailToggle && (
        <div className="modal-overlay">
          <aside className="info-sidebar">
            <ContactDetail
              conversationId={convId ?? 0}
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
          handleAgentChange={convHook.handleAgentChange}
          applyDateFilter={convHook.applyDateFilter}
          clearFilter={convHook.clearFilter}
          handleOptionChange={handleOptionChange}
          sortedOptions={sortedOptions}
          filter={filter}
          agentOptions={agentOptions}
          loadingAgents={loadingAgents}
        />
      )}

      {showCompanyModal && (
        <CompanyModalFilter onClose={() => setShowCompanyModal(false)} />
      )}

      {bulkAssignmentOpen && (
        <BulkAssignmentModal
          isOpen={bulkAssignmentOpen}
          onClose={() => setBulkAssignmentOpen(false)}
          onCompleted={() => {
            convHook.applyDateFilter();
          }}
        />
      )}
    </div>
  );
};

export default SupportPage;