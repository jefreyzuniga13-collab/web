/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useClient from '@/Hooks/Crm/useClient'
import useContact from '@/Hooks/Contact/useContact'

type OptionMenu = 1 | 2 | 3 | 4
type MoreTab = 'cred' | 'dev' | 'sys' | 'ctc'
const CATS_CRED_DEVICE = ['SQL', 'RDP', 'ANYDESK', 'VPN', 'OTRO'] as const
const CATS_CRED_SYSTEM = ['APLICACION'] as const

const parseQuickOptions = (selectedParam: unknown): string[] => {
  const p: any = selectedParam
  const split = (s: string) =>
    String(s)
      .split('|')
      .map(x => x.trim())
      .filter(Boolean)
  if (Array.isArray(p)) return p.filter((v: any) => typeof v === 'string')
  if (typeof p === 'string') {
    try {
      const j = JSON.parse(p)
      if (Array.isArray(j)) return j.filter((v: any) => typeof v === 'string')
    } catch {
      return split(p)
    }
  }
  if (typeof p?.value === 'string') {
    try {
      const j = JSON.parse(p.value)
      if (Array.isArray(j)) return j.filter((v: any) => typeof v === 'string')
    } catch {
      return split(p.value)
    }
  }
  if (Array.isArray(p?.value)) return p.value.filter((v: any) => typeof v === 'string')
  return []
}

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

export const useDetailPanel = (contactId?: number, selectedParam?: unknown) => {
  const [optionMenu, setOptionMenu] = useState<OptionMenu>(1)
  const [showMore, setShowMore] = useState(false)
  const [moreTab, setMoreTab] = useState<MoreTab>('cred')
  const [editBuffer, setEditBuffer] = useState<any>(null)

  const {
    selectedData,
    loading: contactLoading,
    error: contactError,
    fetchById: fetchContactById,
    getByClient: fetchContactsByClient,
  } = useContact(contactId)

  const {
    client,
    loading: clientLoading,
    error: clientError,
    getByIdAsync: fetchClientByCodeOrId,
    updateAsync: updateClientAsync,
    addDeviceAsync,
    addSystemAsync,
    addCredentialAsync,
    addContactAsync,
  } = useClient()

  const loading = contactLoading || clientLoading
  const error = contactError ?? clientError ?? null

  const quickOptions = useMemo(() => {
    const arr = parseQuickOptions(selectedParam)
    const uniq = Array.from(new Set(arr.map(s => s.trim()))).filter(Boolean)
    return uniq
  }, [selectedParam])

  const lastContactIdRef = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (typeof contactId === 'number' && contactId > 0 && lastContactIdRef.current !== contactId) {
      lastContactIdRef.current = contactId
      fetchContactById(contactId).catch(() => {})
    }
  }, [contactId, fetchContactById])

  const clienteCodigo = useMemo(() => {
    const c: any = selectedData
    return c?.clienteCodigo ?? c?.codcli ?? c?.codCliente ?? c?.clientCode ?? null
  }, [selectedData])

  const lastClientCodeRef = useRef<string | null>(null)
  useEffect(() => {
    if (clienteCodigo == null) return
    const codeStr = String(clienteCodigo)
    if (lastClientCodeRef.current !== codeStr) {
      lastClientCodeRef.current = codeStr
      fetchClientByCodeOrId(codeStr)
        .then((c: any) => {
          if (c?.id) return fetchContactsByClient(c.id)
          return undefined
        })
        .catch(() => {})
    }
  }, [clienteCodigo, fetchClientByCodeOrId, fetchContactsByClient])

  const [qQuick, setQQuick] = useState('')
  const filteredQuick = useMemo(() => {
    const base = quickOptions.length
      ? quickOptions
      : ['Claro, con gusto.', 'Enseguida te ayudo.', '¿Podrías compartir más detalles?']
    const n = qQuick.toLowerCase()
    return base.filter(s => s.toLowerCase().includes(n))
  }, [quickOptions, qQuick])

  const clientPhone = (client as any)?.telefono || (client as any)?.celular || ''
  const clientPhoneFmt = formatNiPhone(clientPhone)

  const [hostingCreds, setHostingCreds] = useState<any[]>([])
  const [devs, setDevs] = useState<any[]>([])
  const [systems, setSystems] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  useEffect(() => {
    const creds = (client as any)?.credentials ?? []
    const host = creds.filter((c: any) => String(c.catCredencialNames || c.type).toUpperCase() === 'HOSTING')
    setHostingCreds(
      host.length
        ? host
        : [
            {
              id: 9001,
              catCredencialNames: 'HOSTING',
              user: 'cpanel',
              password: '',
              instance: 'cpanel.hosting.com',
              port: '',
              observation: 'CPanel Producción',
              isActive: true,
            },
          ]
    )
    const d = ((client as any)?.outsourcedDevices ?? (client as any)?.devices ?? []).map((x: any) => ({
      ...x,
      credentials: x.credentials ?? [],
    }))
    setDevs(
      d.length
        ? d
        : [
            {
              id: 5001,
              name: 'Servidor Central',
              ip: '192.168.1.20',
              operatingSystem: 'Windows Server 2022',
              versionSO: 'Build 20348',
              isActive: true,
              description: 'Servidor principal ERP',
              credentials: [
                { id: 1, type: 'RDP', user: 'admin', password: '', instance: 'srv-01', port: '3389', observation: 'Escritorio remoto' },
                { id: 2, type: 'SQL', user: 'dbadmin', password: '', instance: 'sql01', port: '1433', observation: 'SQL Prod' },
                { id: 3, type: 'ANYDESK', user: 'adcode', password: '', instance: '123-456-789', port: '', observation: 'Acceso remoto' },
              ],
            },
          ]
    )
    const s = ((client as any)?.outsourcedSystems ?? (client as any)?.systems ?? []).map((x: any) => ({
      ...x,
      credentials: x.credentials ?? [],
    }))
    setSystems(
      s.length
        ? s
        : [{ id: 2, name: 'CRM', version: 'v1.4', credentials: [{ id: 92, type: 'APLICACION', user: 'crm_user', password: '', instance: 'crm.empresa.com', port: '', observation: '' }] }]
    )
    const ctc = (client as any)?.clientContacts ?? (client as any)?.contacts ?? []
    setContacts(
      ctc.length
        ? ctc
        : [
            { id: 11, fullName: 'María López', phone: '50588887777' },
            { id: 12, fullName: 'Carlos Pérez', phone: '50588556644' },
            { id: 13, fullName: 'Ana Gómez', phone: '50584223311' },
            { id: 14, fullName: 'Jorge Ruiz', phone: '50587112233' },
          ]
    )
  }, [client])

  const catalogSystems = useMemo(
    () => [
      { id: 1, name: 'ERP Cloud', version: 'v3.2' },
      { id: 2, name: 'CRM', version: 'v1.4' },
      { id: 3, name: 'POS Retail', version: 'v2.1' },
      { id: 4, name: 'Billing Core', version: '2025.10' },
      { id: 5, name: 'Inventario', version: '2024.7' },
    ],
    []
  )
  const catalogContacts = useMemo(
    () => [
      { id: 101, fullName: 'Luis Castillo', phone: '50588112233' },
      { id: 102, fullName: 'Paola Rivas', phone: '50588223344' },
      { id: 103, fullName: 'Marta Silva', phone: '50588334455' },
      { id: 104, fullName: 'Pedro Ramos', phone: '50588445566' },
    ],
    []
  )

  const [credSearch, setCredSearch] = useState('')
  const [devSearch, setDevSearch] = useState('')
  const [sysSearch, setSysSearch] = useState('')
  const [ctcSearch, setCtcSearch] = useState('')

  const filteredHosting = useMemo(() => {
    const n = credSearch.trim().toLowerCase()
    if (!n) return hostingCreds
    return hostingCreds.filter((c: any) => [c.catCredencialNames, c.user, c.instance, c.port, c.observation].filter(Boolean).some((v: string) => String(v).toLowerCase().includes(n)))
  }, [hostingCreds, credSearch])

  const filteredDevs = useMemo(() => {
    const n = devSearch.trim().toLowerCase()
    if (!n) return devs
    return devs.filter((d: any) => [d.name, d.ip, d.operatingSystem, d.versionSO, d.description].filter(Boolean).some((v: string) => String(v).toLowerCase().includes(n)))
  }, [devs, devSearch])

  const filteredSystems = useMemo(() => {
    const n = sysSearch.trim().toLowerCase()
    if (!n) return systems
    return systems.filter((s: any) => String(s.name).toLowerCase().includes(n) || String(s.version ?? '').toLowerCase().includes(n))
  }, [systems, sysSearch])

  const filteredContacts = useMemo(() => {
    const n = ctcSearch.trim().toLowerCase()
    if (!n) return contacts
    return contacts.filter((c: any) => String(c.fullName ?? c.name).toLowerCase().includes(n) || String(c.phone ?? '').toLowerCase().includes(n))
  }, [contacts, ctcSearch])

  const [expandedDev, setExpandedDev] = useState<number | null>(null)
  const toggleExpandedDev = (id: number) => setExpandedDev(prev => (prev === id ? null : id))

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
  const addHosting = async () => {
    setHostingCreds(prev => [{ id: Date.now(), ...newHosting }, ...prev])
    if (client?.id) {
      await addCredentialAsync(client.id, { type: 'HOSTING', user: newHosting.user, password: newHosting.password, instance: newHosting.instance, 
        port: newHosting.port, observation: newHosting.observation, isActive: newHosting.isActive })
    }
    setNewHosting({ catCredencialNames: 'HOSTING', user: '', password: '', instance: '', port: '', observation: '', isActive: true })
    setAddHostingOpen(false)
  }

  const [addDevOpenId, setAddDevOpenId] = useState<number | null>(null)
  const [newDevCred, setNewDevCred] = useState<any>({ type: CATS_CRED_DEVICE[0], user: '', password: '', instance: '', port: '', observation: '' })
  const addDeviceCredential = async (deviceId: number) => {
    setDevs(prev => prev.map(d => (d.id === deviceId ? { ...d, credentials: [{ id: Date.now(), ...newDevCred }, ...(d.credentials ?? [])] } : d)))
    if (client?.id) {
      await addCredentialAsync(client.id, { type: String(newDevCred.type), user: newDevCred.user, password: newDevCred.password, instance: newDevCred.instance, 
        port: newDevCred.port, observation: newDevCred.observation, isActive: true })
    }
    setAddDevOpenId(null)
    setNewDevCred({ type: CATS_CRED_DEVICE[0], user: '', password: '', instance: '', port: '', observation: '' })
  }

  const [addSysOpenId, setAddSysOpenId] = useState<number | null>(null)
  const [newSysCred, setNewSysCred] = useState<any>({ type: CATS_CRED_SYSTEM[0], user: '', password: '', instance: '', port: '', observation: '' })
  const addSystemCredential = async (systemId: number) => {
    setSystems(prev => prev.map(s => (s.id === systemId ? { ...s, credentials: [{ id: Date.now(), ...newSysCred }, ...(s.credentials ?? [])] } : s)))
    if (client?.id) {
      await addCredentialAsync(client.id, { type: String(newSysCred.type), user: newSysCred.user, password: newSysCred.password, instance: newSysCred.instance, port: newSysCred.port, observation: newSysCred.observation, isActive: true })
    }
    setAddSysOpenId(null)
    setNewSysCred({ type: CATS_CRED_SYSTEM[0], user: '', password: '', instance: '', port: '', observation: '' })
  }

  const [addDeviceOpen, setAddDeviceOpen] = useState(false)
  const [newDevice, setNewDevice] = useState<any>({ name: '', ip: '', operatingSystem: '', versionSO: '', description: '', isActive: true })
  const createDevice = async () => {
    const payload = { id: Date.now(), ...newDevice, credentials: [] }
    setDevs(prev => [payload, ...prev])
    if (client?.id) {
      await addDeviceAsync(client.id, {
        name: newDevice.name,
        ip: newDevice.ip,
        operatingSystem: newDevice.operatingSystem,
        versionSO: newDevice.versionSO,
        description: newDevice.description,
        isActive: newDevice.isActive,
      })
    }
    setNewDevice({ name: '', ip: '', operatingSystem: '', versionSO: '', description: '', isActive: true })
    setAddDeviceOpen(false)
  }

  const [pickSysOpen, setPickSysOpen] = useState(false)
  const [pickSysSearch, setPickSysSearch] = useState('')
  const [pickSysSelected, setPickSysSelected] = useState<any[]>([])
  const pickSysFiltered = useMemo(() => {
    const n = pickSysSearch.trim().toLowerCase()
    if (!n) return catalogSystems
    return catalogSystems.filter(s => s.name.toLowerCase().includes(n) || String(s.version).toLowerCase().includes(n))
  }, [pickSysSearch, catalogSystems])
  const togglePickSys = (item: any) => {
    const exists = pickSysSelected.some(x => x.id === item.id)
    setPickSysSelected(exists ? pickSysSelected.filter(x => x.id !== item.id) : [...pickSysSelected, item])
  }
  const addPickedSystems = async () => {
    if (pickSysSelected.length) {
      setSystems(prev => [...pickSysSelected.map(s => ({ ...s, credentials: [] })), ...prev])
      if (client?.id) {
        for (const s of pickSysSelected) {
          await addSystemAsync(client.id, { name: s.name, version: s.version })
        }
      }
    }
    setPickSysSelected([])
    setPickSysOpen(false)
  }

  const [pickCtcOpen, setPickCtcOpen] = useState(false)
  const [pickCtcSearch, setPickCtcSearch] = useState('')
  const [pickCtcSelected, setPickCtcSelected] = useState<any[]>([])
  const pickCtcFiltered = useMemo(() => {
    const n = pickCtcSearch.trim().toLowerCase()
    if (!n) return catalogContacts
    return catalogContacts.filter(c => (c.fullName ?? '').toLowerCase().includes(n) || String(c.phone).includes(n))
  }, [pickCtcSearch, catalogContacts])
  const togglePickCtc = (item: any) => {
    const exists = pickCtcSelected.some(x => x.id === item.id)
    setPickCtcSelected(exists ? pickCtcSelected.filter(x => x.id !== item.id) : [...pickCtcSelected, item])
  }
  const addPickedContacts = async () => {
    if (pickCtcSelected.length) {
      setContacts(prev => [...pickCtcSelected, ...prev])
      if (client?.id) {
        for (const c of pickCtcSelected) {
          await addContactAsync(client.id, { fullName: c.fullName ?? c.name, phone: c.phone })
        }
      }
    }
    setPickCtcSelected([])
    setPickCtcOpen(false)
  }

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
  const saveClientEdits = async () => {
    const patch: any = {
      workModel,
      priority: priority || undefined,
      supportType: supportType || undefined,
      enviromentType: envType || undefined,
      isSupportActive,
      isFranchise,
      supportLimitTime: supportLimitTime === '' ? null : Number(supportLimitTime),
      recurrency,
      observation,
    }
    setClientLocal((prev: any) => ({ ...prev, ...patch }))
    if (client?.id) {
      await updateClientAsync(client.id, patch)
    }
    setClientEditOpen(false)
  }

  const handleSendQuick = async (text: string, onSendNow?: (t: string) => void | Promise<void>) => {
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
  }

  const refreshContact = useCallback(() => {
    if (typeof contactId === 'number' && contactId > 0) return fetchContactById(contactId)
    return Promise.resolve()
  }, [contactId, fetchContactById])

  const refreshClient = useCallback(() => {
    if (clienteCodigo != null && String(clienteCodigo).length) return fetchClientByCodeOrId(String(clienteCodigo))
    return Promise.resolve()
  }, [clienteCodigo, fetchClientByCodeOrId])

  const setTabFromParam = useCallback((p: unknown): OptionMenu => {
    if (typeof p === 'number' && p >= 1 && p <= 4) return p as OptionMenu
    if (typeof p === 'string') {
      const s = p.toLowerCase()
      if (s.includes('contact')) return 1
      if (s.includes('client') || s.includes('cliente')) return 2
      if (s.includes('quick') || s.includes('rápido')) return 3
      if (s.includes('conv') || s.includes('convers')) return 4
    }
    return 1
  }, [])
  useEffect(() => {
    if (selectedParam != null) setOptionMenu(setTabFromParam(selectedParam))
  }, [selectedParam, setTabFromParam])

  return {
    optionMenu,
    setOptionMenu,
    selectedData,
    client,
    clienteCodigo,
    loading,
    error,
    qQuick,
    setQQuick,
    quickOptions,
    filteredQuick,
    clientPhoneFmt,
    showMore,
    setShowMore,
    moreTab,
    setMoreTab,
    editBuffer,
    setEditBuffer,
    hostingCreds,
    setHostingCreds,
    devs,
    setDevs,
    systems,
    setSystems,
    contacts,
    setContacts,
    credSearch,
    setCredSearch,
    devSearch,
    setDevSearch,
    setExpandedDev,
    sysSearch,
    setSysSearch,
    ctcSearch,
    setPickSysSelected,
    setCtcSearch,
    filteredHosting,
    filteredDevs,
    filteredSystems,
    filteredContacts,
    expandedDev,
    toggleExpandedDev,
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
    pickSysSearch,
    setPickCtcSelected,
    setPickSysSearch,
    pickSysSelected,
    togglePickSys,
    pickSysFiltered,
    addPickedSystems,
    pickCtcOpen,
    setPickCtcOpen,
    pickCtcSearch,
    setPickCtcSearch,
    pickCtcSelected,
    togglePickCtc,
    pickCtcFiltered,
    addPickedContacts,
    clientEditOpen,
    setClientEditOpen,
    clientLocal,
    setClientLocal,
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
    supportLimitTime,
    setSupportLimitTime,
    recurrency,
    setRecurrency,
    observation,
    setObservation,
    saveClientEdits,
    refreshContact,
    refreshClient,
    handleSendQuick,
    formatNiPhone,
    displayOrDash,
    formatDate,
  }
}

export default useDetailPanel