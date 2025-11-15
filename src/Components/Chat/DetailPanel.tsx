/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { FaRegBuilding, FaFilter } from 'react-icons/fa'
import { IoChatboxEllipsesOutline } from 'react-icons/io5'
import { RiTimelineView } from 'react-icons/ri'
import { X, Plus, Search, FileDown, 
  // FileClock 

} from 'lucide-react'
import ConversationHistoryModal from '@/Components/Chat/ConversationHistoryModal'
import { ThreeDot } from 'react-loading-indicators'
import { useDetailPanel } from '@/Hooks/Chat/useDetailPanel'
import { useCatCredential } from '@/Hooks/Crm/useCatCredential'
import '@/Styles/Chat/DetailPanel.css'
import type { CredentialResponseDTO } from '@/Interfaces/Crm/ClientInterface'
import useConversations from '@/Hooks/Conversation/useConversations'
import { AiOutlineWechatWork } from 'react-icons/ai'
import { LuContact } from 'react-icons/lu'
import DetailPanelOptionsClient from './DetailPanelOptionsClient'
import DetailPanelMensajesRapidos from './DetailPanelMensajesRapidos'
import DetailPanelOptionsConversation from './DetailPanelOptionsConversation'
import DetailPanelOptionsContact from './DetailPanelOptionsContact'

type Props = {
  contactId?: number
  conversationId?: number
  selectedParam?: unknown
  onSendNow?: (txt: string) => void | Promise<void>
}

const DetailPanel: React.FC<Props> = ({
  contactId,
  conversationId,
  selectedParam,
  onSendNow,
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
    clientEditOpen,
    setClientEditOpen,
    clientLocal,
    workModel,
    setWorkModel,
    priority,
    setPriority,
    supportType,
    setSupportType,
    envType,
    setEnvType,
    isSupportActive,
    setIsSupportActive,
    isFranchise,
    setIsFranchise,
    saveClientEdits,
    formatNiPhone,
    displayOrDash,
    formatDate,
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
    handleSendQuick,
  } = useDetailPanel(contactId, selectedParam)

  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<number>(0)
  const { catCredential } = useCatCredential()

  const {
    loading: LoadingPDF,
    exportConversationHistoryToPDFAsync,
    GetConversaionContact,
    GetConversationByClientPaginationAsync,
    totalCount,
    data: conversations,
  } = useConversations()

  const Trunc = ({ children }: { children?: React.ReactNode }) => (
    <span
      title={children ? String(children) : '---'}
      style={{
        maxWidth: '100%',
        display: 'inline-block',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        verticalAlign: 'bottom',
      }}
    >
      {displayOrDash(children as any)}
    </span>
  )

  const Row = ({ label, value }: { label: string; value?: React.ReactNode }) => (
    <div className="detailPanel-clientGroup" style={{ alignItems: 'center' }}>
      <p className="detailPanel-clientGroup__title">{label}</p>
      <span className="detailPanel-clientGroup__cliente">
        <Trunc>{value as any}</Trunc>
      </span>
    </div>
  )

  const [convFrom, setConvFrom] = useState<string>('')
  const [convTo, setConvTo] = useState<string>('')
  const [convQuery, setConvQuery] = useState<string>('')
  const [showConvFilters, setShowConvFilters] = useState(false)
  const [convPage, setConvPage] = useState(1)
  const convPageSize = 20

  const [convItems, setConvItems] = useState<any[]>([])
  const [hoverId, setHoverId] = useState<number | null>(null)

  useEffect(() => {
    setConvPage(1)
  }, [optionMenu, contactId, selectedData?.clienteCodigo])

  useEffect(() => {
    if (optionMenu === 3 || optionMenu === 4) {
      setConvItems([])
      setConvPage(1)
    }
  }, [optionMenu, contactId, selectedData?.clienteCodigo, convFrom, convTo, convQuery])

  useEffect(() => {
    if (optionMenu !== 4) return
    GetConversaionContact({
      contactId: contactId ?? 0,
      from: convFrom || null,
      to: convTo || null,
      q: convQuery || null,
      page: convPage,
      pageSize: convPageSize,
    })
  }, [
    optionMenu,
    contactId,
    convFrom,
    convTo,
    convQuery,
    convPage,
    convPageSize,
    GetConversaionContact,
  ])

  useEffect(() => {
    if (optionMenu !== 3) return
    if (!selectedData?.clienteCodigo) return
    GetConversationByClientPaginationAsync({
      clientCode: selectedData.clienteCodigo,
      from: convFrom || null,
      to: convTo || null,
      searchConversation: convQuery || null,
      page: convPage,
      pageSize: convPageSize,
    })
  }, [
    optionMenu,
    selectedData?.clienteCodigo,
    convFrom,
    convTo,
    conversationId,
    convQuery,
    convPage,
    convPageSize,
    GetConversationByClientPaginationAsync,
  ])

  useEffect(() => {
    if (!conversations || !Array.isArray(conversations)) {
      if (convPage === 1) setConvItems([])
      return
    }
    setConvItems(prev => {
      if (convPage === 1) {
        return conversations
      }
      const prevIds = new Set(prev.map((c: any) => c.conversationId ?? c.id))
      const newOnes = (conversations as any[]).filter(
        c => !prevIds.has(c.conversationId ?? c.id)
      )
      return [...prev, ...newOnes]
    })
  }, [conversations, convPage])

  useEffect(() => {
    setShowMore(false)
    setClientEditOpen(false)
    setAddDeviceOpen(false)
    setPickSysOpen(false)
    setCredSearch('')
    setDevSearch('')
    setSysSearch('')
    setQQuick('')
    setConvFrom('')
    setConvTo('')
    setConvQuery('')
    setConvPage(1)
    setShowHistoryModal(false)
    setSelectedConversation(0)
    setConvItems([])
  }, [
    contactId,
    conversationId,
    setClientEditOpen,
    setAddDeviceOpen,
    setPickSysOpen,
    setCredSearch,
    setDevSearch,
    setSysSearch,
    setQQuick,
    setShowMore,
  ])

  const convRows = useMemo(
    () =>
      (convItems || []).map((c: any) => ({
        id: c.conversationId ?? c.id,
        createdAt: c.createdAt,
        contactName: c.clientContactName || c.contactName,
        agent: c.assignedAgentName || '—',
        status: c.status || '—',
        contactId: c.clientContactId ?? c.contactId,
      })),
    [convItems]
  )

  const totalPages = useMemo(
    () =>
      convPageSize ? Math.max(1, Math.ceil((totalCount ?? 0) / convPageSize)) : 1,
    [totalCount, convPageSize]
  )

  const filteredCreds = useMemo<CredentialResponseDTO[]>(() => {
    const n = credSearch.trim().toLowerCase()
    if (!n) return credentials
    return credentials.filter(it =>
      [
        it.catCredencialNames,
        it.user,
        it.instance,
        it.port,
        it.observation,
        (it as any).outsourcedDeviceName,
        (it as any).clientOutsourcedSystemsName,
      ]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(n))
    )
  }, [credentials, credSearch])

  const hasClient = !!clienteCodigo && !!client

  const handleConvScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget
      const atBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < 10 && convPage < totalPages
      if (atBottom) setConvPage(p => Math.min(totalPages, p + 1))
    },
    [convPage, totalPages]
  )

  if (loading)
    return (
      <div className="loader-container">
        <ThreeDot color="#0070B4" size="medium" />
      </div>
    )

  const firstConversationDate =
    convRows && convRows.length > 0 ? convRows[0].createdAt : null

  return (
    <div
      key={`${contactId ?? 'c'}-${conversationId ?? 'v'}-${selectedParam ?? ''}`}
      className="detailPanel-container"
    >
      <ul className="detail-panel__header">
        <li className={`detailPanel-option ${optionMenu === 1 ? 'is-active' : ''}`}>
          <button
            type="button"
            className="detailPanel-optionBtn"
            onClick={() => setOptionMenu(1)}
            aria-label="Cliente"
          >
            <FaRegBuilding size={18} className="detailPanel-optionBtn__icon" />
          </button>
        </li>

        <li className={`detailPanel-option ${optionMenu === 2 ? 'is-active' : ''}`}>
          <button
            type="button"
            className="detailPanel-optionBtn"
            onClick={() => setOptionMenu(2)}
            aria-label="Contacto"
          >
            <LuContact size={18} className="detailPanel-optionBtn__icon" />
          </button>
        </li>

        <li className={`detailPanel-option ${optionMenu === 3 ? 'is-active' : ''}`}>
          <button
            type="button"
            className="detailPanel-optionBtn"
            onClick={() => {
              setOptionMenu(3)
              setConvPage(1)
              setConvItems([])
            }}
            aria-label="Historial de conversaciones"
          >
            <RiTimelineView size={18} className="detailPanel-optionBtn__icon" />

          </button>
        </li>

        <li className={`detailPanel-option ${optionMenu === 4 ? 'is-active' : ''}`}>
          <button
            type="button"
            className="detailPanel-optionBtn"
            onClick={() => {
              setOptionMenu(4)
              setConvPage(1)
              setConvItems([])
            }}
            aria-label="Conversación"
          >
            <AiOutlineWechatWork size={18} className="detailPanel-optionBtn__icon" />
          </button>
        </li>

        <li className={`detailPanel-option ${optionMenu === 5 ? 'is-active' : ''}`}>
          <button
            type="button"
            className="detailPanel-optionBtn"
            onClick={() => setOptionMenu(5)}
            aria-label="Mensajes rápidos"
          >
            <IoChatboxEllipsesOutline size={18} className="detailPanel-optionBtn__icon" />
          </button>
        </li>
      </ul>

      <section
        className="detailPanel-content"
        style={{
          paddingLeft: 12,
          paddingRight: 12,
        }}
      >
        {optionMenu === 1 &&
          (hasClient ? (
            <DetailPanelOptionsClient
              displayOrDash={displayOrDash}
              formatDate={formatDate}
              formatNiPhone={formatNiPhone}
              clientLocal={clientLocal}
              setShowMore={setShowMore}
              setClientEditOpen={setClientEditOpen}
            />
          ) : (
            <div
              style={{
                border: '1px dashed #e5e7eb',
                borderRadius: 10,
                padding: 16,
                textAlign: 'center',
                fontSize: 13,
                opacity: 0.8,
              }}
            >
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
            <div
              style={{
                border: '1px dashed #e5e7eb',
                borderRadius: 10,
                padding: 16,
                textAlign: 'center',
                fontSize: 13,
                opacity: 0.8,
              }}
            >
              No hay datos de contacto para esta conversación.
            </div>
          ))}

        {optionMenu === 3 && (
          <div className="detailPanel-container">
            <header
              className="detailPanel-content-header"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 40,
                position: 'relative',
              }}
            >
              <h5 style={{ margin: 0, paddingLeft: 0 }}>Historial de conversaciones</h5>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  className="btn btn--ghost"
                  onClick={() => setShowConvFilters(s => !s)}
                  title="Filtros"
                  aria-expanded={showConvFilters}
                  aria-controls="convFilterPanel"
                >
                  <FaFilter size={14} />
                </button>
              </div>

              {showConvFilters && (
                <div
                  id="convFilterPanel"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: 360,
                    background: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: 10,
                    boxShadow: '0 10px 30px rgba(0,0,0,.12)',
                    padding: 10,
                    zIndex: 2,
                    display: 'grid',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 8,
                    }}
                  >
                    <div>
                      <label
                        className="detailPanel-clientGroup__title"
                        style={{ display: 'block' }}
                      >
                        Desde
                      </label>
                      <input
                        type="date"
                        className="input"
                        value={convFrom}
                        onChange={e => {
                          setConvFrom(e.target.value)
                          setConvPage(1)
                          setConvItems([])
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="detailPanel-clientGroup__title"
                        style={{ display: 'block' }}
                      >
                        Hasta
                      </label>
                      <input
                        type="date"
                        className="input"
                        value={convTo}
                        onChange={e => {
                          setConvTo(e.target.value)
                          setConvPage(1)
                          setConvItems([])
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <input
                      className="input"
                      placeholder="Buscar por texto…"
                      value={convQuery}
                      onChange={e => setConvQuery(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          setConvPage(1)
                          setConvItems([])
                          setShowConvFilters(false)
                        }
                      }}
                      style={{ paddingLeft: 32 }}
                    />
                    <Search
                      size={16}
                      style={{
                        position: 'absolute',
                        left: 8,
                        top: 10,
                        opacity: 0.6,
                      }}
                    />
                  </div>
                </div>
              )}
            </header>

            <div className="detailPanel-convesaionHistory__container">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 1fr',
                  gap: 8,
                  padding: '6px 10px',
                  borderBottom: '1px solid #e5e7eb',
                  fontSize: 12,
                  opacity: 0.7,
                }}
              >
                <span>Creado</span>
                <span>Contacto</span>
                <span>Agente</span>
                <span>Ticket</span>
              </div>

              <div
                style={{
                  overflowY: 'auto',
                  maxHeight: '90%',
                }}
                onScroll={handleConvScroll}
              >
                {convRows.map(r => (
                  <div
                    key={r.id}
                    onMouseEnter={() => setHoverId(r.id)}
                    onMouseLeave={() => setHoverId(null)}
                    style={{
                      position: 'relative',
                      borderBottom: '1px solid #e5e7eb',
                      padding: 10,
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr 1fr',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      title={formatDate(r.createdAt)}
                      style={{ overflow: 'hidden' }}
                      className="detailPanel-clientGroup__cliente"
                    >
                      <Trunc>{formatDate(r.createdAt)}</Trunc>
                    </div>
                    <div
                      title={r.contactName}
                      style={{ overflow: 'hidden' }}
                      className="detailPanel-clientGroup__cliente"
                    >
                      {r.contactName != null ? (
                        <Trunc>{r.contactName}</Trunc>
                      ) : (
                        '------------------------'
                      )}
                    </div>
                    <div
                      title={r.agent}
                      style={{ overflow: 'hidden' }}
                      className="detailPanel-clientGroup__cliente"
                    >
                      {r.agent != null ? (
                        <Trunc>{r.agent}</Trunc>
                      ) : (
                        '------------------------'
                      )}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <span
                        title={`#${r.id}`}
                        style={{
                          overflow: 'hidden',
                          flex: 1,
                          textAlign: 'center',
                        }}
                        className="detailPanel-clientGroup__cliente"
                      >
                        <Trunc>{r.id}</Trunc>
                      </span>
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        display: hoverId === r.id ? 'inline-flex' : 'none',
                        gap: 6,
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        padding: '4px 6px',
                        zIndex: 3,
                      }}
                    >

                      {/* <button
                        className="btn btn--ghost"
                        onClick={() => setShowHistoryModal(true)}
                        title="Historial"
                      >
                        <FileClock size={16} />
                      </button> */}

                      <button
                        className="btn btn--ghost"
                        onClick={e => {
                          e.stopPropagation()
                          exportConversationHistoryToPDFAsync({
                            contactId: r.contactId,
                            from: convFrom || null,
                            to: convTo || null,
                            title: 'Reporte de Conversaciones',
                            subtitle: 'Historia de conversaciones',
                          })
                        }}
                        disabled={!!LoadingPDF}
                        title="Descargar PDF"
                      >
                        <FileDown size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                {convRows.length === 0 && convPage === 1 && (
                  <div
                    style={{
                      border: '1px dashed #e5e7eb',
                      borderRadius: 10,
                      padding: 16,
                      textAlign: 'center',
                      opacity: 0.7,
                    }}
                  >
                    Sin resultados
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 10,
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {totalCount && totalCount > 0
                  ? `Mostrando página ${convPage} de ${totalPages} (${totalCount} conversaciones)`
                  : 'Sin resultados'}
              </div>
              {LoadingPDF ? (
                <span style={{ fontSize: 12, opacity: 0.7 }}>Preparando PDF…</span>
              ) : null}
            </div>
          </div>
        )}

        {optionMenu === 4 && (
          <DetailPanelOptionsConversation
            conversationId={Number(conversationId)}
            formatDate={formatDate}
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
            onClick={() => {
              setShowMore(false)
            }}
          />
          <div
            className="dp-modal__content"
            style={{
              width: 560,
              maxWidth: '96vw',
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 10px 30px rgba(0,0,0,.15)',
              position: 'fixed',
              right: 0,
              top: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: 12,
                borderBottom: '1px solid #eee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className={`btn-tab ${moreTab === 'cred' ? 'is-active' : ''}`}
                  onClick={() => setMoreTab('cred')}
                >
                  Credenciales
                </button>
                <button
                  className={`btn-tab ${moreTab === 'dev' ? 'is-active' : ''}`}
                  onClick={() => setMoreTab('dev')}
                >
                  Equipos
                </button>
                <button
                  className={`btn-tab ${moreTab === 'sys' ? 'is-active' : ''}`}
                  onClick={() => setMoreTab('sys')}
                >
                  Sistemas
                </button>
              </div>
              <button
                className="btn btn--ghost"
                onClick={() => {
                  setShowMore(false)
                }}
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{
                padding: 12,
                overflow: 'auto',
                display: 'grid',
                gap: 12,
              }}
            >
              {moreTab === 'cred' && (
                <>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: 8,
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ position: 'relative', backgroundColor: '#fff' }}>
                      <input
                        className="input"
                        placeholder="Buscar credenciales…"
                        value={credSearch}
                        onChange={e => setCredSearch(e.target.value)}
                        style={{ paddingLeft: 34 }}
                        aria-label="Buscar credenciales"
                      />
                      <Search
                        size={16}
                        style={{
                          position: 'absolute',
                          left: 10,
                          top: 10,
                          opacity: 0.6,
                        }}
                      />
                    </div>
                    <button className="btn" onClick={openCredCreate} type="button">
                      <Plus size={14} /> Nueva credencial
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr',
                      gap: 10,
                    }}
                  >
                    {filteredCreds.map(it => {
                      const scopeText = (it as any).outsourcedDeviceName
                        ? `Equipo: ${(it as any).outsourcedDeviceName}`
                        : (it as any).clientOutsourcedSystemsName
                          ? `Sistema: ${(it as any).clientOutsourcedSystemsName}`
                          : 'Cliente'
                      return (
                        <div
                          key={it.id}
                          className="dp-collapse"
                          style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: 10,
                            padding: 10,
                            display: 'grid',
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: 8,
                            }}
                          >
                            <div>
                              <strong className="dp-collapse__title">
                                <Trunc>{it.catCredencialNames ?? '---'}</Trunc>
                              </strong>
                              <div
                                className="dp-collapse__subtitle"
                                style={{ fontSize: 12, opacity: 0.8 }}
                              >
                                <Trunc>{scopeText}</Trunc>
                              </div>
                            </div>
                            <span
                              className={it.isActive ? 'badge badge--ok' : 'badge badge--off'}
                            >
                              {it.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>

                          <div style={{ display: 'grid', gap: 8 }}>
                            <Row label="Usuario" value={it.user} />
                            <Row label="Instancia" value={it.instance ? it.instance : '---'} />
                            <Row label="Puerto" value={it.port ? it.port : '---'} />
                          </div>
                          <div>
                            <p className="detailPanel-clientGroup__title">Observación</p>
                            <div
                              style={{
                                border: '1px solid #E5E7EB',
                                borderRadius: 8,
                                padding: 8,
                                minHeight: 40,
                                background: '#FAFAFA',
                              }}
                            >
                              <Trunc>{it.observation}</Trunc>
                            </div>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              gap: 8,
                              justifyContent: 'flex-end',
                            }}
                          >
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
                        </div>
                      )
                    })}
                    {filteredCreds.length === 0 && (
                      <div
                        style={{
                          border: '1px dashed #e5e7eb',
                          borderRadius: 10,
                          padding: 16,
                          textAlign: 'center',
                          opacity: 0.7,
                        }}
                      >
                        Sin credenciales
                      </div>
                    )}
                  </div>
                </>
              )}

              {moreTab === 'dev' && (
                <>
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        className="input"
                        placeholder="Buscar por nombre, IP, SO…"
                        value={devSearch}
                        onChange={e => setDevSearch(e.target.value)}
                        style={{ paddingLeft: 34 }}
                        aria-label="Buscar equipos"
                      />
                      <Search
                        size={16}
                        style={{
                          position: 'absolute',
                          left: 10,
                          top: 10,
                          opacity: 0.6,
                        }}
                      />
                    </div>
                    <button
                      className="btn"
                      type="button"
                      onClick={() => {
                        setDeviceErrors({})
                        setAddDeviceOpen(true)
                      }}
                    >
                      <Plus size={14} /> Nuevo equipo
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr',
                      gap: 12,
                    }}
                  >
                    {filteredDevs.map(it => (
                      <div
                        key={it.id}
                        className="dp-collapse"
                        style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: 10,
                          padding: 10,
                          display: 'grid',
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <div>
                            <div className="dp-collapse__title">
                              <Trunc>{it.name}</Trunc>
                            </div>
                            <div
                              className="dp-collapse__subtitle"
                              style={{ fontSize: 12, opacity: 0.8 }}
                            >
                              <Trunc>{it.ip ?? '-'}</Trunc>
                            </div>
                          </div>
                          <span
                            className={it.isActive ? 'badge badge--ok' : 'badge badge--off'}
                          >
                            {it.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>

                        <div style={{ display: 'grid', gap: 8 }}>
                          <Row label="IP" value={it.ip ?? '-'} />
                          <Row label="Sistema operativo" value={it.operatingSystem ?? '-'} />
                          <Row label="Versión SO" value={it.versionSO ?? '-'} />
                        </div>

                        <div>
                          <p className="detailPanel-clientGroup__title">Descripción</p>
                          <div
                            style={{
                              border: '1px solid #E5E7EB',
                              borderRadius: 8,
                              padding: 8,
                              minHeight: 40,
                              background: '#FAFAFA',
                            }}
                          >
                            <Trunc>{it.description}</Trunc>
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredDevs.length === 0 && (
                      <div
                        style={{
                          opacity: 0.7,
                          fontSize: 12,
                          gridColumn: '1 / -1',
                          textAlign: 'center',
                        }}
                      >
                        Sin equipos
                      </div>
                    )}
                  </div>
                </>
              )}

              {moreTab === 'sys' && (
                <>
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        className="input"
                        placeholder="Buscar sistemas…"
                        value={sysSearch}
                        onChange={e => setSysSearch(e.target.value)}
                        style={{ paddingLeft: 34 }}
                        aria-label="Buscar sistemas"
                      />
                      <Search
                        size={16}
                        style={{
                          position: 'absolute',
                          left: 10,
                          top: 10,
                          opacity: 0.6,
                        }}
                      />
                    </div>
                    <button className="btn" onClick={openSystemPicker} type="button">
                      <Plus size={14} /> Agregar sistema
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr',
                      gap: 12,
                    }}
                  >
                    {filteredSystems.map(it => (
                      <div
                        key={it.id}
                        className="dp-collapse"
                        style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: 10,
                          padding: 10,
                          display: 'grid',
                          gap: 6,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <div>
                            <div className="dp-collapse__title">
                              <Trunc>{it.name}</Trunc>
                            </div>
                            <div
                              className="dp-collapse__subtitle"
                              style={{ fontSize: 12, opacity: 0.8 }}
                            >
                              <Trunc>{it.version ?? '-'}</Trunc>
                            </div>
                          </div>
                          <span
                            className={it.isActive ? 'badge badge--ok' : 'badge badge--off'}
                          >
                            {it.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>

                        <div style={{ display: 'grid', gap: 8 }}>
                          <Row label="Versión" value={it.version ?? '-'} />
                        </div>

                        <div>
                          <p className="detailPanel-clientGroup__title">Descripción</p>
                          <div
                            style={{
                              border: '1px solid #E5E7EB',
                              borderRadius: 8,
                              padding: 8,
                              minHeight: 36,
                              background: '#FAFAFA',
                              maxWidth: '100%',
                              overflow: 'hidden',
                            }}
                          >
                            {it.description}
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredSystems.length === 0 && (
                      <div
                        style={{
                          opacity: 0.7,
                          fontSize: 12,
                          gridColumn: '1 / -1',
                          textAlign: 'center',
                        }}
                      >
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
        <div
          className="dp-modal"
          role="dialog"
          aria-modal="true"
          aria-label={credMode === 'create' ? 'Nueva credencial' : 'Detalle de credencial'}
        >
          <div
            className="dp-modal__backdrop"
            onClick={() => setCredModalOpen(false)}
          />
          <div
            className="dp-modal__content"
            style={{
              width: 520,
              maxWidth: '96vw',
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 10px 30px rgba(0,0,0,.15)',
              position: 'fixed',
              right: 0,
              top: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: 12,
                borderBottom: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h6 style={{ margin: 0, fontSize: 14 }}>
                {credMode === 'create' ? 'Nueva credencial' : 'Detalle de credencial'}
              </h6>
              <button
                className="btn btn--ghost"
                onClick={() => setCredModalOpen(false)}
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>
            <div
              style={{
                padding: 12,
                display: 'grid',
                gap: 10,
                flex: 1,
                overflow: 'hidden auto ',
              }}
            >
              {!!Object.keys(credErrors).length && (
                <div className="cap__alert">Revise los campos marcados.</div>
              )}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: 10,
                }}
              >
                <div className="cap__field">
                  <label className="cap__label" htmlFor="cred_cat">
                    Tipo
                  </label>
                  <select
                    id="cred_cat"
                    value={credReq.catCredentialId}
                    onChange={e =>
                      setCredReq(s => ({
                        ...s,
                        catCredentialId: Number(e.target.value),
                      }))
                    }
                    disabled={credMode === 'view'}
                    className={`input ${credErrors.catCredentialId ? 'has-error' : ''}`}
                  >
                    <option value={0}>Seleccione tipo</option>
                    {catCredential.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  
                  {credErrors.catCredentialId && (
                    <div className="cap__error">{credErrors.catCredentialId}</div>
                  )}
                </div>
                <div className="cap__field">
                  <label className="cap__label" htmlFor="cred_scope">
                    Ámbito
                  </label>
                  <select
                    id="cred_scope"
                    value={credScope}
                    onChange={e => setCredScope(e.target.value as any)}
                    disabled={credMode === 'view'}
                    className={`input ${credErrors.scope ? 'has-error' : ''}`}
                  >
                    <option value="client">Cliente</option>
                    <option value="device">Equipo</option>
                    <option value="system">Sistema</option>
                  </select>
                  {credErrors.scope && (
                    <div className="cap__error">{credErrors.scope}</div>
                  )}
                </div>

                {credScope === 'device' && (
                  <div className="cap__field">
                    <label className="cap__label" htmlFor="cred_device">
                      Equipo
                    </label>
                    <select
                      id="cred_device"
                      value={deviceTargetId}
                      onChange={e =>
                        setDeviceTargetId(
                          e.target.value === '' ? '' : Number(e.target.value)
                        )
                      }
                      disabled={credMode === 'view'}
                      className="input"
                    >
                      <option value="">Seleccione equipo</option>
                      {filteredDevs.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {credScope === 'system' && (
                  <div className="cap__field">
                    <label className="cap__label" htmlFor="cred_system">
                      Sistema
                    </label>
                    <select
                      id="cred_system"
                      value={systemTargetId}
                      onChange={e =>
                        setSystemTargetId(
                          e.target.value === '' ? '' : Number(e.target.value)
                        )
                      }
                      disabled={credMode === 'view'}
                      className="input"
                    >
                      <option value="">Seleccione sistema</option>
                      {filteredSystems.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="cap__field">
                  <label className="cap__label" htmlFor="cred_user">
                    Usuario
                  </label>
                  <input
                    id="cred_user"
                    className={`input ${credErrors.user ? 'has-error' : ''}`}
                    value={credReq.user}
                    maxLength={255}
                    onChange={e =>
                      setCredReq(s => ({
                        ...s,
                        user: e.target.value,
                      }))
                    }
                    disabled={credMode === 'view'}
                  />
                  {credErrors.user && (
                    <div className="cap__error">{credErrors.user}</div>
                  )}
                </div>
                <div className="cap__field">
                  <label className="cap__label" htmlFor="cred_pass">
                    Contraseña
                  </label>
                  <input
                    id="cred_pass"
                    type="password"
                    className={`input ${credErrors.password ? 'has-error' : ''}`}
                    value={credReq.password ?? ''}
                    onChange={e =>
                      setCredReq(s => ({
                        ...s,
                        password: e.target.value,
                      }))
                    }
                    disabled={credMode === 'view'}
                  />
                  {credErrors.password && (
                    <div className="cap__error">{credErrors.password}</div>
                  )}
                </div>

                <div className="cap__field">
                  <label className="cap__label" htmlFor="cred_instance">
                    Instancia
                  </label>
                  <input
                    id="cred_instance"
                    className={`input ${credErrors.instance ? 'has-error' : ''}`}
                    value={credReq.instance ?? ''}
                    maxLength={100}
                    onChange={e =>
                      setCredReq(s => ({
                        ...s,
                        instance: e.target.value,
                      }))
                    }
                    disabled={credMode === 'view'}
                  />
                  {credErrors.instance && (
                    <div className="cap__error">{credErrors.instance}</div>
                  )}
                </div>
                <div className="cap__field">
                  <label className="cap__label" htmlFor="cred_port">
                    Puerto
                  </label>
                  <input
                    id="cred_port"
                    className={`input ${credErrors.port ? 'has-error' : ''}`}
                    value={credReq.port ?? ''}
                    maxLength={100}
                    onChange={e =>
                      setCredReq(s => ({
                        ...s,
                        port: e.target.value,
                      }))
                    }
                    disabled={credMode === 'view'}
                  />
                  {credErrors.port && (
                    <div className="cap__error">{credErrors.port}</div>
                  )}
                </div>

                <div
                  className="cap__field"
                  style={{ gridColumn: '1 / -1' }}
                >
                  <label className="cap__label" htmlFor="cred_obs">
                    Observación
                  </label>
                  <textarea
                    id="cred_obs"
                    className={`input ${credErrors.observation ? 'has-error' : ''}`}
                    value={credReq.observation ?? ''}
                    onChange={e =>
                      setCredReq(s => ({
                        ...s,
                        observation: e.target.value,
                      }))
                    }
                    disabled={credMode === 'view'}
                    rows={4}
                  />
                  {credErrors.observation && (
                    <div className="cap__error">{credErrors.observation}</div>
                  )}
                </div>


              <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <input
                    type="checkbox"
                    id="cred_active"
                    checked={!!credReq.isActive}
                    onChange={e =>
                      setCredReq(s => ({
                        ...s,
                        isActive: e.target.checked,
                      }))
                    }
                    disabled={credMode === 'view'}
                  />
                  <label
                    htmlFor="cred_active"
                    className="cap__label cap__label--inline"
                    style={{ margin: 0 }}
                  >
                    Activo
                  </label>
                </div>
              </div>
            </div>
            <div
              style={{
                padding: 12,
                borderTop: '1px solid #eee',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
              }}
            >
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setCredModalOpen(false)}
              >
                Cerrar
              </button>
              {credMode !== 'view' && (
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={saveCred}
                >
                  Guardar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {clientEditOpen && (
        <div
          className="dp-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Editar cliente"
        >
          <div
            className="dp-modal__backdrop"
            onClick={() => setClientEditOpen(false)}
          />
          <div
            className="dp-modal__content"
            style={{
              width: 520,
              maxWidth: '94vw',
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 10px 30px rgba(0,0,0,.15)',
              position: 'fixed',
              right: 0,
              top: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: 12,
                borderBottom: '1px solid#eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h6 style={{ margin: 0, fontSize: 12 }}>Editar cliente</h6>
              <button
                className="btn btn--ghost"
                onClick={() => setClientEditOpen(false)}
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>
            <div
              style={{
                padding: 12,
                display: 'grid',
                gap: 10,
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    gridColumn: '1 / -1',
                  }}
                >
                  <textarea
                    className="input"
                    placeholder="Modelo de trabajo"
                    value={workModel}
                    onChange={e => setWorkModel(e.target.value)}
                    rows={8}
                  />
                </div>
                <select
                  className="input"
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                >
                  <option value="">Prioridad</option>
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
                <select
                  className="input"
                  value={supportType}
                  onChange={e => setSupportType(e.target.value)}
                >
                  <option value="">Tipo soporte</option>
                  <option value="AAA">AAA</option>
                  <option value="AA">AA</option>
                  <option value="A">A</option>
                </select>
                <select
                  className="input"
                  value={envType}
                  onChange={e => setEnvType(e.target.value)}
                >
                  <option value="">Entorno</option>
                  <option value="LOCAL">LOCAL</option>
                  <option value="NUBE">NUBE</option>
                </select>
              </div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <input
                  type="checkbox"
                  checked={isSupportActive}
                  onChange={e => setIsSupportActive(e.target.checked)}
                />
                Soporte activo
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <input
                  type="checkbox"
                  checked={isFranchise}
                  onChange={e => setIsFranchise(e.target.checked)}
                />
                Franquicia
              </label>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 8,
                }}
              >
                <button
                  className="btn btn--ghost"
                  onClick={() => setClientEditOpen(false)}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="btn btn--primary"
                  onClick={saveClientEdits}
                  type="button"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {addDeviceOpen && (
        <div
          className="dp-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Nuevo equipo"
        >
          <div
            className="dp-modal__backdrop"
            onClick={() => {
              setAddDeviceOpen(false)
              setDeviceErrors({})
            }}
          />
          <div
            className="dp-modal__content"
            style={{
              width: 520,
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 10px 30px rgba(0,0,0,.15)',
              position: 'fixed',
              right: 0,
              top: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: 12,
                borderBottom: '1px solid #eee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h6 style={{ margin: 0 }}>Nuevo equipo</h6>
              <button
                className="btn btn--ghost"
                onClick={() => {
                  setAddDeviceOpen(false)
                  setDeviceErrors({})
                }}
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>
            <div
              style={{
                padding: 12,
                display: 'grid',
                gap: 10,
              }}
            >
              {!!Object.keys(deviceErrors).length && (
                <div className="cap__alert">Revise los campos del equipo.</div>
              )}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                }}
              >
                <div className="cap__field">
                  <input
                    className={`input ${deviceErrors.name ? 'has-error' : ''}`}
                    placeholder="Nombre"
                    value={newDevice.name}
                    onChange={e =>
                      setNewDevice((p: any) => ({ ...p, name: e.target.value }))
                    }
                  />
                  {deviceErrors.name && (
                    <div className="cap__error">{deviceErrors.name}</div>
                  )}
                </div>
                <div className="cap__field">
                  <input
                    className="input"
                    placeholder="IP"
                    value={newDevice.ip}
                    maxLength={100}
                    onChange={e =>
                      setNewDevice((p: any) => ({ ...p, ip: e.target.value }))
                    }
                  />
                </div>
                <div className="cap__field">
                  <input
                    className={`input ${deviceErrors.operatingSystem ? 'has-error' : ''}`}
                    maxLength={100}
                    placeholder="SO"
                    value={newDevice.operatingSystem}
                    onChange={e =>
                      setNewDevice((p: any) => ({
                        ...p,
                        operatingSystem: e.target.value,
                      }))
                    }
                  />
                  {deviceErrors.operatingSystem && (
                    <div className="cap__error">{deviceErrors.operatingSystem}</div>
                  )}
                </div>
                <div className="cap__field">
                  <input
                    className={`input ${deviceErrors.versionSO ? 'has-error' : ''}`}
                    placeholder="Versión SO"
                    maxLength={100}
                    value={newDevice.versionSO}
                    onChange={e =>
                      setNewDevice((p: any) => ({
                        ...p,
                        versionSO: e.target.value,
                      }))
                    }
                  />
                  {deviceErrors.versionSO && (
                    <div className="cap__error">{deviceErrors.versionSO}</div>
                  )}
                </div>
                <div
                  className="cap__field"
                  style={{ gridColumn: '1 / -1' }}
                >
                  <textarea
                    className={`input ${deviceErrors.description ? 'has-error' : ''}`}
                    placeholder="Descripción"
                    value={newDevice.description}
                    maxLength={500}
                    onChange={e =>
                      setNewDevice((p: any) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                  />
                  {deviceErrors.description && (
                    <div className="cap__error">{deviceErrors.description}</div>
                  )}
                </div>
              </div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <input
                  type="checkbox"
                  checked={!!newDevice.isActive}
                  onChange={e =>
                    setNewDevice((p: any) => ({
                      ...p,
                      isActive: e.target.checked,
                    }))
                  }
                />
                Activo
              </label>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 8,
                }}
              >
                <button
                  className="btn btn--ghost"
                  onClick={() => {
                    setAddDeviceOpen(false)
                    setDeviceErrors({})
                  }}
                >
                  Cancelar
                </button>
                <button className="btn btn--primary" onClick={createDevice}>
                  Crear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {pickSysOpen && (
        <div
          className="dp-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Agregar sistema"
        >
          <div
            className="dp-modal__backdrop"
            onClick={() => setPickSysOpen(false)}
          />
          <div
            className="dp-modal__content"
            style={{
              width: 620,
              maxWidth: '96vw',
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 10px 30px rgba(0,0,0,.15)',
              position: 'fixed',
              right: 0,
              top: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: 12,
                borderBottom: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h6 style={{ margin: 0 }}>Agregar sistema</h6>
              <button
                className="btn btn--ghost"
                onClick={() => setPickSysOpen(false)}
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>
            <div
              style={{
                padding: 12,
                display: 'grid',
                gap: 10,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    className="input"
                    placeholder="Buscar en catálogo de sistemas…"
                    value={sysGlobalFilter}
                    onChange={e => {
                      setSysGlobalFilter(e.target.value)
                      fetchSysPage(1, sysPageSize)
                    }}
                    style={{ paddingLeft: 34 }}
                    aria-label="Buscar en catálogo de sistemas"
                  />
                  <Search
                    size={16}
                    style={{
                      position: 'absolute',
                      left: 10,
                      top: 10,
                      opacity: 0.6,
                    }}
                  />
                </div>
                <select
                  className="input"
                  value={String(sysPageSize)}
                  onChange={e => setSysPageSize(Number(e.target.value))}
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>

              <div
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 10,
                  overflow: 'hidden',
                }}
              >
                <div style={{ maxHeight: 380, overflow: 'auto' }}>
                  <table className="dp-table">
                    <thead>
                      <tr>
                        <th style={{ width: 48 }}></th>
                        <th>Nombre</th>
                        <th>Versión</th>
                        <th>Descripción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sysCatalog.map(s => (
                        <tr key={s.id}>
                          <td>
                            <input
                              type="radio"
                              name="pickSys"
                              checked={newSystem.outsourcedSystemsId === s.id}
                              onChange={() =>
                                setNewSystem({
                                  ...newSystem,
                                  outsourcedSystemsId: s.id,
                                })
                              }
                              aria-label={`Seleccionar ${s.name}`}
                            />
                          </td>
                          <td>{s.name}</td>
                          <td>{s.version ?? '---'}</td>
                          <td>
                            <Trunc>{s.description}</Trunc>
                          </td>
                        </tr>
                      ))}
                      {sysCatalog.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            style={{
                              textAlign: 'center',
                              padding: 16,
                              opacity: 0.7,
                            }}
                          >
                            Sin resultados
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 8,
                    borderTop: '1px solid #e5e7eb',
                  }}
                >
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Total: {sysTotal}</div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 6,
                      alignItems: 'center',
                    }}
                  >
                    <button
                      className="btn btn--ghost"
                      onClick={() => setSysPage(Math.max(1, sysPage - 1))}
                    >
                      Prev
                    </button>
                    <span style={{ fontSize: 12 }}>Página {sysPage}</span>
                    <button
                      className="btn btn--ghost"
                      onClick={() => setSysPage(sysPage + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <input
                  type="checkbox"
                  checked={!!newSystem.isActive}
                  onChange={e =>
                    setNewSystem({ ...newSystem, isActive: e.target.checked })
                  }
                />
                Activo
              </label>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 8,
                }}
              >
                <button
                  className="btn btn--ghost"
                  onClick={() => setPickSysOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn--primary"
                  onClick={addPickedSystem}
                  disabled={!newSystem.outsourcedSystemsId}
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <ConversationHistoryModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          conversationId={selectedConversation || Number(conversationId) || 0}
          clientId={selectedData?.clientId != null ? selectedData?.clientId : null}
          conversationStart={firstConversationDate}
        />
      )}
    </div>
  )
}

export default DetailPanel