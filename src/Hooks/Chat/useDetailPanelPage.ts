/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState, useCallback } from 'react'
import { useDetailPanel as useBaseDetailPanel } from '@/Hooks/Chat/useDetailPanel'
import { useContactDetail } from '@/Hooks/Chat/useContactDetail'
export type UseDetailPanelPageProps = {
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

export function useDetailPanelPage({
  contactId,
  conversationId,
  selectedParam,
  onSendNow,
}: UseDetailPanelPageProps) {
  const {
    selectedData,
    client,
    optionMenu,
    setOptionMenu,
    quickOptions,
    loading,
    error,
  } = useBaseDetailPanel(contactId, selectedParam)

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

  const clientPhone = (client as any)?.telefono || (client as any)?.celular || ''
  const clientPhoneFmt = formatNiPhone(clientPhone)

  const handleSendQuick = useCallback(async (text: string) => {
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
    } catch { /* empty */ }
  }, [onSendNow])

  const [hostingCreds, setHostingCreds] = useState<any[]>(
    (client as any)?.credentials?.filter((c: any) => String(c.catCredencialNames || c.category).toUpperCase() === 'HOSTING') ??
      [{ id: 9001, catCredencialNames: 'HOSTING', user: 'cpanel', password: '', instance: 'cpanel.hosting.com', port: '', observation: 'CPanel Producción', isActive: true }]
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

  const togglePick = useCallback((list: any[], setList: (v: any[]) => void, item: any, key = 'id') => {
    const exists = list.some((x) => x[key] === item[key])
    if (exists) setList(list.filter((x) => x[key] !== item[key]))
    else setList([...list, item])
  }, [])

  const [clientEditOpen, setClientEditOpen] = useState(false)
  const [clientLocal, setClientLocal] = useState<any>(client ?? null)
  useEffect(() => {
    setClientLocal(client ?? null)
  }, [client])

  const [workModel, setWorkModel] = useState<string>(clientLocal?.workModel ?? '')
  const [priority, setPriority] = useState<string>(clientLocal?.priority ?? '')
  const [supportType, setSupportType] = useState<string>(clientLocal?.supportType ?? '')
  const [envType, setEnvType] = useState<string>(clientLocal?.enviromentType ?? '')
  const [isSupportActive, setIsSupportActive] = useState<boolean>(!!clientLocal?.isSupportActive)
  const [isFranchise, setIsFranchise] = useState<boolean>(!!clientLocal?.isFranchise)
  const [supportLimitTime, setSupportLimitTime] = useState<string>(clientLocal?.supportLimitTime ?? '')
  const [recurrency, setRecurrency] = useState<string>(clientLocal?.recurrency ?? '')
  const [observation, setObservation] = useState<string>(clientLocal?.observation ?? '')

  useEffect(() => {
    setWorkModel(clientLocal?.workModel ?? '')
    setPriority(clientLocal?.priority ?? '')
    setSupportType(clientLocal?.supportType ?? '')
    setEnvType(clientLocal?.enviromentType ?? '')
    setIsSupportActive(!!clientLocal?.isSupportActive)
    setIsFranchise(!!clientLocal?.isFranchise)
    setSupportLimitTime(clientLocal?.supportLimitTime ?? '')
    setRecurrency(clientLocal?.recurrency ?? '')
    setObservation(clientLocal?.observation ?? '')
  }, [clientEditOpen, clientLocal])

  return {
      optionMenu,
      quickOptionsFiltered: filteredQuick,
      q,
      showMore,
      moreTab,
      editBuffer,
      loading,
      error,
      clientEditOpen,
      clientLocal,
      workModel,
      priority,
      supportType,
      envType,
      isSupportActive,
      isFranchise,
      supportLimitTime,
      recurrency,
      observation,
      hostingCreds,
      devs,
      systems,
      contacts,
      credSearch,
      devSearch,
      sysSearch,
      ctcSearch,
      filteredHosting,
      filteredDevs,
      filteredSystems,
      filteredContacts,
      expandedDev,
      addHostingOpen,
      newHosting,
      addDevOpenId,
      newDevCred,
      addSysOpenId,
      newSysCred,
      addDeviceOpen,
      newDevice,
      pickSysOpen,
      pickSysSearch,
      pickSysSelected,
      pickSysFiltered,
      pickCtcOpen,
      pickCtcSearch,
      pickCtcSelected,
      pickCtcFiltered,
      selectedData,
      client,
      conv,
      conversationTone,
      tags,
      isAddingTag,
      newTag,
      clientPhoneFmt,

      setOptionMenu,
      setQ,
      setShowMore,
      setMoreTab,
      setEditBuffer,
      setClientEditOpen,
      setClientLocal,
      setWorkModel,
      setPriority,
      setSupportType,
      setEnvType,
      setIsSupportActive,
      setIsFranchise,
      setSupportLimitTime,
      setRecurrency,
      setObservation,
      setHostingCreds,
      setDevs,
      setSystems,
      setContacts,
      setCredSearch,
      setDevSearch,
      setSysSearch,
      setCtcSearch,
      setExpandedDev,
      setAddHostingOpen,
      setNewHosting,
      setAddDevOpenId,
      setNewDevCred,
      setAddSysOpenId,
      setNewSysCred,
      setAddDeviceOpen,
      setNewDevice,
      setPickSysOpen,
      setPickSysSearch,
      setPickSysSelected,
      setPickCtcOpen,
      setPickCtcSearch,
      setPickCtcSelected,
      setIsAddingTag,
      setNewTag,
      handleSendQuick,
      handleAddTag,
      handleRemoveTag,
      handleKeyDown,
      togglePick,

      addHosting: () => {
        const item = { id: Date.now(), ...newHosting, catCredencialNames: 'HOSTING' }
        setHostingCreds(prev => [item, ...prev])
        setAddHostingOpen(false)
        setNewHosting({ catCredencialNames: 'HOSTING', user: '', password: '', instance: '', port: '', observation: '', isActive: true })
      },
      addDevCredential: (devId: number) => {
        setDevs(prev => prev.map(d => d.id === devId ? { ...d, credentials: [{ id: Date.now(), ...newDevCred }, ...(d.credentials ?? [])] } : d))
        setAddDevOpenId(null)
      },
      addSysCredential: (sysId: number) => {
        setSystems(prev => prev.map(s => s.id === sysId ? { ...s, credentials: [{ id: Date.now(), ...newSysCred }, ...(s.credentials ?? [])] } : s))
        setAddSysOpenId(null)
      },
      createDevice: () => {
        setDevs(prev => [{ id: Date.now(), ...newDevice, credentials: [] }, ...prev])
        setNewDevice({ name: '', ip: '', operatingSystem: '', versionSO: '', description: '', isActive: true })
        setAddDeviceOpen(false)
      },
      addPickedSystems: () => {
        setSystems(prev => [...pickSysSelected.map(s => ({ ...s, credentials: [] })), ...prev])
        setPickSysOpen(false)
      },
      addPickedContacts: () => {
        setContacts(prev => [...pickCtcSelected, ...prev])
        setPickCtcOpen(false)
      },
      
      saveClientEditsLocal: () => {
        setClientLocal((prev: any) => ({
          ...prev,
          workModel,
          priority,
          supportType,
          enviromentType: envType,
          isSupportActive,
          isFranchise,
          supportLimitTime: supportLimitTime === '' ? null : Number(supportLimitTime),
          recurrency,
          observation,
        }))
        setClientEditOpen(false)
      },
    utils: { formatNiPhone, displayOrDash, formatDate },
    constants: { CATS_CRED_DEVICE, CATS_CRED_SYSTEM },
  }
}

export default useDetailPanelPage