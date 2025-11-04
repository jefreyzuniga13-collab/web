/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { LuContact } from 'react-icons/lu'
import { FaCalendarAlt, FaCloud, FaLaptopHouse, FaMapMarkerAlt, FaPhone, FaRegBuilding, FaSync, FaTag, FaUserAlt, FaUserCheck, FaWhatsapp, FaFilter } from 'react-icons/fa'
import { IoChatboxEllipsesOutline } from 'react-icons/io5'
import { BiConversation } from "react-icons/bi";
import {Check, Edit, Tag, X, Plus, Search, ChevronDown, ChevronUp, 
  History, 
  FileDown } from 'lucide-react'
import {ConversationHistoryModal} from '@/Components/Chat/ConversationHistoryModal'
import { ThreeDot } from 'react-loading-indicators'
import { useDetailPanel } from '@/Hooks/Chat/useDetailPanel'
import { useContactDetail } from '@/Hooks/Chat/useContactDetail'
import { useCatCredential } from '@/Hooks/Crm/useCatCredential'
import '@/Styles/Chat/DetailPanel.css'
import type { CredentialResponseDTO } from '@/Interfaces/Crm/ClientInterface'
import { FaRegClock } from 'react-icons/fa6'
import useConversations from '@/Hooks/Conversation/useConversations'
import { AiOutlineWechatWork } from "react-icons/ai";
import { IoIosOptions } from "react-icons/io";
import { SetHaltedConversation } from '@/Services/ConversationService';

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
    loading,
    error,
    qQuick,
    setQQuick,
    filteredQuick,
    clientPhoneFmt,
    showMore,
    setShowMore,
    moreTab,
    setMoreTab,
    editBuffer,
    setEditBuffer,
    credSearch,
    setCredSearch,
    devSearch,
    setDevSearch,
    sysSearch,
    setSysSearch,
    ctcSearch,
    setCtcSearch,
    filteredHosting,
    filteredDevs,
    filteredSystems,
    filteredContacts,
    addHostingOpen,
    setAddHostingOpen,
    newHosting,
    setNewHosting,
    addHosting,
    addDevOpenId,
    setAddDevOpenId,
    newDevCred,
    setNewDevCred,
    addDeviceCredential,
    addSysOpenId,
    setAddSysOpenId,
    newSysCred,
    setNewSysCred,
    addSystemCredential,
    addDeviceOpen,
    setAddDeviceOpen,
    newDevice,
    setNewDevice,
    createDevice,
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
    observation,
    setObservation,
    saveClientEdits,
    handleSendQuick,
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
    openContactPicker,
  } = useDetailPanel(contactId, selectedParam)

    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedConversation, setSelectedConversation] = useState<number>(0);

    const [isToggling, setIsToggling] = useState(false);
    
    const { catCredential } = useCatCredential()
    

  const {
    loading: LoadingPDF,
    exportConversationHistoryToPDFAsync,
    GetConversaionContact,
    page,
    pageSize,
    setPage,
    // setPageSize,
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

  const clientName = (clientLocal as any)?.nombre ?? (clientLocal as any)?.name

  const [openHost, setOpenHost] = useState<Set<string | number>>(new Set())
  const [openDev, setOpenDev] = useState<Set<string | number>>(new Set())
  const [openSys, setOpenSys] = useState<Set<string | number>>(new Set())

  const toggleHost = (id: string | number) => {
    setOpenHost(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleDev = (id: string | number) => {
    setOpenDev(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSys = (id: string | number) => {
    setOpenSys(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const [sysPickerLocalFilter, setSysPickerLocalFilter] = useState(sysGlobalFilter || '')

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

  const [convFrom, setConvFrom] = useState<string>('')
  const [convTo, setConvTo] = useState<string>('')
  const [convQuery, setConvQuery] = useState<string>('')

  const [showConvFilters, setShowConvFilters] = useState(false)
  //conv viene desde la api, se obtiene cuando se accede, y por eoso esta como valor inicial
const [showConversarionOptions, setShowConversarionOptions] = useState(false);



  const [convItems, setConvItems] = useState<any[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const sentinelRef = React.useRef<HTMLDivElement | null>(null)
  const hasMore = convItems.length < (totalCount ?? 0)

  useEffect(() => {
    if (optionMenu !== 4) return
      GetConversaionContact({
      contactId: contactId ?? 0,
      from: convFrom || null,
      to: convTo || null,
      q: convQuery || null,
      page,
      pageSize,
    })
  }, [optionMenu, contactId, convFrom, convTo, convQuery, page, pageSize, GetConversaionContact])

  useEffect(() => {
    if (!conversations) return
    if (page === 1) {
      setConvItems(conversations)
    } else {
      const incomingById = new Map(conversations.map((c: any) => [c.id, c]))
      setConvItems(prev => {
        const prevMap = new Map(prev.map((p: any) => [p.id, p]))
        for (const [id, row] of incomingById) prevMap.set(id, row)
        return Array.from(prevMap.values())
      })
    }
    setIsLoadingMore(false)
  }, [conversations, page])

  useEffect(() => {
    const node = sentinelRef.current
    if (!node) return
    const io = new IntersectionObserver((entries) => {
      const first = entries[0]
      if (first.isIntersecting && hasMore && !isLoadingMore) {
        setIsLoadingMore(true)
        setPage(page + 1)
      }
    }, { root: null, rootMargin: '120px', threshold: 0 })
    io.observe(node)
    return () => io.disconnect()
  }, [sentinelRef, hasMore, isLoadingMore, page, setPage])

      const handleSetHaltedConversation = useCallback(async () => {
    if (!conv) return
    try {
      await SetHaltedConversation(conv.conversationId)
    } catch (e) {
      console.error(e)
    }
  }, [conv])

  const convRows = useMemo(() => (convItems || []).map((c: any) => ({
    id: c.conversationId,
    createdAt: c.createdAt,
    contactName: c.clientContactName || c.contactName,
    agent: c.assignedAgentName || '—',
    status: c.status || '—',
    contactId: c.clientContactId
  })), [convItems])

  const [hoverId, setHoverId] = useState<number | null>(null)

  if (loading)
    return (
      <div className="loader-container">
        <ThreeDot color="#0070B4" size="medium" />
      </div>
    )
  if (error) return <div className="detailPanel-error">Error al cargar</div>

  return (
    <div className="detailPanel-container">
      <ul className="detail-panel__header">
        <li className={`detailPanel-option ${optionMenu === 1 ? 'is-active' : ''}`}>
          <button type="button" className="detailPanel-optionBtn" onClick={() => setOptionMenu(1)} aria-label="Contacto">
            <LuContact size={20} className="detailPanel-optionBtn__icon" />
          </button>
        </li>
        <li className={`detailPanel-option ${optionMenu === 2 ? 'is-active' : ''}`}>
          <button type="button" className="detailPanel-optionBtn" onClick={() => setOptionMenu(2)} aria-label="Cliente">
            <FaRegBuilding size={18} className="detailPanel-optionBtn__icon" />
          </button>
        </li>
        <li className={`detailPanel-option ${optionMenu === 3 ? 'is-active' : ''}`}>
          <button type="button" className="detailPanel-optionBtn" onClick={() => setOptionMenu(3)} aria-label="Rápidos">
            <IoChatboxEllipsesOutline size={18} className="detailPanel-optionBtn__icon" />
          </button>
        </li>
        <li className={`detailPanel-option ${optionMenu === 4 ? 'is-active' : ''}`}>
          <button type="button" className="detailPanel-optionBtn" onClick={() => setOptionMenu(4)} aria-label="Conversación">
            <BiConversation size={18} className="detailPanel-optionBtn__icon" />
          </button>
        </li>

         <li className={`detailPanel-option ${optionMenu === 5 ? 'is-active' : ''}`}>
          <button type="button" className="detailPanel-optionBtn" onClick={() => setOptionMenu(5)} aria-label="Conversación">
            <AiOutlineWechatWork size={18} className="detailPanel-optionBtn__icon" />
          </button>
        </li>
      </ul>

      <section className="detailPanel-content">
        {optionMenu === 1 && (
          <>
            <header className="detailPanel-content-header">
              <h5>Detalles del contacto</h5>
            </header>

            <div
              className="detailPanel-card"
              style={{padding: 12, marginTop: 8 }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                <div className="detailPanel-contactGroup">
                  <p className="detailPanel-clientGroup__title">Nombre</p>
                  <span className="detailPanel-clientGroup__cliente">
                    <FaUserAlt style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    {displayOrDash(selectedData?.fullName)}
                  </span>
                </div>

                <div className="detailPanel-contactGroup">
                  <p className="detailPanel-clientGroup__title">Teléfono</p>
                  <span className="detailPanel-clientGroup__cliente">
                    <FaPhone style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    {formatNiPhone(selectedData?.phone)}
                  </span>
                </div>

                <div className="detailPanel-contactGroup">
                  <p className="detailPanel-clientGroup__title">WhatsApp</p>
                  <span className="detailPanel-clientGroup__cliente" title={displayOrDash(selectedData?.waName)}>
                    <FaWhatsapp style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    <Trunc>{selectedData?.waName}</Trunc>
                  </span>
                </div>

                <div className="detailPanel-contactGroup">
                  <p className="detailPanel-clientGroup__title">Verificado</p>
                  <span
                    className={`detailPanel-clientGroup__cliente ${
                      (selectedData as any)?.isVerified ? 'status-true' : 'status-false'
                    }`}
                  >
                    {(selectedData as any)?.isVerified ? (
                      <>
                        <Check size={14} style={{ verticalAlign: 'middle', marginRight: 6, backgroundColor: "#2bc04bff", color: "#fff" }} />
                        Verificado
                      </>
                    ) : (
                      <>
                        <X size={14} style={{ verticalAlign: 'middle', marginRight: 6, backgroundColor: "#c02b2bff", color: "#fff" }} />
                        No Verificado
                      </>
                    )}
                  </span>
                </div>

                <div className="detailPanel-contactGroup">
                  <p className="detailPanel-clientGroup__title">Activo</p>
                  <span
                    className={`detailPanel-clientGroup__cliente ${
                      (selectedData as any)?.isActive ? 'status-true' : 'status-false'
                    }`}
                  >
                    {(selectedData as any)?.isActive ? (
                      <>
                        <Check size={14} style={{ verticalAlign: 'middle', marginRight: 6, backgroundColor: "#2bc04bff", color: "#fff" }} />
                        Activo
                      </>
                    ) : (
                      <>
                        <X size={14} style={{ verticalAlign: 'middle', backgroundColor: "#c02b2bff", color: "#fff", marginRight: 6 }} />
                        No Activo
                      </>
                    )}
                  </span>
                </div>

                <div className="detailPanel-contactGroup">
                  <p className="detailPanel-clientGroup__title">Verificado por</p>
                  <span className="detailPanel-clientGroup__cliente">
                    <FaUserCheck style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    {displayOrDash((selectedData as any)?.verifiedBy?.fullName)}
                  </span>
                </div>

                <div className="detailPanel-contactGroup">
                  <p className="detailPanel-clientGroup__title">Creado</p>
                  <span className="detailPanel-clientGroup__cliente">
                    <FaRegClock style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    {formatDate((selectedData as any)?.createdAt)}
                  </span>
                </div>

                <div className="detailPanel-contactGroup">
                  <p className="detailPanel-clientGroup__title">Actualizado</p>
                  <span className="detailPanel-clientGroup__cliente">
                    <FaRegClock style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    {formatDate((selectedData as any)?.updatedAt)}
                  </span>
                </div>

                <div className="detailPanel-contactGroup">
                  <p className="detailPanel-clientGroup__title">VerifiedAt</p>
                  <span className="detailPanel-clientGroup__cliente">
                    <FaCalendarAlt style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    {formatDate((selectedData as any)?.verifiedAt)}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {optionMenu === 2 && (
          <>
            <header
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 12px',
              }}
            >
              <h5>Detalles del cliente</h5>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn--secondary"
                  onClick={() => setClientEditOpen(true)}
                >
                  <Edit size={14} /> Editar
                </button>
                <button
                  className="btn btn--primary"
                  onClick={() => setShowMore(true)}
                >
                  Ver más
                </button>
              </div>
            </header>

            <div
              className="detailPanel-card"
              style={{
                padding: 12,
                marginTop: 8,
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                <div className="detailPanel-contactGroup">
                  <p className="detailPanel-clientGroup__title">Nombre</p>
                  <span className="detailPanel-clientGroup__cliente">
                    <FaRegBuilding style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    {displayOrDash(clientName)}
                  </span>
                </div>

                <div className="detailPanel-contactGroup">
                  <p className="detailPanel-clientGroup__title">Teléfono</p>
                  <span className="detailPanel-clientGroup__cliente">
                    <FaPhone style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    {clientPhoneFmt || '—'}
                  </span>
                </div>

                <div className="detailPanel-contactGroup">
                  <p className="detailPanel-clientGroup__title">Dirección</p>
                  <span className="detailPanel-clientGroup__cliente">
                    <FaMapMarkerAlt style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    {displayOrDash(
                      (clientLocal as any)?.direccion ??
                      (clientLocal as any)?.address
                    )}
                  </span>
                </div>

                <div className="detailPanel-contactGroup">
                  <p className="detailPanel-clientGroup__title">Modelo Trabajo</p>
                  <span className="detailPanel-clientGroup__cliente">
                    <FaLaptopHouse style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    {displayOrDash(
                      (clientLocal as any)?.workModel ??
                      (clientLocal as any)?.modeloTrabajo
                    )}
                  </span>
                </div>

                <div className="detailPanel-contactGroup">
                  <p className="detailPanel-clientGroup__title">Prioridad</p>
                  <span className="detailPanel-clientGroup__cliente">
                    <FaTag style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    {displayOrDash((clientLocal as any)?.priority)}
                  </span>
                </div>

                <div className="detailPanel-contactGroup">
                  <p className="detailPanel-clientGroup__title">Tipo soporte</p>
                  <span className="detailPanel-clientGroup__cliente">
                    <IoChatboxEllipsesOutline style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    {displayOrDash((clientLocal as any)?.supportType)}
                  </span>
                </div>

                <div className="detailPanel-contactGroup">
                  <p className="detailPanel-clientGroup__title">Entorno</p>
                  <span className="detailPanel-clientGroup__cliente">
                    <FaCloud style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    {displayOrDash((clientLocal as any)?.enviromentType)}
                  </span>
                </div>

                <div className="detailPanel-contactGroup">
                  <p className="detailPanel-clientGroup__title">Recurrencia</p>
                  <span className="detailPanel-clientGroup__cliente">
                    <FaSync style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    {displayOrDash((clientLocal as any)?.recurrency)}
                  </span>
                </div>

                <div className="detailPanel-contactGroup">
                  <p className="detailPanel-clientGroup__title">Soporte activo</p>
                  <span
                    className={`detailPanel-clientGroup__cliente ${
                      (clientLocal as any)?.isSupportActive
                        ? 'status-true'
                        : 'status-false'
                    }`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    {(clientLocal as any)?.isSupportActive ? (
                      <>
                        <Check size={14} style={{ verticalAlign: 'middle', marginRight: 6, backgroundColor: "#2bc04bff", color: "#fff" }}  /> Sí
                      </>
                    ) : (
                      <>
                        <X size={14} style={{ verticalAlign: 'middle', marginRight: 6, backgroundColor: "#c02b2bff", color: "#fff" }}/> No
                      </>
                    )}
                  </span>
                </div>

                <div className="detailPanel-contactGroup">
                  <p className="detailPanel-clientGroup__title">Franquicia</p>
                  <span
                    className={`detailPanel-clientGroup__cliente ${
                      (clientLocal as any)?.isFranchise ? 'status-true' : 'status-false'
                    }`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    {(clientLocal as any)?.isFranchise ? (
                      <>
                        <Check size={14} style={{ verticalAlign: 'middle', marginRight: 6, backgroundColor: "#2bc04bff", color: "#fff" }}  /> Sí
                      </>
                    ) : (
                      <>
                        <X size={14} style={{ verticalAlign: 'middle', marginRight: 6, backgroundColor: "#c02b2bff", color: "#fff" }}/> No
                      </>
                    )}
                  </span>
                </div>

                <div className="detailPanel-contactGroup">
                  <p className="detailPanel-clientGroup__title">Último contacto</p>
                  <span className="detailPanel-clientGroup__cliente">
                    <FaRegClock style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    {formatDate((clientLocal as any)?.lastContactDate)}
                  </span>
                </div>

                <div className="detailPanel-contactGroup">
                  <p className="detailPanel-clientGroup__title">Último caso cerrado</p>
                  <span className="detailPanel-clientGroup__cliente">
                    <FaRegClock style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    {formatDate((clientLocal as any)?.lastClosedCase)}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: 10 }}>
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
                  <Trunc>{(clientLocal as any)?.observation}</Trunc>
                </div>
              </div>
            </div>
          </>
        )}

        {optionMenu === 3 && (
          <>
            <header className="detailPanel-quick__header">
              <h5>Mensajes rápidos</h5>
              <input
                className="detailPanel-quick__search"
                placeholder="Buscar…"
                value={qQuick}
                onChange={(e) => setQQuick(e.target.value)}
                aria-label="Buscar mensajes rápidos"
              />
            </header>

                      <div className="detailPanel-quick">
            <ul
              className="detailPanel-quick__list"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 10 }}
            >
              {filteredQuick.map((opt, i) => (
                <li key={`${opt}-${i}`} className="detailPanel-quick__item">
                  <div
                    className="detailPanel-quick__text"
                    style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                  >
                    {opt}
                  </div>
                  <div className="detailPanel-quick__actions">
                    <button
                      type="button"
                      className="btn btn--primary"
                      onClick={() => handleSendQuick(opt, onSendNow)}
                      title="Enviar ahora"
                    >
                      Enviar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          </>
        )}

        {optionMenu === 4 && (
          <div
            className="detailPanel-card"
            style={{ 
                paddingLeft:12,
                paddingRight:12
               }}
          >
            <header
              className="detailPanel-content-header"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                position: 'relative'
              }}
            >
              <h5 style={{ margin: 0 }}>Historial de conversaciones</h5>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* <span style={{ fontSize: 12, opacity: .7 }}>
                  Total: {totalCount ?? 0}
                </span> */}

                <button
                  className="btn btn--ghost"
                  onClick={() => setShowConvFilters(s => !s)}
                  title="Filtros"
                  aria-expanded={showConvFilters}
                  aria-controls="convFilterPanel"
                >
                  <FaFilter size={14} /> <span style={{ marginLeft: 6 }}>Filtros</span>
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
                    gap: 8
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <label className="detailPanel-clientGroup__title" style={{ display: 'block' }}>Desde</label>
                      <input
                        type="date"
                        className="input"
                        value={convFrom}
                        onChange={(e) => { setConvFrom(e.target.value); setPage(1) }}
                      />
                    </div>
                    <div>
                      <label className="detailPanel-clientGroup__title" style={{ display: 'block' }}>Hasta</label>
                      <input
                        type="date"
                        className="input"
                        value={convTo}
                        onChange={(e) => { setConvTo(e.target.value); setPage(1) }}
                      />
                    </div>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <input
                      className="input"
                      placeholder="Buscar por texto…"
                      value={convQuery}
                      onChange={(e) => setConvQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); setShowConvFilters(false) } }}
                      style={{ paddingLeft: 32 }}
                    />
                    <Search size={16} style={{ position: 'absolute', left: 8, top: 10, opacity: .6 }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    {/* <button
                      className="btn btn--secondary"
                      onClick={() => { setConvFrom(''); setConvTo(''); setConvQuery(''); setPage(1); setShowConvFilters(false) }}
                    >
                      Limpiar
                    </button> */}
                    {/* <button
                      className="btn btn--primary"
                      onClick={() => { setPage(1); setShowConvFilters(false) }}
                      title="Aplicar filtros"
                    >
                      Aplicar
                    </button> */}
                  </div>
                </div>
              )}
            </header>

            <div
              style={{
                display: 'grid',
                // gap: 10,
                marginTop: 10,
                maxHeight: 420,
                overflow: 'auto',
                paddingRight: 2
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 1fr',
                  gap: 8,
                  padding: '6px 10px',
                  borderBottom: '1px solid #e5e7eb',
                  fontSize: 12,
                  opacity: .7
                }}
              >
                <span>Creado</span>
                <span>Contacto</span>
                <span>Agente</span>
                {/* <span>Estado</span> */}
                <span>Ticket</span>
              </div>
                
              {convRows.map(r => (
                          <div
                            key={r.id}
                            onMouseEnter={() => setHoverId(r.id)}
                            onMouseLeave={() => setHoverId(null)}
                            // onClick={()=>{
                            //   setSelectedConversation(r.id)
                            //   setShowHistoryModal(true)
                            // }}
                            style={{
                              position: 'relative',
                              borderBottom: '1px solid #e5e7eb',
                              padding: 10,
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr 1fr 1fr',
                              alignItems: 'center',
                              gap: 8
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
                              {r.contactName != null ? <Trunc>{r.contactName}</Trunc> : '------------------------'}
                            </div>
                            <div
                              title={r.agent}
                              style={{ overflow: 'hidden' }}
                              className="detailPanel-clientGroup__cliente"
                            >
                              {r.agent != null ? <Trunc>{r.agent}</Trunc> : '------------------------'}
                            </div>
                            <div
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
                            >
                              <span
                                title={`#${r.id}`}
                                style={{ overflow: 'hidden', flex: 1, textAlign: 'center' }}
                                className="detailPanel-clientGroup__cliente"
                              >
                                <Trunc>{r.id}</Trunc>
                              </span>
                            </div>

                            <div
                              style={{
                                position: 'absolute',
                                top: 0,
                                right:0,
                                // bottom:0,
                                // left: 0,
                                display: hoverId === r.id ? 'inline-flex' : 'none',
                                gap: 6,
                                background: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: 8,
                                padding: '4px 6px',
                                // boxShadow: '0 6px 16px rgba(0,0,0,.12)',
                                zIndex: 3
                              }}
                            >
                              <button
                                className="btn btn--ghost"
                                onClick={()=>{
                                setSelectedConversation(r.id)
                                setShowHistoryModal(true)
                              }}
                                title="Ver historial"
                              >
                                <History size={16} />
                              </button>
                              <button
                                className="btn btn--ghost"
                                onClick={() =>
                                  exportConversationHistoryToPDFAsync({
                                    contactId: r.contactId,
                                    from: convFrom || null,
                                    to: convTo || null,
                                    title: 'Reporte de Conversaciones',
                                    subtitle: 'Historia de conversaciones'
                                  })
                                }
                                disabled={!!LoadingPDF}
                                title="Descargar PDF"
                              >
                                <FileDown size={16} />
                              </button>
                            </div>
                          </div>
                        ))}

              {convRows.length === 0 && (
                <div
                  style={{
                    border: '1px dashed #e5e7eb',
                    borderRadius: 10,
                    padding: 16,
                    textAlign: 'center',
                    opacity: .7
                  }}
                >
                  Sin resultados
                </div>
              )}

              <div ref={sentinelRef} />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 10
              }}
            >
              <div style={{ fontSize: 12, opacity: .7 }}>
                {isLoadingMore ? 'Cargando más…' : hasMore ? 'Desplázate para cargar más' : 'No hay más resultados'}
              </div>
              {LoadingPDF ? <span style={{ fontSize: 12, opacity: .7 }}>Preparando PDF…</span> : null}
            </div>
          </div>
        )}

        {optionMenu === 5 && ( 
            <div  className="detailPanel-card"
              style={{
                paddingLeft:12,
                paddingRight:12
              }}>
              {/* <header className="detailPanel-quick__header">
                <h5>Conversación Actual</h5>

               <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  className="btn btn--ghost"
                  onClick={() => setShowConversarionOptions(s => !s)}
                  title="Opciones"
                  aria-expanded={showConversarionOptions}
                  aria-controls="convConOptiops"
                >
                  <SlOptionsVertical size={14} /> <span style={{ marginLeft: 6 }}>Filtros</span>
                </button>
                </div>

                 {showConvFilters && (
                  <>
                    
                        Opcion. Por el momento solo 1.
                        Replazar el togle por texto, cundo haga click se aplica en cambio, por ejemplo. Asi se remplza este toogle por lago mas elegante y comun en whatsapp

                           {convId && (
                                    <label className="switch">
                                      <input
                                        type="checkbox"
                                        className="checkbox"
                                        onChange={handleSetHaltedConversation}
                                        checked={!!conversation?.isHalted}
                                        disabled={isToggling}
                                      />
                                      <span className={`slider ${conversation?.isHalted ? 'halted' : 'active'}`}>
                                        {conversation?.isHalted ? <FaPlay className="icon" /> :  <FaPause className="icon" /> }
                                      </span>
                                    </label>
                                )}
                   
                  </>
              )}
            </header> */}

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
                  <IoIosOptions  size={14} />
                  <span style={{ marginLeft: 6 }}>Opciones</span>
                </button>
              </div>

                  {/* EL conv?.No cambia dado que solo se hace la peticion, pero no serecarga como hago en este caso. */}
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
        )}

      </section>

      {showMore && (
        <div className="dp-modal" role="dialog" aria-modal="true" aria-label="Más detalles del cliente">
          <div className="dp-modal__backdrop" onClick={() => { setShowMore(false); setEditBuffer(null) }} />
          <div className="dp-modal__content" style={{ width: 560, maxWidth: '96vw', background: '#fff', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,.15)', position: 'fixed', right: 0, top: 0, bottom: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 12, borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className={`btn-tab ${moreTab === 'cred' ? 'is-active' : ''}`} onClick={() => setMoreTab('cred')}>Credenciales</button>
                <button className={`btn-tab ${moreTab === 'dev' ? 'is-active' : ''}`} onClick={() => setMoreTab('dev')}>Equipos</button>
                <button className={`btn-tab ${moreTab === 'sys' ? 'is-active' : ''}`} onClick={() => setMoreTab('sys')}>Sistemas</button>
              </div>
              <button className="btn btn--ghost" onClick={() => { setShowMore(false); setEditBuffer(null) }} aria-label="Cerrar">
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: 12, overflow: 'auto', display: 'grid', gap: 12 }}>
              {moreTab === 'cred' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
                    <div style={{ position: 'relative', backgroundColor: '#fff' }}>
                      <input
                        className="input"
                        placeholder="Buscar credenciales de hosting…"
                        value={credSearch}
                        onChange={(e) => setCredSearch(e.target.value)}
                        style={{ paddingLeft: 34 }}
                        aria-label="Buscar credenciales"
                      />
                      <Search size={16} style={{ position: 'absolute', left: 10, top: 20, opacity: .6 }} />
                    </div>
                    <button className="btn" onClick={() => setAddHostingOpen((s) => !s)}><Plus size={14} /> Nueva credencial</button>
                  </div>

                  {addHostingOpen && (
                    <div style={{ display: 'grid', gap: 8, border: '1px dashed #e5e7eb', borderRadius: 12, padding: 10 }}>
                      <div style={{ display: 'grid', gap: 8 }}>
                        <select
                          className="input"
                          value={(newHosting as any).catalogName || 'HOSTING'}
                          onChange={(e) => setNewHosting((p: any) => ({ ...p, catalogName: e.target.value }))}
                        >
                          {[{ id: 0, name: 'HOSTING' }, ...catCredential].map((c) => (
                            <option key={`cat-opt-${c.id ?? c.name}`} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                          <input className="input" placeholder="Usuario" value={newHosting.user} onChange={(e) => setNewHosting((p: any) => ({ ...p, user: e.target.value }))} />
                          <input className="input" placeholder="text" value={newHosting.password} onChange={(e) => setNewHosting((p: any) => ({ ...p, password: e.target.value }))} />
                          <input className="input" placeholder="Instancia/Host" value={newHosting.instance} onChange={(e) => setNewHosting((p: any) => ({ ...p, instance: e.target.value }))} />
                          <input className="input" placeholder="Puerto" value={newHosting.port} onChange={(e) => setNewHosting((p: any) => ({ ...p, port: e.target.value }))} />
                          <input className="input" placeholder="Observación" value={newHosting.observation} onChange={(e) => setNewHosting((p: any) => ({ ...p, observation: e.target.value }))} />
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input type="checkbox" checked={!!newHosting.isActive} onChange={(e) => setNewHosting((p: any) => ({ ...p, isActive: e.target.checked }))} />
                          Activo
                        </label>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <button className="btn btn--ghost" onClick={() => setAddHostingOpen(false)}>Cancelar</button>
                        <button className="btn btn--primary" onClick={addHosting}>Agregar</button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                    {filteredHosting.map((it: CredentialResponseDTO, idx: number) => {
                      const key = it.id ?? idx
                      const open = openHost.has(key)
                      return (
                        <div key={`cred-${key}`} className="dp-collapse">
                          <button className="dp-collapse__header" onClick={() => toggleHost(key)}>
                            <strong className="dp-collapse__title"><Trunc>{it?.catCredencialNames ?? '---'}</Trunc></strong>
                            <div className="dp-collapse__meta">
                              <span className={`badge ${it?.isActive !== false ? 'badge--ok' : 'badge--off'}`}>{it?.isActive !== false ? 'Activo' : 'Inactivo'}</span>
                              {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </button>
                          {open && (
                            <div className="dp-collapse__body">
                              <div style={{ display: 'grid', gap: 8 }}>
                                <Row label="Usuario" value={it?.user} />
                                <Row label="Contraseña" value={it?.password ? it?.password : '---'} />
                                <Row label="Instancia" value={it?.instance} />
                                <Row label="Puerto" value={it?.port} />
                              </div>
                              <div>
                                <p className="detailPanel-clientGroup__title">Observación</p>
                                <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: 8, minHeight: 40, background: '#FAFAFA' }}>
                                  <Trunc>{it?.observation}</Trunc>
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button className="btn btn--ghost" onClick={() => { setEditBuffer({ ...it, _t: 'cred' }); setShowMore(true); setMoreTab('cred') }}>Editar</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {moreTab === 'dev' && (
                <>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        className="input"
                        placeholder="Buscar por nombre, IP, SO…"
                        value={devSearch}
                        onChange={(e) => setDevSearch(e.target.value)}
                        style={{ paddingLeft: 34 }}
                        aria-label="Buscar equipos"
                      />
                      <Search size={16} style={{ position: 'absolute', left: 10, top: 10, opacity: .6 }} />
                    </div>
                    <button className="btn" onClick={() => setAddDeviceOpen(true)}><Plus size={14} /> Nuevo equipo</button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 12 }}>
                    {filteredDevs.map((it) => {
                      const open = openDev.has(it.id)
                      return (
                        <div key={it.id} className="dp-collapse">
                          <button className="dp-collapse__header" onClick={() => toggleDev(it.id)}>
                            <div className="dp-collapse__title"><Trunc>{it?.name}</Trunc></div>
                            <div className="dp-collapse__subtitle">
                              <span>{it?.ip}</span>
                              <span>{it?.operatingSystem}</span>
                              <span>{it?.versionSO}</span>
                              <span>{it?.isActive ? 'Activo' : 'Inactivo'}</span>
                            </div>
                            <div className="dp-collapse__meta">{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                          </button>

                          {open && (
                            <div className="dp-collapse__body">
                              <div>
                                <p className="detailPanel-clientGroup__title">Descripción</p>
                                <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: 8, minHeight: 40, background: '#FAFAFA' }}>
                                  <Trunc>{it?.description}</Trunc>
                                </div>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                                <h6 style={{ margin: 0 }}>Credenciales de equipo</h6>
                                <button
                                  className="btn"
                                  onClick={() => {
                                    setAddDevOpenId(it.id)
                                    setNewDevCred({ catalogName: '', user: '', password: '', instance: '', port: '', observation: '' })
                                  }}
                                >
                                  <Plus size={14} /> Nueva
                                </button>
                              </div>

                              {addDevOpenId === it.id && (
                                <div style={{ display: 'grid', gap: 8, border: '1px dashed #e5e7eb', borderRadius: 12, padding: 10 }}>
                                  <div style={{ display: 'grid', gap: 8 }}>
                                    <select
                                      className="input"
                                      value={(newDevCred as any).catalogName || ''}
                                      onChange={(e) => setNewDevCred((p: any) => ({ ...p, catalogName: e.target.value }))}
                                    >
                                      <option value="">Seleccionar categoría</option>
                                      {catCredential.map(c => <option key={`dev-cat-${c.id}`} value={c.name}>{c.name}</option>)}
                                    </select>
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                                    <input className="input" placeholder="Usuario" value={newDevCred.user} onChange={(e) => setNewDevCred((p: any) => ({ ...p, user: e.target.value }))} />
                                    <input className="input" placeholder="Contraseña" value={newDevCred.password} onChange={(e) => setNewDevCred((p: any) => ({ ...p, password: e.target.value }))} />
                                    <input className="input" placeholder="Puerto" value={newDevCred.port} onChange={(e) => setNewDevCred((p: any) => ({ ...p, port: e.target.value }))} />
                                    <input className="input" placeholder="Instancia/Host" value={newDevCred.instance} onChange={(e) => setNewDevCred((p: any) => ({ ...p, instance: e.target.value }))} />
                                  </div>
                                  <textarea className="input" placeholder="Observación" value={newDevCred.observation} onChange={(e) => setNewDevCred((p: any) => ({ ...p, observation: e.target.value }))} />
                                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                    <button className="btn btn--ghost" onClick={() => setAddDevOpenId(null)}>Cancelar</button>
                                    <button className="btn btn--primary" onClick={() => addDeviceCredential(it.id)}>Agregar</button>
                                  </div>
                                </div>
                              )}

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                                {(it.credentials ?? []).map((c: any) => (
                                  <div key={c.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 10, display: 'grid', gap: 6 }}>
                                    <strong><Trunc>{c.type ?? c.catCredencialNames}</Trunc></strong>
                                    <div style={{display:"flex", flexDirection:"column", gap: 8 , width:"100%"}}>
                                      <Row label="Usuario" value={c.user} />
                                      <Row label="Contraseña" value={c.password ? c.password  : '---'} />
                                      <Row label="Instancia" value={c.instance} />
                                      <Row label="Puerto" value={c.port} />
                                    </div>
                                    <div>
                                      <p className="detailPanel-clientGroup__title">Observación</p>
                                      <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: 8, minHeight: 36, background: '#FAFAFA' }}>
                                        <Trunc>{c.observation}</Trunc>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {(it.credentials ?? []).length === 0 ? <div style={{ opacity: .7, fontSize: 12 }}>Sin credenciales de equipo</div> : null}
                              </div>

                              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button className="btn btn--ghost" onClick={() => { setEditBuffer({ ...it, _t: 'dev' }); setShowMore(true); setMoreTab('dev') }}>Editar</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {moreTab === 'sys' && (
                <>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        className="input"
                        placeholder="Buscar sistemas…"
                        value={sysSearch}
                        onChange={(e) => setSysSearch(e.target.value)}
                        style={{ paddingLeft: 34 }}
                        aria-label="Buscar sistemas"
                      />
                      <Search size={16} style={{ position: 'absolute', left: 10, top: 10, opacity: .6 }} />
                    </div>
                    <button className="btn" onClick={openSystemPicker}><Plus size={14} /> Agregar sistema</button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 12 }}>
                    {filteredSystems.map((it) => {
                      const open = openSys.has(it.id)
                      return (
                        <div key={it.id} className="dp-collapse">
                          <button className="dp-collapse__header" onClick={() => toggleSys(it.id)}>
                            <div className="dp-collapse__title"><Trunc>{it?.name}</Trunc></div>
                            <div className="dp-collapse__subtitle"><span>{it?.version}</span></div>
                            <div className="dp-collapse__meta">{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                          </button>

                          {open && (
                            <div className="dp-collapse__body">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h6 style={{ margin: 0 }}>Credenciales de sistema</h6>
                                <button
                                  className="btn"
                                  onClick={() => {
                                    setAddSysOpenId(it.id)
                                    setNewSysCred({ catalogName: '', user: '', password: '', instance: '', port: '', observation: '' })
                                  }}
                                >
                                  <Plus size={14} /> Nueva
                                </button>
                              </div>

                              {addSysOpenId === it.id && (
                                <div style={{ display: 'grid', gap: 8, border: '1px dashed #e5e7eb', borderRadius: 12, padding: 10, marginTop: 8 }}>
                                  <div style={{ display: 'grid', gap: 8 }}>
                                    <select
                                      className="input"
                                      value={(newSysCred as any).catalogName || ''}
                                      onChange={(e) => setNewSysCred((p: any) => ({ ...p, catalogName: e.target.value }))}
                                    >
                                      <option value="">Seleccionar categoría</option>
                                      {catCredential.map(c => <option key={`sys-cat-${c.id}`} value={c.name}>{c.name}</option>)}
                                    </select>
                                  </div>
                                  <div style={{ display: 'grid', gap: 8 }}>
                                    <input className="input" placeholder="Usuario" value={newSysCred.user} onChange={(e) => setNewSysCred((p: any) => ({ ...p, user: e.target.value }))} />
                                    <input className="input" placeholder="Contraseña" value={newSysCred.password} onChange={(e) => setNewSysCred((p: any) => ({ ...p, password: e.target.value }))} />
                                    <input className="input" placeholder="Puerto" value={newSysCred.port} onChange={(e) => setNewSysCred((p: any) => ({ ...p, port: e.target.value }))} />
                                    <input className="input" placeholder="Instancia/Host" value={newSysCred.instance} onChange={(e) => setNewSysCred((p: any) => ({ ...p, instance: e.target.value }))} />
                                  </div>
                                  <textarea className="input" placeholder="Observación" value={newSysCred.observation} onChange={(e) => setNewSysCred((p: any) => ({ ...p, observation: e.target.value }))} />
                                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                    <button className="btn btn--ghost" onClick={() => setAddSysOpenId(null)}>Cancelar</button>
                                    <button className="btn btn--primary" onClick={() => addSystemCredential(it.id)}>Agregar</button>
                                  </div>
                                </div>
                              )}

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginTop: 8 }}>
                                {(it.credentials ?? []).map((c: any) => (
                                  <div key={c.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 10, display: 'grid', gap: 6 }}>
                                    <strong><Trunc>{c.type ?? c.catCredencialNames}</Trunc></strong>
                                    <div style={{ display:"flex", flexDirection:"column", gap: 8 , width:"100%" }}>
                                      <Row label="Usuario" value={c.user} />
                                      <Row label="Contraseña" value={c.password ? c.password  : '---'} />
                                      <Row label="Instancia" value={c.instance} />
                                      <Row label="Puerto" value={c.port} />
                                    </div>
                                    <div>
                                      <p className="detailPanel-clientGroup__title">Observación</p>
                                      <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: 8, minHeight: 36, background: '#FAFAFA' }}>
                                        <Trunc>{c.observation}</Trunc>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {(it.credentials ?? []).length === 0 ? <div style={{ opacity: .7, fontSize: 12 }}>Sin credenciales de sistema</div> : null}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {moreTab === 'ctc' && (
                <>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        className="input"
                        placeholder="Buscar contactos…"
                        value={ctcSearch}
                        onChange={(e) => setCtcSearch(e.target.value)}
                        style={{ paddingLeft: 34 }}
                        aria-label="Buscar contactos"
                      />
                      <Search size={16} style={{ position: 'absolute', left: 10, top: 10, opacity: .6 }} />
                    </div>
                    <button className="btn" onClick={openContactPicker}><Plus size={14} /> Agregar contacto</button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
                    {filteredContacts.map((it) => (
                      <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '8px 0', borderBottom: '1px dashed #eee' }}>
                        <Trunc>{it.fullName ?? it.name}</Trunc>
                        <Trunc>Cargo</Trunc>
                        <Trunc>{formatNiPhone(it.phone)}</Trunc>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {editBuffer && (
              <div style={{ borderTop: '1px solid #585858ff', padding: 12, display: 'grid', gap: 10 }}>
                <h6 style={{ margin: 0 }}>Edición rápida</h6>

                {editBuffer?._t === 'cred' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <input className="input" placeholder="Categoría" value={editBuffer?.catCredencialNames ?? ''} onChange={(e) => setEditBuffer((p: any) => ({ ...p, catCredencialNames: e.target.value }))} />
                    <input className="input" placeholder="Usuario" value={editBuffer?.user ?? ''} onChange={(e) => setEditBuffer((p: any) => ({ ...p, user: e.target.value }))} />
                    <input className="input" placeholder="Contraseña" value={editBuffer?.password ?? ''} onChange={(e) => setEditBuffer((p: any) => ({ ...p, password: e.target.value }))} />
                    <input className="input" placeholder="Instancia" value={editBuffer?.instance ?? ''} onChange={(e) => setEditBuffer((p: any) => ({ ...p, instance: e.target.value }))} />
                    <input className="input" placeholder="Puerto" value={editBuffer?.port ?? ''} onChange={(e) => setEditBuffer((p: any) => ({ ...p, port: e.target.value }))} />
                    <textarea className="input" placeholder="Observación" style={{ gridColumn: '1 / -1', minHeight: 80 }} value={editBuffer?.observation ?? ''} onChange={(e) => setEditBuffer((p: any) => ({ ...p, observation: e.target.value }))} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="checkbox" checked={!!editBuffer?.isActive} onChange={(e) => setEditBuffer((p: any) => ({ ...p, isActive: e.target.checked }))} />
                      Activo
                    </label>
                  </div>
                )}

                {editBuffer?._t === 'dev' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <input className="input" placeholder="Nombre" value={editBuffer?.name ?? ''} onChange={(e) => setEditBuffer((p: any) => ({ ...p, name: e.target.value }))} />
                    <input className="input" placeholder="IP" value={editBuffer?.ip ?? ''} onChange={(e) => setEditBuffer((p: any) => ({ ...p, ip: e.target.value }))} />
                    <input className="input" placeholder="SO" value={editBuffer?.operatingSystem ?? ''} onChange={(e) => setEditBuffer((p: any) => ({ ...p, operatingSystem: e.target.value }))} />
                    <input className="input" placeholder="Versión SO" value={editBuffer?.versionSO ?? ''} onChange={(e) => setEditBuffer((p: any) => ({ ...p, versionSO: e.target.value }))} />
                    <textarea className="input" placeholder="Descripción" style={{ gridColumn: '1 / -1', minHeight: 80 }} value={editBuffer?.description ?? ''} onChange={(e) => setEditBuffer((p: any) => ({ ...p, description: e.target.value }))} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="checkbox" checked={!!editBuffer?.isActive} onChange={(e) => setEditBuffer((p: any) => ({ ...p, isActive: e.target.checked }))} />
                      Activo
                    </label>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button className="btn btn--ghost" onClick={() => setEditBuffer(null)}>Cancelar</button>
                  <button className="btn btn--primary" onClick={() => setEditBuffer(null)}>Guardar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {clientEditOpen && (
        <div className="dp-modal" role="dialog" aria-modal="true" aria-label="Editar cliente">
          <div className="dp-modal__backdrop" onClick={() => setClientEditOpen(false)} />
          <div className="dp-modal__content" style={{ width: 500, maxWidth: '94vw', background: '#fff', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,.15)', position: 'fixed', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 12, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h6 style={{ margin: 0, fontSize: 12 }}>Editar cliente</h6>
              <button className="btn btn--ghost" onClick={() => setClientEditOpen(false)} aria-label="Cerrar"><X size={16} /></button>
            </div>
            <div style={{ padding: 12, display: 'grid', gap: 10 }}>
              <div className="grid2">
                <textarea className="input" placeholder="Modelo de trabajo" value={workModel} onChange={(e) => setWorkModel(e.target.value)} rows={10} />
                <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="">Prioridad</option>
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
                <select className="input" value={supportType} onChange={(e) => setSupportType(e.target.value)}>
                  <option value="">Tipo soporte</option>
                  <option value="AAA">AAA</option>
                  <option value="AA">AA</option>
                  <option value="A">A</option>
                </select>
                <select className="input" value={envType} onChange={(e) => setEnvType(e.target.value)}>
                  <option value="">Entorno</option>
                  <option value="LOCAL">LOCAL</option>
                  <option value="NUBE">NUBE</option>
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={isSupportActive} onChange={(e) => setIsSupportActive(e.target.checked)} />
                Soporte activo
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={isFranchise} onChange={(e) => setIsFranchise(e.target.checked)} />
                Franquicia
              </label>
              <textarea className="input" placeholder="Observación" value={observation} onChange={(e) => setObservation(e.target.value)} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn btn--ghost" onClick={() => setClientEditOpen(false)}>Cancelar</button>
                <button className="btn btn--primary" onClick={saveClientEdits}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

           {addDeviceOpen && (
        <div className="dp-modal" role="dialog" aria-modal="true" aria-label="Nuevo equipo">
          <div className="dp-modal__backdrop" onClick={() => setAddDeviceOpen(false)} />
          <div className="dp-modal__content" style={{ width: 500, background: '#fff', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,.15)', position: 'fixed', right: 0, top: 0, bottom: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 12, borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h6 style={{ margin: 0 }}>Nuevo equipo</h6>
              <button className="btn btn--ghost" onClick={() => setAddDeviceOpen(false)} aria-label="Cerrar"><X size={16} /></button>
            </div>
            <div style={{ padding: 12, display: 'grid', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input className="input" placeholder="Nombre" value={newDevice.name} onChange={(e) => setNewDevice((p: any) => ({ ...p, name: e.target.value }))} />
                <input className="input" placeholder="IP" value={newDevice.ip} onChange={(e) => setNewDevice((p: any) => ({ ...p, ip: e.target.value }))} />
                <input className="input" placeholder="SO" value={newDevice.operatingSystem} onChange={(e) => setNewDevice((p: any) => ({ ...p, operatingSystem: e.target.value }))} />
                <input className="input" placeholder="Versión SO" value={newDevice.versionSO} onChange={(e) => setNewDevice((p: any) => ({ ...p, versionSO: e.target.value }))} />
              </div>
              <textarea className="input" placeholder="Descripción" value={newDevice.description} onChange={(e) => setNewDevice((p: any) => ({ ...p, description: e.target.value }))} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={!!newDevice.isActive} onChange={(e) => setNewDevice((p: any) => ({ ...p, isActive: e.target.checked }))} />
                Activo
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn btn--ghost" onClick={() => setAddDeviceOpen(false)}>Cancelar</button>
                <button className="btn btn--primary" onClick={createDevice}>Crear</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {pickSysOpen && (
        <div className="dp-modal" role="dialog" aria-modal="true" aria-label="Agregar sistema">
          <div className="dp-modal__backdrop" onClick={() => setPickSysOpen(false)} />
          <div className="dp-modal__content" style={{ width: 620, maxWidth: '96vw', background: '#fff', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,.15)', position: 'fixed', right: 0, top: 0, bottom: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 12, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h6 style={{ margin: 0 }}>Agregar sistema</h6>
              <button className="btn btn--ghost" onClick={() => setPickSysOpen(false)} aria-label="Cerrar"><X size={16} /></button>
            </div>
            <div style={{ padding: 12, display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    className="input"
                    placeholder="Buscar en catálogo de sistemas…"
                    value={sysPickerLocalFilter}
                    onChange={(e) => { setSysPickerLocalFilter(e.target.value); setSysGlobalFilter(e.target.value); fetchSysPage(1, sysPageSize) }}
                    style={{ paddingLeft: 34 }}
                    aria-label="Buscar en catálogo de sistemas"
                  />
                  <Search size={16} style={{ position: 'absolute', left: 10, top: 10, opacity: .6 }} />
                </div>
                <select className="input" value={String(sysPageSize)} onChange={(e) => setSysPageSize(Number(e.target.value))}>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>

              <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
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
                              onChange={() => setNewSystem({ ...newSystem, outsourcedSystemsId: s.id })}
                              aria-label={`Seleccionar ${s.name}`}
                            />
                          </td>
                          <td>{s.name}</td>
                          <td>{s.version ?? '---'}</td>
                          <td><Trunc>{s.description}</Trunc></td>
                        </tr>
                      ))}
                      {sysCatalog.length === 0 && (
                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: 16, opacity: .7 }}>Sin resultados</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: 12, opacity: .7 }}>Total: {sysTotal}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button className="btn btn--ghost" onClick={() => setSysPage(Math.max(1, sysPage - 1))}>Prev</button>
                    <span style={{ fontSize: 12 }}>Página {sysPage}</span>
                    <button className="btn btn--ghost" onClick={() => setSysPage(sysPage + 1)}>Next</button>
                  </div>
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={!!newSystem.isActive} onChange={(e) => setNewSystem({ ...newSystem, isActive: e.target.checked })} />
                Activo
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn btn--ghost" onClick={() => setPickSysOpen(false)}>Cancelar</button>
                <button className="btn btn--primary" onClick={addPickedSystem} disabled={!newSystem.outsourcedSystemsId}>Agregar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConversationHistoryModal
              isOpen={showHistoryModal}
              onClose={() => setShowHistoryModal(false)}
              conversationId={selectedConversation}
            />
    </div>
  )
}

export default DetailPanel