/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react'
import { LuContact } from 'react-icons/lu'
import { FaRegBuilding, FaWhatsapp } from 'react-icons/fa'
import { IoChatboxEllipsesOutline } from 'react-icons/io5'
import { Book, Check, Edit, Tag, X, Plus, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { ThreeDot } from 'react-loading-indicators'
import { useDetailPanel } from '@/Hooks/Chat/useDetailPanel'
import { useContactDetail } from '@/Hooks/Chat/useContactDetail'
import { useCatCredential } from '@/Hooks/Crm/useCatCredential'
import '@/Styles/Chat/DetailPanel.css'
import type { CredentialResponseDTO } from '@/Interfaces/Crm/ClientInterface'

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
    pickCtcOpen,
    setPickCtcOpen,
    newContact,
    setNewContact,
    addPickedContact,
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
    contactPickerItems,
    openContactPicker,
  } = useDetailPanel(contactId, selectedParam)

  const { catCredential } = useCatCredential()

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

  const Trunc = ({ children }: { children?: React.ReactNode }) => (
    <span
      title={children ? String(children) : '---'}
      style={{
        maxWidth: 240,
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
  const [ctcPickerFilter, setCtcPickerFilter] = useState('')

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
            <Book size={18} className="detailPanel-optionBtn__icon" />
          </button>
        </li>
      </ul>

      <section className="detailPanel-content">
        {optionMenu === 1 && (
          <>
            <header><h5>Detalles del contacto</h5></header>
            <div className="detailPanel-card" style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 12, marginTop: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                <div className="detailPanel-contactGroup"><p className="detailPanel-clientGroup__title">Nombre</p><span className="detailPanel-clientGroup__cliente">{displayOrDash(selectedData?.fullName)}</span></div>
                <div className="detailPanel-contactGroup"><p className="detailPanel-clientGroup__title">Teléfono</p><span className="detailPanel-clientGroup__cliente">{formatNiPhone(selectedData?.phone)}</span></div>
                <div className="detailPanel-contactGroup">
                  <p className="detailPanel-clientGroup__title">WhatsApp</p>
                  <span className="detailPanel-clientGroup__cliente" title={displayOrDash(selectedData?.waName)}>
                    <FaWhatsapp style={{ verticalAlign: 'middle', marginRight: 6 }} /> <Trunc>{selectedData?.waName}</Trunc>
                  </span>
                </div>
                <div className="detailPanel-contactGroup"><p className="detailPanel-clientGroup__title">Verificado</p><span className="detailPanel-clientGroup__cliente">{(selectedData as any)?.isVerified ? 'Verificado' : 'No Verificado'}</span></div>
                <div className="detailPanel-contactGroup"><p className="detailPanel-clientGroup__title">Activo</p><span className="detailPanel-clientGroup__cliente">{(selectedData as any)?.isActive ? 'Activo' : 'No Activo'}</span></div>
                <div className="detailPanel-contactGroup"><p className="detailPanel-clientGroup__title">Verificado por</p><span className="detailPanel-clientGroup__cliente">{displayOrDash((selectedData as any)?.verifiedBy?.fullName)}</span></div>
                <div className="detailPanel-contactGroup"><p className="detailPanel-clientGroup__title">Creado</p><span className="detailPanel-clientGroup__cliente">{formatDate((selectedData as any)?.createdAt)}</span></div>
                <div className="detailPanel-contactGroup"><p className="detailPanel-clientGroup__title">Actualizado</p><span className="detailPanel-clientGroup__cliente">{formatDate((selectedData as any)?.updatedAt)}</span></div>
                <div className="detailPanel-contactGroup"><p className="detailPanel-clientGroup__title">verifiedAt</p><span className="detailPanel-clientGroup__cliente">{formatDate((selectedData as any)?.verifiedAt)}</span></div>
              </div>
            </div>
          </>
        )}

        {optionMenu === 2 && (
          <>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h5>Detalles del cliente</h5>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn--secondary" onClick={() => setClientEditOpen(true)}><Edit size={14} /> Editar</button>
                <button className="btn btn--primary" onClick={() => setShowMore(true)}>Ver más</button>
              </div>
            </header>

            <div className="detailPanel-card" style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 12, marginTop: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                <Row label="Nombre" value={clientName} />
                <Row label="Teléfono" value={clientPhoneFmt} />
                <Row label="Dirección" value={(clientLocal as any)?.direccion ?? (clientLocal as any)?.address} />
                <Row label="Modelo Trabajo" value={(clientLocal as any)?.workModel ?? (clientLocal as any)?.modeloTrabajo} />
                <Row label="Prioridad" value={(clientLocal as any)?.priority} />
                <Row label="Tipo soporte" value={(clientLocal as any)?.supportType} />
                <Row label="Entorno" value={(clientLocal as any)?.enviromentType} />
                <Row label="Soporte activo" value={(clientLocal as any)?.isSupportActive ? 'Sí' : 'No'} />
                <Row label="Franquicia" value={(clientLocal as any)?.isFranchise ? 'Sí' : 'No'} />
                <Row label="Último contacto" value={formatDate((clientLocal as any)?.lastContactDate)} />
                <Row label="Último caso cerrado" value={formatDate((clientLocal as any)?.lastClosedCase)} />
              </div>
              <div style={{ marginTop: 10 }}>
                <p className="detailPanel-clientGroup__title">Observación</p>
                <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: 8, minHeight: 40, background: '#FAFAFA' }}>
                  <Trunc>{(clientLocal as any)?.observation}</Trunc>
                </div>
              </div>
            </div>
          </>
        )}

        {optionMenu === 3 && (
          <div className="detailPanel-quick">
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
        )}

        {optionMenu === 4 && (
          <div className="detailPanel-conv">
            <header><h5>Detalles de la conversación</h5></header>
            {(() => {
              const R = ({ label, value }: { label: string; value: React.ReactNode }) => (
                <div className="detailPanel-contactGroup">
                  <p className="detailPanel-contactGroup__title">{label}</p>
                  <span className="detailsPanel-contactGroup__value">{value ?? '---'}</span>
                </div>
              )
              return (
                <>
                  <div className="detailPanel-contactGroup-__container">
                    <R label="Empresa" value={conv?.systemDefinedCompanyName ?? '---'} />
                    <R label="Contacto" value={conv?.clientContactName ?? '---'} />
                    <R label="Número" value={conv?.contactNumber ?? '---'} />
                    <R
                      label="Canal"
                      value={
                        <span title="WhatsApp">
                          <FaWhatsapp style={{ verticalAlign: 'middle' }} />
                        </span>
                      }
                    />
                    <R label="Estado Reciente" value={conv?.status ?? '---'} />
                  </div>
                  <div className="detailPanel-contactGroup-__container">
                    <R label="Creado" value={formatDate(conv?.createdAt)} />
                    <R label="Solicitud de agente" value={formatDate(conv?.agentRequestAt)} />
                    <R label="Asignación a agente" value={formatDate(conv?.assignedAt)} />
                    <R label="Primer mensaje del agente" value={formatDate(conv?.agentFirstMessageAt)} />
                    <R label="Último mensaje del agente" value={formatDate(conv?.agentLastMessageAt)} />
                    <R label="Último mensaje del cliente" value={formatDate(conv?.clientLastMessageAt)} />
                    <R label="Última actualización" value={formatDate(conv?.updatedAt)} />
                    <R label="Cierre" value={formatDate(conv?.closedAt)} />
                  </div>
                  <div className="detailPanel-contactGroup-__container">
                    {conv?.assignedByUserName && <R label="Asignado por" value={conv.assignedByUserName} />}
                    {conv?.assignedAgentName && <R label="Agente asignado" value={conv.assignedAgentName} />}
                  </div>
                  {conversationTone && (
                    <div className="detailPanel-contactGroup-__container">
                      <R
                        label="Tono de conversación"
                        value={<strong className={`conversation-toneText__${conversationTone.trim()}`}>{conversationTone}</strong>}
                      />
                    </div>
                  )}
                  <div className="detailPanel-tags" style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Tag size={16} />
                      <h6 style={{ margin: 0 }}>Etiquetas</h6>
                      {!isAddingTag && (
                        <button className="section-action" onClick={() => setIsAddingTag(true)}>
                          <Edit size={14} /> <span>Editar</span>
                        </button>
                      )}
                    </div>
                    {tags.length === 0 ? null : (
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
                </>
              )
            })()}
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
                <button className={`btn-tab ${moreTab === 'ctc' ? 'is-active' : ''}`} onClick={() => setMoreTab('ctc')}>Contactos</button>
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
                          <input className="input" placeholder="Contraseña" value={newHosting.password} onChange={(e) => setNewHosting((p: any) => ({ ...p, password: e.target.value }))} />
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
                                <Row label="Contraseña" value={it?.password ? '••••••••' : '---'} />
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
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                      <Row label="Usuario" value={c.user} />
                                      <Row label="Contraseña" value={c.password ? '••••••' : '---'} />
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
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                      <Row label="Usuario" value={c.user} />
                                      <Row label="Contraseña" value={c.password ? '••••••' : '---'} />
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

      {pickCtcOpen && (
        <div className="dp-modal" role="dialog" aria-modal="true" aria-label="Vincular contacto existente">
          <div className="dp-modal__backdrop" onClick={() => setPickCtcOpen(false)} />
          <div className="dp-modal__content" style={{ width: 560, maxWidth: '96vw', background: '#fff', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,.15)', position: 'fixed', right: 0, top: 0, bottom: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 12, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h6 style={{ margin: 0 }}>Vincular contacto existente</h6>
              <button className="btn btn--ghost" onClick={() => setPickCtcOpen(false)} aria-label="Cerrar"><X size={16} /></button>
            </div>
            <div style={{ padding: 12, display: 'grid', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  placeholder="Buscar contacto por nombre o teléfono…"
                  value={ctcPickerFilter}
                  onChange={(e) => setCtcPickerFilter(e.target.value)}
                  style={{ paddingLeft: 34 }}
                  aria-label="Buscar contacto"
                />
                <Search size={16} style={{ position: 'absolute', left: 10, top: 10, opacity: .6 }} />
              </div>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, maxHeight: 420, overflow: 'auto' }}>
                <table className="dp-table">
                  <thead>
                    <tr>
                      <th style={{ width: 48 }}></th>
                      <th>Nombre</th>
                      <th>Teléfono</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contactPickerItems
                      .filter(c => {
                        const q = ctcPickerFilter.trim().toLowerCase()
                        if (!q) return true
                        return (c.fullName || '').toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q)
                      })
                      .map(c => (
                        <tr key={c.id}>
                          <td>
                            <input
                              type="radio"
                              name="pickContact"
                              checked={newContact.contactId === c.id}
                              onChange={() => setNewContact({ ...newContact, contactId: c.id })}
                              aria-label={`Seleccionar ${c.fullName || 'contacto'}`}
                            />
                          </td>
                          <td>{c.fullName || '---'}</td>
                          <td>{formatNiPhone(c.phone)}</td>
                        </tr>
                      ))}
                    {contactPickerItems.length === 0 && (
                      <tr><td colSpan={3} style={{ textAlign: 'center', padding: 16, opacity: .7 }}>Sin resultados</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={!!newContact.isActive} onChange={(e) => setNewContact({ ...newContact, isActive: e.target.checked })} />
                Activo
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn btn--ghost" onClick={() => setPickCtcOpen(false)}>Cancelar</button>
                <button className="btn btn--primary" onClick={addPickedContact} disabled={!newContact.contactId}>Agregar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DetailPanel