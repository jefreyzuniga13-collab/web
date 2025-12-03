/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ThreeDot } from "react-loading-indicators";

import "@/Styles/Chat/DetailPanel.css";

import { useDetailPanel } from "@/Hooks/Chat/useDetailPanel";
import useConversations from "@/Hooks/Conversation/useConversations";

import DetailPanelHeaderTabs from "@/Components/Chat/DetailPanel/DetailPanelHeaderTabs";
import DetailPanelHistoryTab, {
  type ConversationRow,
} from "@/Components/Chat/DetailPanel/DetailPanelHistoryTab";
import DetailPanelCurrentConversationTab from "@/Components/Chat/DetailPanel/DetailPanelCurrentConversationTab";
import DetailPanelOptionsClient from "@/Components/Chat/DetailPanelOptionsClient";
import DetailPanelOptionsContact from "@/Components/Chat/DetailPanelOptionsContact";
import DetailPanelMensajesRapidos from "@/Components/Chat/DetailPanelMensajesRapidos";
import CredentialsModal from "@/Components/Chat/DetailPanel/CredentialsModal";
import DeviceModal from "@/Components/Chat/DetailPanel/DeviceModal";
import SystemPickerModal from "@/Components/Chat/DetailPanel/SystemPickerModal";
import ClientEditModal from "@/Components/Chat/DetailPanel/ClientEditModal";
import { Trunc, Row } from "@/Components/Chat/DetailPanel/DetailPanelCommon";
import ConversationHistoryModal from "@/Components/Chat/ConversationHistoryModal";
import {ProductTab} from '@/Components/Chat/DetailPanel/ProductTab'
import CarPCPanelTab from "@/Components/Chat/DetailPanel/CarPCPanelTab";

type Props = {
  contactId?: number;
  conversationId?: number;
  selectedParam?: unknown;
  isAdmin?: boolean;
  onSendNow?: (txt: string) => void | Promise<void>;
};

const DetailPanel: React.FC<Props> = ({
  contactId,
  conversationId,
  selectedParam,
  onSendNow,
  isAdmin
}) => {
  const {
    optionMenu,
    setOptionMenu,
    selectedData,
    client,
    clienteCodigo,
    loading,

    qQuick,
    setQQuick,
    filteredQuick,
    handleSendQuick,

    showMore,
    setShowMore,
    moreTab,
    setMoreTab,

    credSearch,
    setCredSearch,
    devSearch,
    setDevSearch,
    sysSearch,
    setSysSearch,
    filteredDevs,
    filteredSystems,

    addDeviceOpen,
    setAddDeviceOpen,
    newDevice,
    setNewDevice,
    createDevice,
    deviceErrors,
    setDeviceErrors,

    pickSysOpen,
    setPickSysOpen,
    newSystem,
    setNewSystem,
    addPickedSystem,
    sysCatalog,
    sysPage,
    sysPageSize,
    sysTotal,
    fetchSysPage,
    setSysPage,
    setSysPageSize,
    sysGlobalFilter,
    setSysGlobalFilter,
    openSystemPicker,

    clientEditOpen,
    setClientEditOpen,
    clientLocal,
    clientEdit,
    handleChange,
    handleNumberChange,
    saveClientEdits,

    formatNiPhone,
    displayOrDash,
    formatDate,

    credentials,
    credModalOpen,
    setCredModalOpen,
    credMode,
    credScope,
    setCredScope,
    deviceTargetId,
    setDeviceTargetId,
    systemTargetId,
    setSystemTargetId,
    credReq,
    setCredReq,
    credErrors,
    openCredCreate,
    openCredView,
    openCredEdit,
    saveCred,

    catCredential,
  } = useDetailPanel(contactId, selectedParam);

  const hasClient = !!clienteCodigo && !!client;

  const {
    loading: loadingHistory,
    exportConversationHistoryToPDFAsync,
    GetConversationByClientPaginationAsync,
    totalCount,
    data: conversations,
  } = useConversations();

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryConversationId, setSelectedHistoryConversationId] = useState<number | null>(null);
  const [selectedHistoryConversationStart, setSelectedHistoryConversationStart] = useState<string | null>(null);
  const [selectedHistoryContactId, setSelectedHistoryContactId] = useState<number | null>(null);

  const [convFrom, setConvFrom] = useState<string>("");
  const [convTo, setConvTo] = useState<string>("");
  const [convQuery, setConvQuery] = useState<string>("");
  const [convPage, setConvPage] = useState(1);
  const convPageSize = 20;

  const [convRows, setConvRows] = useState<ConversationRow[]>([]);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const totalPages = useMemo(
    () =>
      convPageSize
        ? Math.max(1, Math.ceil((totalCount ?? 0) / convPageSize))
        : 1,
    [totalCount, convPageSize]
  );

  useEffect(() => {
    if (optionMenu !== 3) return;
    if (!clienteCodigo) return;

    GetConversationByClientPaginationAsync({
      clientCode: clienteCodigo,
      from: convFrom || null,
      to: convTo || null,
      searchConversation: convQuery || null,
      page: convPage,
      pageSize: convPageSize,
    });
  }, [
    optionMenu,
    clienteCodigo,
    convFrom,
    convTo,
    convQuery,
    convPage,
    convPageSize,
    GetConversationByClientPaginationAsync,
  ]);

  useEffect(() => {
    if (!conversations || !Array.isArray(conversations)) {
      if (convPage === 1) setConvRows([]);
      return;
    }

    setConvRows(prev => {
      const mapped = (conversations as any[]).map(c => ({
        id: c.conversationId ?? c.id,
        createdAt: c.createdAt,
        contactName: c.clientContactName || c.contactName,
        agent: c.assignedAgentName || "—",
        status: c.status || "—",
        contactId: c.clientContactId ?? c.contactId,
        rating: c.rating
      }));

      if (convPage === 1) return mapped;

      const prevIds = new Set(prev.map(r => r.id));
      const newOnes = mapped.filter(r => !prevIds.has(r.id));
      return [...prev, ...newOnes];
    });
  }, [conversations, convPage]);

  useEffect(() => {
    setConvFrom("");
    setConvTo("");
    setConvQuery("");
    setConvPage(1);
    setConvRows([]);
  }, [contactId, clienteCodigo]);

  const onSubmitFilters = useCallback(() => {
    setConvPage(1);
  }, []);

  const handleConvScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const atBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < 10 &&
        convPage < totalPages;

      if (atBottom && !loadingHistory) {
        setConvPage(p => Math.min(totalPages, p + 1));
      }
    },
    [convPage, totalPages, loadingHistory]
  );

const openHistoryModal = useCallback((row: ConversationRow) => {
  setSelectedHistoryConversationId(row.id);
  // normalizamos fecha a yyyy-MM-dd (para el <input type="date">)
  const iso = (() => {
    if (!row.createdAt) return new Date().toISOString();

    if (typeof row.createdAt === "string") return row.createdAt;

    if (row.createdAt instanceof Date) return row.createdAt.toISOString();

    return new Date().toISOString();
  })();


  const onlyDate = iso.slice(0, 10); // "2025-11-16"
  setSelectedHistoryConversationStart(onlyDate);
  setSelectedHistoryContactId(row.contactId);
  setShowHistoryModal(true);
}, []);

  const handleExportPdf = useCallback(
    async (args: {
      contactId: number;
      conversationId?: number | null;
      from: string | null;
      to: string | null;
      title: string;
      subtitle: string;
    }) => {
      setLoadingPdf(true);
      try {
        await exportConversationHistoryToPDFAsync(args);
      } finally {
        setLoadingPdf(false);
      }
    },
    [exportConversationHistoryToPDFAsync]
  );

  if (loading) {
    return (
      <div className="loader-container">
        <ThreeDot color="#0070B4" size="medium" />
      </div>
    );
  }


  return (
    <div
      key={`${contactId ?? "c"}-${conversationId ?? "v"}-${
        selectedParam ?? ""
      }`}
      className="detailPanel-container"
    >
      <DetailPanelHeaderTabs
        optionMenu={optionMenu}
        onSelectTab={setOptionMenu}
      />

      <section className="detailPanel-content detailPanel-content--padded">
        {optionMenu === 1 &&
          (hasClient ? (
            <DetailPanelOptionsClient
              displayOrDash={displayOrDash}
              formatDate={formatDate}
              formatNiPhone={formatNiPhone}
              clientLocal={clientLocal}
              setShowMore={setShowMore}
              setClientEditOpen={setClientEditOpen}
              isAdmin={isAdmin}
            />
          ) : (
            <div className="detailPanel-emptyState">
              Esta conversación no tiene un cliente asociado.
            </div>
          ))}

        {optionMenu === 2 &&
          (selectedData ? (
            <DetailPanelOptionsContact
              displayOrDash={displayOrDash}
              formatDate={formatDate}
              formatNiPhone={formatNiPhone}
              selectedData={selectedData}
            />
          ) : (
            <div className="detailPanel-emptyState">
              No hay datos de contacto para esta conversación.
            </div>
          ))}

        {optionMenu === 3 && (
          <DetailPanelHistoryTab
            convRows={convRows}
            convFrom={convFrom}
            convTo={convTo}
            convQuery={convQuery}
            onChangeFrom={setConvFrom}
            onChangeTo={setConvTo}
            onChangeQuery={setConvQuery}
            onSubmitFilters={onSubmitFilters}
            handleConvScroll={handleConvScroll}
            totalCount={totalCount}
            convPage={convPage}
            totalPages={totalPages}
            loadingPdf={loadingPdf}
            formatDate={formatDate}
            exportConversationHistoryToPDFAsync={handleExportPdf}
            onOpenHistoryModal={openHistoryModal}
           
          />
        )}

        {optionMenu === 4 && (
          <DetailPanelCurrentConversationTab
            conversationId={Number(conversationId)}
            formatDate={formatDate}
             isAdmin={isAdmin}
          />
        )}

        {optionMenu === 5 && (
          <DetailPanelMensajesRapidos
            filteredQuick={filteredQuick}
            handleSendQuick={txt => handleSendQuick(txt, onSendNow)}
            qQuick={qQuick}
            setQQuick={setQQuick}
            onSendNow={onSendNow}
          />
        )}
        
        {optionMenu === 6 && (
          <ProductTab 
          conversationId={Number(conversationId)}
          contactId= {Number(contactId)}/>
        )}

        {optionMenu === 7 && (
          <CarPCPanelTab 
           conversationId={Number(conversationId)}
           contactId= {Number(contactId)}
          />
        )}
      </section>

      {showMore && (
        <div
          className="dp-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Más detalles del cliente"
        >
          <div
            className="dp-modal__backdrop"
            onClick={() => setShowMore(false)}
          />
          <div className="dp-modal__content">
            <div className="dp-modal__header">
              <div className="dp-modal__tabs">
                <button
                  className={`btn-tab ${
                    moreTab === "cred" ? "is-active" : ""
                  }`}
                  onClick={() => setMoreTab("cred")}
                  type="button"
                >
                  Credenciales
                </button>
                <button
                  className={`btn-tab ${
                    moreTab === "dev" ? "is-active" : ""
                  }`}
                  onClick={() => setMoreTab("dev")}
                  type="button"
                >
                  Equipos
                </button>
                <button
                  className={`btn-tab ${
                    moreTab === "sys" ? "is-active" : ""
                  }`}
                  onClick={() => setMoreTab("sys")}
                  type="button"
                >
                  Sistemas
                </button>
              </div>
              <button
                className="btn btn--ghost dp-modal__close"
                onClick={() => setShowMore(false)}
                aria-label="Cerrar"
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="dp-modal__body">
              {moreTab === "cred" && (
                <>
                  <div className="dp-sectionHeader">
                    <div className="dp-search">
                      <input
                        className="input dp-search__input"
                        placeholder="Buscar credenciales…"
                        value={credSearch}
                        onChange={e => setCredSearch(e.target.value)}
                        aria-label="Buscar credenciales"
                      />
                      <span className="dp-search__icon">🔍</span>
                    </div>
                   {isAdmin && (

                     <button
                      className="btn"
                      onClick={openCredCreate}
                      type="button"
                    >
                      Nueva
                    </button>
                   )}
                  </div>

                  <div className="dp-sectionGrid">
                    {credentials.length > 0 ? (
                      credentials
                        .filter(it => {
                          const n = credSearch.trim().toLowerCase();
                          if (!n) return true;
                          return [
                            it.catCredencialNames,
                            it.user,
                            it.instance,
                            it.port,
                            it.observation,
                            (it as any).outsourcedDeviceName,
                            (it as any).clientOutsourcedSystemsName,
                          ]
                            .filter(Boolean)
                            .some(v =>
                              String(v).toLowerCase().includes(n)
                            );
                        })
                        .map(it => {
                          const scopeText = (it as any).outsourcedDeviceName
                            ? `Equipo: ${(it as any).outsourcedDeviceName}`
                            : (it as any).clientOutsourcedSystemsName
                            ? `Sistema: ${(it as any).clientOutsourcedSystemsName}`
                            : "Cliente";

                          return (
                            <div key={it.id} className="dp-collapse dp-cred">
                              <div className="dp-cred__header">
                                <div className="dp-cred__titleGroup">
                                  <strong className="dp-collapse__title">
                                    <Trunc>
                                      {it.catCredencialNames ?? "---"}
                                    </Trunc>
                                  </strong>
                                  <div className="dp-collapse__subtitle">
                                    <Trunc>{scopeText}</Trunc>
                                  </div>
                                </div>
                                <span
                                  className={
                                    it.isActive
                                      ? "badge badge--ok"
                                      : "badge badge--off"
                                  }
                                >
                                  {it.isActive ? "Activo" : "Inactivo"}
                                </span>
                              </div>

                              <div className="dp-cred__rows">
                                <Row label="Usuario" value={it.user} />
                                <Row
                                  label="Instancia"
                                  value={it.instance ? it.instance : "---"}
                                />
                                <Row
                                  label="Puerto"
                                  value={it.port ? it.port : "---"}
                                />
                              </div>

                              <div className="dp-cred__observation">
                                <p className="detailPanel-clientGroup__title">
                                  Observación
                                </p>
                                <div className="dp-cred__observationBox">
                                  <Trunc>{it.observation}</Trunc>
                                </div>
                              </div>

                              {isAdmin && (
                                <div className="dp-cred__actions">
                                <button
                                  className="btn btn--ghost"
                                  type="button"
                                  onClick={() => openCredView(it)}
                                >
                                  Ver
                                </button>
                                <button
                                  className="btn btn--primary"
                                  type="button"
                                  onClick={() => openCredEdit(it)}
                                >
                                  Editar
                                </button>
                              </div>
                              )}
                            </div>
                          );
                        })
                    ) : (
                      <div className="detailPanel-emptyState detailPanel-emptyState--sub">
                        Sin credenciales
                      </div>
                    )}
                  </div>
                </>
              )}

              {moreTab === "dev" && (
                <>
                  <div className="dp-sectionHeader">
                    <div className="dp-search">
                      <input
                        className="input dp-search__input"
                        placeholder="Buscar por nombre, IP, SO…"
                        value={devSearch}
                        onChange={e => setDevSearch(e.target.value)}
                        aria-label="Buscar equipos"
                      />
                      <span className="dp-search__icon">🔍</span>
                    </div>
                    {isAdmin && (
                      <button
                      className="btn"
                      type="button"
                      onClick={() => {
                        setDeviceErrors({});
                        setAddDeviceOpen(true);
                      }}
                    >
                      Nuevo
                    </button>
                    )}
                  </div>

                  <div className="dp-sectionGrid">
                    {filteredDevs.map(it => (
                      <div key={it.id} className="dp-collapse dp-device">
                        <div className="dp-device__header">
                          <div className="dp-device__titleGroup">
                            <div className="dp-collapse__title">
                              <Trunc>{it.name}</Trunc>
                            </div>
                            <div className="dp-collapse__subtitle">
                              <Trunc>{it.ip ?? "-"}</Trunc>
                            </div>
                          </div>
                          <span
                            className={
                              it.isActive
                                ? "badge badge--ok"
                                : "badge badge--off"
                            }
                          >
                            {it.isActive ? "Activo" : "Inactivo"}
                          </span>
                        </div>

                        <div className="dp-device__rows">
                          <Row label="IP" value={it.ip ?? "-"} />
                          <Row
                            label="Sistema operativo"
                            value={it.operatingSystem ?? "-"}
                          />
                          <Row label="Versión SO" value={it.versionSO ?? "-"} />
                        </div>

                        <div className="dp-device__description">
                          <p className="detailPanel-clientGroup__title">
                            Descripción
                          </p>
                          <div className="dp-device__descriptionBox">
                            <Trunc>{it.description}</Trunc>
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredDevs.length === 0 && (
                      <div className="detailPanel-emptyState detailPanel-emptyState--sub">
                        Sin equipos
                      </div>
                    )}
                  </div>
                </>
              )}

              {moreTab === "sys" && (
                <>
                  <div className="dp-sectionHeader">
                    <div className="dp-search">
                      <input
                        className="input dp-search__input"
                        placeholder="Buscar sistemas…"
                        value={sysSearch}
                        onChange={e => setSysSearch(e.target.value)}
                        aria-label="Buscar sistemas"
                      />
                      <span className="dp-search__icon">🔍</span>
                    </div>
                    {isAdmin &&(
                      <button
                      className="btn"
                      onClick={openSystemPicker}
                      type="button"
                    >
                      Agregar
                    </button>
                    )}
                  </div>

                  <div className="dp-sectionGrid">
                    {filteredSystems.map(it => (
                      <div key={it.id} className="dp-collapse dp-system">
                        <div className="dp-system__header">
                          <div className="dp-system__titleGroup">
                            <div className="dp-collapse__title">
                              <Trunc>{it.name}</Trunc>
                            </div>
                            <div className="dp-collapse__subtitle">
                              <Trunc>{it.version ?? "-"}</Trunc>
                            </div>
                          </div>
                          <span
                            className={
                              it.isActive
                                ? "badge badge--ok"
                                : "badge badge--off"
                            }
                          >
                            {it.isActive ? "Activo" : "Inactivo"}
                          </span>
                        </div>

                        <div className="dp-system__rows">
                          <Row label="Versión" value={it.version ?? "-"} />
                        </div>

                        <div className="dp-system__description">
                          <p className="detailPanel-clientGroup__title">
                            Descripción
                          </p>
                          <div className="dp-system__descriptionBox">
                            {it.description}
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredSystems.length === 0 && (
                      <div className="detailPanel-emptyState detailPanel-emptyState--sub">
                        Sin sistemas
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {credModalOpen && (
        <CredentialsModal
          isOpen={credModalOpen}
          onClose={() => setCredModalOpen(false)}
          credMode={credMode}
          credScope={credScope}
          setCredScope={setCredScope}
          deviceTargetId={deviceTargetId}
          setDeviceTargetId={setDeviceTargetId}
          systemTargetId={systemTargetId}
          setSystemTargetId={setSystemTargetId}
          credReq={credReq}
          setCredReq={setCredReq}
          credErrors={credErrors}
          catCredential={catCredential}
          filteredDevs={filteredDevs}
          filteredSystems={filteredSystems}
          saveCred={saveCred}
        />
      )}

      {clientEditOpen && (
        <ClientEditModal
          open={clientEditOpen}
          onClose={() => setClientEditOpen(false)}
          clientEdit={clientEdit}
          onChange={handleChange}
          onNumberChange={handleNumberChange}
          onSave={saveClientEdits}
        />
      )}

      {addDeviceOpen && (
        <DeviceModal
          show={addDeviceOpen}
          onClose={() => {
            setAddDeviceOpen(false);
            setDeviceErrors({});
          }}
          newDevice={newDevice}
          setNewDevice={setNewDevice}
          deviceErrors={deviceErrors}
          setDeviceErrors={setDeviceErrors}
          onSave={createDevice}
        />
      )}

      {pickSysOpen && (
        <SystemPickerModal
          open={pickSysOpen}
          onClose={() => setPickSysOpen(false)}
          sysCatalog={sysCatalog}
          sysTotal={sysTotal}
          sysPage={sysPage}
          sysPageSize={sysPageSize}
          sysGlobalFilter={sysGlobalFilter}
          setSysPage={setSysPage}
          setSysPageSize={setSysPageSize}
          setSysGlobalFilter={setSysGlobalFilter}
          fetchSysPage={fetchSysPage}
          newSystem={newSystem}
          setNewSystem={setNewSystem}
          addPickedSystem={addPickedSystem}
        />
      )}


     {showHistoryModal && (
        <ConversationHistoryModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          conversationId={selectedHistoryConversationId ?? 0}
          clientId={clientLocal?.codClient?.toString() ?? null}
          conversationStart={selectedHistoryConversationStart ?? null}
          initialContactId={selectedHistoryContactId ?? null}
        />
      )}
    </div>
  );
};

export default DetailPanel;