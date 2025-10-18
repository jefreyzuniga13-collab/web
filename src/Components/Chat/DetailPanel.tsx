/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-empty */
import React, { useMemo, useState } from 'react'
import { LuContact } from 'react-icons/lu'
import { FaRegBuilding } from 'react-icons/fa'
import { IoChatboxEllipsesOutline } from 'react-icons/io5'
import { Book, Check, Edit, Tag, X, Plus, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { ThreeDot } from 'react-loading-indicators'
import { useDetailPanel } from '@/Hooks/Chat/useDetailPanel'
import { useContactDetail } from '@/Hooks/Chat/useContactDetail'
import '@/Styles/Chat/DetailPanel.css'

type Props = {
  contactId?: number
  conversationId?: number
  selectedParam?: unknown
  onSendNow?: (txt: string) => void | Promise<void>
}

const CATS_CRED_DEVICE = ['SQL', 'RDP', 'ANYDESK', 'VPN', 'OTRO'] as const
const CATS_CRED_SYSTEM = ['APLICACION'] as const

const formatNiPhone = (value?: string | number | null) => {
  if (value == null) return '---'
  const digits = String(value).replace(/\D/g, '')
  let local = digits.startsWith('505') ? digits.slice(3) : digits
  if (!local) return '---'
  if (local.length > 8) local = local.slice(-8)
  return `505 - ${local}`
}
const displayOrDash = (v?: string | number | null) =>
  v === null || v === undefined || v === '' ? '---' : String(v)
const formatDate = (v?: string | number | Date | null) => {
  if (!v) return '---'
  const d = new Date(v)
  if (isNaN(d.getTime())) return displayOrDash(v as any)
  return new Intl.DateTimeFormat('es-NI', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

const DetailPanel: React.FC<Props> = ({
  contactId,
  conversationId,
  selectedParam,
  onSendNow,
}) => {
  const {
    selectedData,
    client,
    optionMenu,
    setOptionMenu,
    quickOptions,
    loading,
    error,
  } = useDetailPanel(contactId, selectedParam)

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

  const [q, setQ] = useState('')
  const filteredQuick = useMemo(() => {
    const n = q.toLowerCase()
    return (quickOptions.length ? quickOptions : ['Claro, con gusto.', 'Enseguida te ayudo.', '¿Podrías compartir más detalles?']).filter((s) => s.toLowerCase().includes(n))
  }, [quickOptions, q])

  const [showMore, setShowMore] = useState(false)
  const [moreTab, setMoreTab] = useState<'cred' | 'dev' | 'sys' | 'ctc'>('cred')
  const [editBuffer, setEditBuffer] = useState<any>(null)

  // const contactPhone = formatNiPhone(selectedData?.phone)
  const clientPhone = (client as any)?.telefono || (client as any)?.celular || ''
  const clientPhoneFmt = formatNiPhone(clientPhone)

  const handleSendQuick = async (text: string) => {
    try {
      if (onSendNow) {
        await onSendNow(text)
        return
      }
      const w = window as any
      if (typeof w.__CHAT_SEND_QUICK__ === 'function') {
        w.__CHAT_SEND_QUICK__(text)
        return
      }
      window.dispatchEvent(new CustomEvent('chat:sendQuick', { detail: { text } }))
    } catch {}
  }

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

  const [hostingCreds, setHostingCreds] = useState<any[]>(
    (client as any)?.credentials?.filter((c: any) => String(c.catCredencialNames || c.category).toUpperCase() === 'HOSTING') ??
      [
        { id: 9001, catCredencialNames: 'HOSTING', user: 'cpanel', password: '', instance: 'cpanel.hosting.com', port: '', observation: 'CPanel Producción', isActive: true },
      ]
  )

  const [devs, setDevs] = useState<any[]>(
    ((client as any)?.outsourcedDevices ?? (client as any)?.devices ?? [
      { id: 5001, name: 'Servidor Central', ip: '192.168.1.20', operatingSystem: 'Windows Server 2022', versionSO: 'Build 20348', isActive: true, description: 'Servidor principal ERP',
        credentials: [
          { id: 1, type: 'RDP', user: 'admin', password: '', instance: 'srv-01', port: '3389', observation: 'Escritorio remoto' },
          { id: 2, type: 'SQL', user: 'dbadmin', password: '', instance: 'sql01', port: '1433', observation: 'SQL Prod' },
          { id: 3, type: 'ANYDESK', user: 'adcode', password: '', instance: '123-456-789', port: '', observation: 'Acceso remoto' },
        ]
      },
    ]).map((d: any) => ({ ...d, credentials: d.credentials ?? [] }))
  )

  const [systems, setSystems] = useState<any[]>(
    ((client as any)?.outsourcedSystems ?? (client as any)?.systems ?? [
      { id: 2, name: 'CRM', version: 'v1.4', credentials: [{ id: 92, type: 'APLICACION', user: 'crm_user', password: '', instance: 'crm.empresa.com', port: '', observation: '' }] },
    ]).map((s: any) => ({ ...s, credentials: s.credentials ?? [] }))
  )

  const [contacts, setContacts] = useState<any[]>(
    (client as any)?.contacts ?? (client as any)?.clientContacts ?? [
      { id: 11, fullName: 'María López', phone: '50588887777' },
      { id: 12, fullName: 'Carlos Pérez', phone: '50588556644' },
      { id: 13, fullName: 'Ana Gómez', phone: '50584223311' },
      { id: 14, fullName: 'Jorge Ruiz', phone: '50587112233' },
    ]
  )

  const catalogSystems = [
    { id: 1, name: 'ERP Cloud', version: 'v3.2' },
    { id: 2, name: 'CRM', version: 'v1.4' },
    { id: 3, name: 'POS Retail', version: 'v2.1' },
    { id: 4, name: 'Billing Core', version: '2025.10' },
    { id: 5, name: 'Inventario', version: '2024.7' },
  ]
  const catalogContacts = [
    { id: 101, fullName: 'Luis Castillo', phone: '50588112233' },
    { id: 102, fullName: 'Paola Rivas', phone: '50588223344' },
    { id: 103, fullName: 'Marta Silva', phone: '50588334455' },
    { id: 104, fullName: 'Pedro Ramos', phone: '50588445566' },
  ]

  const [credSearch, setCredSearch] = useState('')
  const [devSearch, setDevSearch] = useState('')
  const [sysSearch, setSysSearch] = useState('')
  const [ctcSearch, setCtcSearch] = useState('')

  const filteredHosting = useMemo(() => {
    const n = credSearch.trim().toLowerCase()
    if (!n) return hostingCreds
    return hostingCreds.filter((c) =>
      [c.catCredencialNames, c.user, c.instance, c.port, c.observation]
        .filter(Boolean)
        .some((v: string) => String(v).toLowerCase().includes(n))
    )
  }, [hostingCreds, credSearch])

  const filteredDevs = useMemo(() => {
    const n = devSearch.trim().toLowerCase()
    if (!n) return devs
    return devs.filter((d) =>
      [d.name, d.ip, d.operatingSystem, d.versionSO, d.description]
        .filter(Boolean)
        .some((v: string) => String(v).toLowerCase().includes(n))
    )
  }, [devs, devSearch])

  const filteredSystems = useMemo(() => {
    const n = sysSearch.trim().toLowerCase()
    if (!n) return systems
    return systems.filter(
      (s) =>
        String(s.name).toLowerCase().includes(n) ||
        String(s.version ?? '').toLowerCase().includes(n)
    )
  }, [systems, sysSearch])

  const filteredContacts = useMemo(() => {
    const n = ctcSearch.trim().toLowerCase()
    if (!n) return contacts
    return contacts.filter(
      (c) =>
        String(c.fullName ?? c.name).toLowerCase().includes(n) ||
        String(c.phone ?? '').toLowerCase().includes(n)
    )
  }, [contacts, ctcSearch])

  const [expandedDev, setExpandedDev] = useState<number | null>(null)
  const [expandedSys] = useState<number | null>(null)

  const [addHostingOpen, setAddHostingOpen] = useState(false)
  const [newHosting, setNewHosting] = useState<any>({
    catCredencialNames: 'HOSTING',
    user: '',
    password: '',
    instance: '',
    port: '',
    observation: '',
    isActive: true,
  })

  const [addDevOpenId, setAddDevOpenId] = useState<number | null>(null)
  const [newDevCred, setNewDevCred] = useState<any>({
    type: CATS_CRED_DEVICE[0],
    user: '',
    password: '',
    instance: '',
    port: '',
    observation: '',
  })

  const [addSysOpenId, setAddSysOpenId] = useState<number | null>(null)
  const [newSysCred, setNewSysCred] = useState<any>({
    type: CATS_CRED_SYSTEM[0],
    user: '',
    password: '',
    instance: '',
    port: '',
    observation: '',
  })

  const [addDeviceOpen, setAddDeviceOpen] = useState(false)
  const [newDevice, setNewDevice] = useState<any>({
    name: '',
    ip: '',
    operatingSystem: '',
    versionSO: '',
    description: '',
    isActive: true,
  })

  const [pickSysOpen, setPickSysOpen] = useState(false)
  const [pickSysSearch, setPickSysSearch] = useState('')
  const [pickSysSelected, setPickSysSelected] = useState<any[]>([])
  const pickSysFiltered = useMemo(() => {
    const n = pickSysSearch.trim().toLowerCase()
    if (!n) return catalogSystems
    return catalogSystems.filter(s => s.name.toLowerCase().includes(n) || String(s.version).toLowerCase().includes(n))
  }, [pickSysSearch])

  const [pickCtcOpen, setPickCtcOpen] = useState(false)
  const [pickCtcSearch, setPickCtcSearch] = useState('')
  const [pickCtcSelected, setPickCtcSelected] = useState<any[]>([])
  const pickCtcFiltered = useMemo(() => {
    const n = pickCtcSearch.trim().toLowerCase()
    if (!n) return catalogContacts
    return catalogContacts.filter(c => (c.fullName ?? c.fullName).toLowerCase().includes(n) || String(c.phone).includes(n))
  }, [pickCtcSearch])

  const togglePick = (list: any[], setList: (v: any[]) => void, item: any, key = 'id') => {
    const exists = list.some((x) => x[key] === item[key])
    if (exists) setList(list.filter((x) => x[key] !== item[key]))
    else setList([...list, item])
  }

  const CredCard = ({ it, idx }: { it: any; idx: number }) => (
    <div
      className="dp-card"
      key={`cred-${idx}`}
      style={{
        border: '1px solid #E5E7EB',
        borderRadius: 10,
        padding: 10,
        display: 'grid',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong><Trunc>{it?.catCredencialNames ?? it?.type ?? '---'}</Trunc></strong>
        <span className={`badge ${it?.isActive !== false ? 'badge--ok' : 'badge--off'}`}>{it?.isActive !== false ? 'Activo' : 'Inactivo'}</span>
      </div>
      <div style={{ display: 'grid', gap: 8, flexDirection:"row" }}>
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
  )

  const DevCard = ({ it }: { it: any }) => {
    const open = expandedDev === it.id
    return (
      <div
        className="dp-card"
        style={{ border: '1px solid #E5E7EB', borderRadius: 10, padding: 10, display: 'grid', gap: 8 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong><Trunc>{it?.name}</Trunc></strong>
          <button className="btn btn--ghost" onClick={() => setExpandedDev(open ? null : it.id)}>
            {open ? (<><span>Credenciales</span><ChevronUp size={16} /></>) : (<><span>Credenciales</span><ChevronDown size={16} /></>)}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
          <Row label="IP" value={it?.ip} />
          <Row label="SO" value={it?.operatingSystem} />
          <Row label="Versión SO" value={it?.versionSO} />
          <Row label="Estado" value={it?.isActive ? 'Activo' : 'Inactivo'} />
        </div>
        <div>
          <p className="detailPanel-clientGroup__title">Descripción</p>
          <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: 8, minHeight: 40, background: '#FAFAFA' }}>
            <Trunc>{it?.description}</Trunc>
          </div>
        </div>

        {open && (
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h6 style={{ margin: 0 }}>Credenciales de equipo</h6>
              <button className="btn" onClick={() => { setAddDevOpenId(it.id); setNewDevCred({ type: CATS_CRED_DEVICE[0], user: '', password: '', instance: '', port: '', observation: '' }) }}>
                <Plus size={14} /> Nueva
              </button>
            </div>
            {addDevOpenId === it.id && (
              <div style={{ display: 'grid', gap: 8, border: '1px dashed #e5e7eb', borderRadius: 12, padding: 10 }}>
                <div style={{ display: 'flex', flexDirection:"row", gap: 8 }}>
                  <select className="input" value={newDevCred.type} onChange={(e) => setNewDevCred((p: any) => ({ ...p, type: e.target.value }))}>
                    {CATS_CRED_DEVICE.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input className="input" placeholder="Usuario" value={newDevCred.user} onChange={(e) => setNewDevCred((p: any) => ({ ...p, user: e.target.value }))} />
                  <input className="input" placeholder="Contraseña" value={newDevCred.password} onChange={(e) => setNewDevCred((p: any) => ({ ...p, password: e.target.value }))} />
                  <input className="input" placeholder="Puerto" value={newDevCred.port} onChange={(e) => setNewDevCred((p: any) => ({ ...p, port: e.target.value }))} />
                  <input className="input" placeholder="Instancia/Host" value={newDevCred.instance} onChange={(e) => setNewDevCred((p: any) => ({ ...p, instance: e.target.value }))} />
                </div>
                <textarea className="input" placeholder="Observación" value={newDevCred.observation} onChange={(e) => setNewDevCred((p: any) => ({ ...p, observation: e.target.value }))} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button className="btn btn--ghost" onClick={() => setAddDevOpenId(null)}>Cancelar</button>
                  <button
                    className="btn btn--primary"
                    onClick={() => {
                      setDevs(prev => prev.map(d => d.id === it.id ? { ...d, credentials: [{ id: Date.now(), ...newDevCred }, ...d.credentials] } : d))
                      setAddDevOpenId(null)
                    }}
                  >
                    Agregar
                  </button>
                </div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
              {(it.credentials ?? []).map((c: any) => (
                <div key={c.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 10, display: 'grid', gap: 6 }}>
                  <strong><Trunc>{c.type}</Trunc></strong>
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
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn--ghost" onClick={() => { setEditBuffer({ ...it, _t: 'dev' }); setShowMore(true); setMoreTab('dev') }}>Editar</button>
        </div>
      </div>
    )
  }

  const SysCard = ({ it }: { it: any }) => {
    const open = expandedSys === it.id
    return (
      <div
        className="dp-card"
        style={{ border: '1px solid #E5E7EB', borderRadius: 10, padding: 10, display: 'grid', gap: 8 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
            <strong><Trunc>{it?.name}</Trunc></strong>
            <span style={{ opacity: .7 }}>{it?.version}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h6 style={{ margin: 0 }}>Credenciales de sistema</h6>
            <button className="btn" onClick={() => { setAddSysOpenId(it.id); setNewSysCred({ type: CATS_CRED_SYSTEM[0], user: '', password: '', instance: '', port: '', observation: '' }) }}>
              <Plus size={14} /> Nueva
            </button>
          </div>
          {addSysOpenId === it.id && (
            <div style={{ display: 'grid', gap: 8, border: '1px dashed #e5e7eb', borderRadius: 12, padding: 10 }}>
              <div style={{ display: 'grid', flexDirection: "row", gap: 8 }}>
                <select className="input" value={newSysCred.type} onChange={(e) => setNewSysCred((p: any) => ({ ...p, type: e.target.value }))}>
                  {CATS_CRED_SYSTEM.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input className="input" placeholder="Usuario" value={newSysCred.user} onChange={(e) => setNewSysCred((p: any) => ({ ...p, user: e.target.value }))} />
                <input className="input" placeholder="Contraseña" value={newSysCred.password} onChange={(e) => setNewSysCred((p: any) => ({ ...p, password: e.target.value }))} />
                <input className="input" placeholder="Puerto" value={newSysCred.port} onChange={(e) => setNewSysCred((p: any) => ({ ...p, port: e.target.value }))} />
                <input className="input" placeholder="Instancia/Host" value={newSysCred.instance} onChange={(e) => setNewSysCred((p: any) => ({ ...p, instance: e.target.value }))} />
              </div>
              <textarea className="input" placeholder="Observación" value={newSysCred.observation} onChange={(e) => setNewSysCred((p: any) => ({ ...p, observation: e.target.value }))} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn btn--ghost" onClick={() => setAddSysOpenId(null)}>Cancelar</button>
                <button
                  className="btn btn--primary"
                  onClick={() => {
                    setSystems(prev => prev.map(s => s.id === it.id ? { ...s, credentials: [{ id: Date.now(), ...newSysCred }, ...s.credentials] } : s))
                    setAddSysOpenId(null)
                  }}
                >
                  Agregar
                </button>
              </div>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
            {(it.credentials ?? []).map((c: any) => (
              <div key={c.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 10, display: 'grid', gap: 6 }}>
                <strong><Trunc>{c.type}</Trunc></strong>
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
      </div>
    )
  }

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
          <button type="button" className="detailPanel-optionBtn" onClick={() => setOptionMenu(1)}>
            <LuContact size={20} className="detailPanel-optionBtn__icon" />
          </button>
        </li>
        <li className={`detailPanel-option ${optionMenu === 2 ? 'is-active' : ''}`}>
          <button type="button" className="detailPanel-optionBtn" onClick={() => setOptionMenu(2)}>
            <FaRegBuilding size={18} className="detailPanel-optionBtn__icon" />
          </button>
        </li>
        <li className={`detailPanel-option ${optionMenu === 3 ? 'is-active' : ''}`}>
          <button type="button" className="detailPanel-optionBtn" onClick={() => setOptionMenu(3)}>
            <IoChatboxEllipsesOutline size={18} className="detailPanel-optionBtn__icon" />
          </button>
        </li>
        <li className={`detailPanel-option ${optionMenu === 4 ? 'is-active' : ''}`}>
          <button type="button" className="detailPanel-optionBtn" onClick={() => setOptionMenu(4)}>
            <Book size={18} className="detailPanel-optionBtn__icon" />
          </button>
        </li>
      </ul>

      <section className="detailPanel-content">
        {optionMenu === 1 && (
          <>
            <header><h5>Detalles del contacto</h5></header>
            <div className="detailPanel-contactGroup-__container">
              <div className="detailPanel-contactGroup"><p className="detailPanel-contactGroup__title">Nombre</p><span className="detailsPanel-contactGroup__value">{displayOrDash(selectedData?.fullName)}</span></div>
              <div className="detailPanel-contactGroup"><p className="detailPanel-contactGroup__title">Teléfono</p><span className="detailsPanel-contactGroup__value">{formatNiPhone(selectedData?.phone)}</span></div>
              <div className="detailPanel-contactGroup"><p className="detailPanel-contactGroup__title">WhatsApp</p><span className="detailsPanel-contactGroup__value">{displayOrDash(selectedData?.waName)}</span></div>
              <div className="detailPanel-contactGroup"><p className="detailPanel-contactGroup__title">Verificado</p><span className="detailsPanel-contactGroup__value">{selectedData?.isVerified ? 'Verificado' : 'No Verificado'}</span></div>
              <div className="detailPanel-contactGroup"><p className="detailPanel-contactGroup__title">Activo</p><span className="detailsPanel-contactGroup__value">{selectedData?.isActive ? 'Activo' : 'No Activo'}</span></div>
              <div className="detailPanel-contactGroup"><p className="detailPanel-contactGroup__title">Verificado por</p><span className="detailsPanel-contactGroup__value">{displayOrDash(selectedData?.verifiedBy?.fullName)}</span></div>
              <div className="detailPanel-contactGroup"><p className="detailPanel-contactGroup__title">Creado</p><span className="detailsPanel-contactGroup__value">{formatDate(selectedData?.createdAt)}</span></div>
              <div className="detailPanel-contactGroup"><p className="detailPanel-contactGroup__title">Actualizado</p><span className="detailsPanel-contactGroup__value">{formatDate(selectedData?.updatedAt)}</span></div>
              <div className="detailPanel-contactGroup"><p className="detailPanel-contactGroup__title">verifiedAt</p><span className="detailsPanel-contactGroup__value">{formatDate(selectedData?.verifiedAt)}</span></div>
            </div>
          </>
        )}

        {optionMenu === 2 && (
          <>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h5>Detalles del cliente</h5>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn--secondary" onClick={() => { setEditBuffer({ ...(client as any), _t: 'cli' }); setShowMore(true) }}>Editar</button>
                <button className="btn btn--primary" onClick={() => setShowMore(true)}>Ver más</button>
              </div>
            </header>

            <div className="detailPanel-card" style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 12, marginTop: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                {/* <Row label="Código cliente" value={(client as any)?.codCliente ?? (client as any)?.codClient} /> */}
                <Row label="Nombre" value={(client as any)?.nombre ?? (client as any)?.name} />
                <Row label="Teléfono" value={clientPhoneFmt} />
                <Row label="Dirección" value={(client as any)?.direccion ?? (client as any)?.address} />
                <Row label="Modelo Trabajo" value={(client as any)?.workModel ?? (client as any)?.modeloTrabajo} />
                <Row label="Prioridad" value={(client as any)?.priority} />
                <Row label="Tipo soporte" value={(client as any)?.supportType} />
                <Row label="Entorno" value={(client as any)?.enviromentType} />
                <Row label="Soporte activo" value={(client as any)?.isSupportActive ? 'Sí' : 'No'} />
                <Row label="Franquicia" value={(client as any)?.isFranchise ? 'Sí' : 'No'} />
                <Row label="Límite soporte (h)" value={(client as any)?.supportLimitTime} />
                <Row label="Recurrencia" value={(client as any)?.recurrency} />
                <Row label="Último contacto" value={formatDate((client as any)?.lastContactDate)} />
                <Row label="Último caso cerrado" value={formatDate((client as any)?.lastClosedCase)} />
              </div>
              <div style={{ marginTop: 10 }}>
                <p className="detailPanel-clientGroup__title">Observación</p>
                <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: 8, minHeight: 40, background: '#FAFAFA' }}>
                  <Trunc>{(client as any)?.observation}</Trunc>
                </div>
              </div>
            </div>
          </>
        )}

        {optionMenu === 3 && (
          <div className="detailPanel-quick">
            <header className="detailPanel-quick__header">
              <h5>Mensajes rápidos</h5>
              <input className="detailPanel-quick__search" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
            </header>
            <ul className="detailPanel-quick__list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 10 }}>
              {filteredQuick.map((opt, i) => (
                <li key={`${opt}-${i}`} className="detailPanel-quick__item">
                  <div className="detailPanel-quick__text" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{opt}</div>
                  <div className="detailPanel-quick__actions">
                    <button type="button" className="btn btn--primary" onClick={() => handleSendQuick(opt)} title="Enviar ahora">Enviar</button>
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
                <div className="detailPanel-contactGroup"><p className="detailPanel-contactGroup__title">{label}</p><span className="detailsPanel-contactGroup__value">{value ?? '---'}</span></div>
              )
              return (
                <>
                  <div className="detailPanel-contactGroup-__container">
                    <R label="Empresa" value={conv?.systemDefinedCompanyName ?? '---'} />
                    <R label="Contacto" value={conv?.clientContactName ?? '---'} />
                    <R label="Número" value={conv?.contactNumber ?? '---'} />
                    <R label="Canal" value="WhatsApp" />
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
                      <R label="Tono de conversación" value={<strong className={`conversation-toneText__${conversationTone.trim()}`}>{conversationTone}</strong>} />
                    </div>
                  )}
                  <div className="detailPanel-tags" style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Tag size={16} />
                      <h6 style={{ margin: 0 }}>Etiquetas</h6>
                      {!isAddingTag && (<button className="section-action" onClick={() => setIsAddingTag(true)}><Edit size={14} /> <span>Editar</span></button>)}
                    </div>
                    {tags.length === 0 ? null : (
                      <div className="tag-list" style={{ marginTop: 6 }}>
                        {tags.map((t) => (
                          <div key={t} className="tag">
                            <span className="tag-text">{t}</span>
                            {isAddingTag && (<button className="tag-remove" onClick={() => handleRemoveTag(t)}><X size={12} /></button>)}
                          </div>
                        ))}
                      </div>
                    )}
                    {isAddingTag && (
                      <div className="tag-editor">
                        <div className="tag-input-container">
                          <input className="tag-input" value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Nueva etiqueta…" onKeyDown={handleKeyDown} maxLength={60} autoFocus />
                          <div className="tag-input-actions">
                            <button className="tag-action-btn tag-add-btn" onClick={handleAddTag} disabled={!newTag.trim()}><Check size={16} /></button>
                            <button className="tag-action-btn tag-cancel-btn" onClick={() => { setNewTag(''); setIsAddingTag(false) }}><X size={16} /></button>
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
        <div className="dp-modal">
          <div className="dp-modal__backdrop" onClick={() => { setShowMore(false); setEditBuffer(null) }} />
          <div className="dp-modal__content" style={{ width: 500, maxWidth: '94vw', background: '#fff', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,.15)', position: 'fixed', right: 0, top: 0, bottom: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 12, borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className={`btn-tab ${moreTab === 'cred' ? 'is-active' : ''}`} onClick={() => setMoreTab('cred')}>Credenciales</button>
                <button className={`btn-tab ${moreTab === 'dev' ? 'is-active' : ''}`} onClick={() => setMoreTab('dev')}>Equipos</button>
                <button className={`btn-tab ${moreTab === 'sys' ? 'is-active' : ''}`} onClick={() => setMoreTab('sys')}>Sistemas</button>
                <button className={`btn-tab ${moreTab === 'ctc' ? 'is-active' : ''}`} onClick={() => setMoreTab('ctc')}>Contactos</button>
              </div>
              <button className="btn btn--ghost" onClick={() => { setShowMore(false); setEditBuffer(null) }}><X size={16} /></button>
            </div>

            <div style={{ padding: 12, overflow: 'auto', display: 'grid', gap: 12 }}>
              {moreTab === 'cred' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                      <input className="input" placeholder="Buscar credenciales de hosting…" value={credSearch} onChange={(e) => setCredSearch(e.target.value)} style={{ paddingLeft: 34 }} />
                      <Search size={16} style={{ position: 'absolute', left: 10, top: 10, opacity: .6 }} />
                    </div>
                    <button className="btn" onClick={() => setAddHostingOpen((s) => !s)}><Plus size={14} /> Nueva credencial</button>
                  </div>
                  {addHostingOpen && (
                    <div style={{ display: 'grid', gap: 8, border: '1px dashed #e5e7eb', borderRadius: 12, padding: 10 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 120px 1fr', gap: 8 }}>
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
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <button className="btn btn--ghost" onClick={() => setAddHostingOpen(false)}>Cancelar</button>
                        <button className="btn btn--primary" onClick={() => { setHostingCreds(prev => [{ id: Date.now(), ...newHosting, catCredencialNames: 'HOSTING' }, ...prev]); setAddHostingOpen(false); setNewHosting({ catCredencialNames: 'HOSTING', user: '', password: '', instance: '', port: '', observation: '', isActive: true }) }}>Agregar</button>
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                    {filteredHosting.map((it, idx) => <CredCard it={it} idx={idx} key={`host-${it.id ?? idx}`} />)}
                  </div>
                </>
              )}

              {moreTab === 'dev' && (
                <>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input className="input" placeholder="Buscar por nombre, IP, SO…" value={devSearch} onChange={(e) => setDevSearch(e.target.value)} style={{ paddingLeft: 34 }} />
                      <Search size={16} style={{ position: 'absolute', left: 10, top: 10, opacity: .6 }} />
                    </div>
                    <button className="btn" onClick={() => setAddDeviceOpen(true)}><Plus size={14} /> Nuevo equipo</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 12 }}>
                    {filteredDevs.map((it) => <DevCard key={it.id} it={it} />)}
                  </div>
                </>
              )}

              {moreTab === 'sys' && (
                <>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input className="input" placeholder="Buscar sistemas…" value={sysSearch} onChange={(e) => setSysSearch(e.target.value)} style={{ paddingLeft: 34 }} />
                      <Search size={16} style={{ position: 'absolute', left: 10, top: 10, opacity: .6 }} />
                    </div>
                    <button className="btn" onClick={() => { setPickSysOpen(true); setPickSysSelected([]) }}><Plus size={14} /> Agregar sistemas</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 12 }}>
                    {filteredSystems.map((it) => <SysCard key={it.id} it={it} />)}
                  </div>
                </>
              )}

              {moreTab === 'ctc' && (
                <>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input className="input" placeholder="Buscar contactos…" value={ctcSearch} onChange={(e) => setCtcSearch(e.target.value)} style={{ paddingLeft: 34 }} />
                      <Search size={16} style={{ position: 'absolute', left: 10, top: 10, opacity: .6 }} />
                    </div>
                    <button className="btn" onClick={() => { setPickCtcOpen(true); setPickCtcSelected([]) }}><Plus size={14} /> Agregar contactos</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
                    {filteredContacts.map((it) => (
                      <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '8px 0', borderBottom: '1px dashed #eee' }}>
                        <Trunc>{it.fullName ?? it.name}</Trunc>
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
                    <input className="input" placeholder="Categoría" value={editBuffer?.catCredencialNames ?? editBuffer?.type ?? ''} onChange={(e) => setEditBuffer((p: any) => ({ ...p, catCredencialNames: e.target.value, type: e.target.value }))} />
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

      {addDeviceOpen && (
        <div className="dp-modal">
          <div className="dp-modal__backdrop" onClick={() => setAddDeviceOpen(false)} />
          <div className="dp-modal__content" style={{ width: 500, background: '#fff', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,.15)', 
            position: 'fixed', right: 0, top: 0, bottom: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 12, borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h6 style={{ margin: 0 }}>Nuevo equipo</h6>
              <button className="btn btn--ghost" onClick={() => setAddDeviceOpen(false)}><X size={16} /></button>
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
                <button className="btn btn--primary" onClick={() => { setDevs(prev => [{ id: Date.now(), ...newDevice, credentials: [] }, ...prev]); setNewDevice({ name: '', ip: '', operatingSystem: '', versionSO: '', description: '', isActive: true }); setAddDeviceOpen(false) }}>Crear</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {pickSysOpen && (
        <div className="dp-modal">
          <div className="dp-modal__backdrop" onClick={() => setPickSysOpen(false)} />
          <div className="dp-modal__content" style={{ width: 500, maxWidth: '94vw', background: '#fff', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,.15)', position: 'fixed', right: 0, top: 0, bottom: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 12, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h6 style={{ margin: 0 }}>Seleccionar sistemas</h6>
              <button className="btn btn--ghost" onClick={() => setPickSysOpen(false)}><X size={16} /></button>
            </div>
            <div style={{ padding: 12, display: 'grid', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <input className="input" placeholder="Buscar sistemas..." value={pickSysSearch} onChange={(e) => setPickSysSearch(e.target.value)} style={{ paddingLeft: 34 }} />
                <Search size={16} style={{ position: 'absolute', left: 10, top: 10, opacity: 0.6 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, overflow: 'auto' }}>
                {pickSysFiltered.map((sys) => {
                  const active = pickSysSelected.some((x) => x.id === sys.id) || systems.some(s => s.id === sys.id)
                  return (
                    <button
                      key={sys.id}
                      onClick={() => !systems.some(s => s.id === sys.id) && togglePick(pickSysSelected, setPickSysSelected, sys)}
                      className={`pick-card ${active ? 'pick-card--active' : ''}`}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        border: `1px solid ${active ? '#0070B4' : '#E5E7EB'}`,
                        borderRadius: 10,
                        padding: 10,
                        textAlign: 'left',
                        background: active ? '#F0F9FF' : '#fff',
                        cursor: systems.some(s => s.id === sys.id) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <strong>{sys.name}</strong>
                      <span style={{ opacity: 0.7 }}>{sys.version}</span>
                      {systems.some(s => s.id === sys.id) ? <span style={{ fontSize: 12, opacity: .7 }}>Ya agregado</span> : null}
                    </button>
                  )
                })}
              </div>
              <div style={{ borderTop: '1px solid #eee', paddingTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {pickSysSelected.map((it, i) => (
                  <div key={`sys-pill-${i}`} className="chip" style={{ border: '1px solid #0070B4', background: '#F0F9FF' }}>
                    <span className="chip-text">{it.name}</span>
                    <button className="tag-remove" onClick={() => togglePick(pickSysSelected, setPickSysSelected, it)}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn btn--ghost" onClick={() => setPickSysOpen(false)}>Cancelar</button>
                <button className="btn btn--primary" onClick={() => { setSystems(prev => [...pickSysSelected.map(s => ({ ...s, credentials: [] })), ...prev]); setPickSysOpen(false) }}>Agregar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {pickCtcOpen && (
        <div className="dp-modal">
          <div className="dp-modal__backdrop" onClick={() => setPickCtcOpen(false)} />
          <div className="dp-modal__content" style={{ width: 500, maxWidth: '94vw', background: '#fff', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,.15)', position: 'fixed', right: 16, top: 16, bottom: 16, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 12, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h6 style={{ margin: 0 }}>Seleccionar contactos</h6>
              <button className="btn btn--ghost" onClick={() => setPickCtcOpen(false)}><X size={16} /></button>
            </div>
            <div style={{ padding: 12, display: 'grid', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <input className="input" placeholder="Buscar contactos..." value={pickCtcSearch} onChange={(e) => setPickCtcSearch(e.target.value)} style={{ paddingLeft: 34 }} />
                <Search size={16} style={{ position: 'absolute', left: 10, top: 10, opacity: 0.6 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, overflow: 'auto' }}>
                {pickCtcFiltered.map((ctc) => {
                  const active = pickCtcSelected.some((x) => x.id === ctc.id) || contacts.some(c => c.id === ctc.id)
                  return (
                    <button
                      key={ctc.id}
                      onClick={() => !contacts.some(c => c.id === ctc.id) && togglePick(pickCtcSelected, setPickCtcSelected, ctc)}
                      className={`pick-card ${active ? 'pick-card--active' : ''}`}
                      style={{
                        display: 'grid',
                        gap: 6,
                        border: `1px solid ${active ? '#0070B4' : '#E5E7EB'}`,
                        borderRadius: 10,
                        padding: 10,
                        textAlign: 'left',
                        background: active ? '#F0F9FF' : '#fff',
                        cursor: contacts.some(c => c.id === ctc.id) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <strong>{ctc.fullName ?? ctc.fullName}</strong>
                      <span style={{ opacity: 0.7 }}>{formatNiPhone(ctc.phone)}</span>
                      {contacts.some(c => c.id === ctc.id) ? <span style={{ fontSize: 12, opacity: .7 }}>Ya agregado</span> : null}
                    </button>
                  )
                })}
              </div>
              <div style={{ borderTop: '1px solid #eee', paddingTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {pickCtcSelected.map((it, i) => (
                  <div key={`ctc-pill-${i}`} className="chip" style={{ border: '1px solid #0070B4', background: '#F0F9FF' }}>
                    <span className="chip-text">{it.fullName ?? it.name}</span>
                    <button className="tag-remove" onClick={() => togglePick(pickCtcSelected, setPickCtcSelected, it)}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn btn--ghost" onClick={() => setPickCtcOpen(false)}>Cancelar</button>
                <button className="btn btn--primary" onClick={() => { setContacts(prev => [...pickCtcSelected, ...prev]); setPickCtcOpen(false) }}>Agregar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DetailPanel