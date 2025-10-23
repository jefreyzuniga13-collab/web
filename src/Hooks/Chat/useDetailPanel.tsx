/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useClient from '@/Hooks/Crm/useClient'
import useContact from '@/Hooks/Contact/useContact'
import { useCatCredential } from '@/Hooks/Crm/useCatCredential'
import { useOutsourcedSystems } from '@/Hooks/Crm/useOutsourcedSystems'
import type {
  ClientResponseDTO,
  ClientUpdateRequestDTO,
  DeviceRequestDTO,
  CredentialRequestDTO,
  SystemRequestDTO,
  ContactRequestDTO,
  CredentialResponseDTO,
} from '@/Interfaces/Crm/ClientInterface'
import type { PagedResponse } from '@/Interfaces/GlobalInterface'
import type { CatCredencialResponseDto } from '@/Interfaces/Crm/CatCredential'

type OptionMenu = 1 | 2 | 3 | 4
type MoreTab = 'cred' | 'dev' | 'sys' | 'ctc'

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
    setClient,
    getAllAsync: getClientsPaged,
    getByIdAsync: fetchClientByCodeOrId,
    updateAsync: updateClientAsync,
    addDeviceAsync,
    addSystemAsync,
    addCredentialHostingAsync,
    addCredentialForDeviceAsync,
    addCredentialForSystemAsync,
    linkExistingContactsAsync,
  } = useClient()

  const { catCredential, fetchPage: refreshCatCreds } = useCatCredential()

  const {
    items: sysCatalog,
    page: sysPage,
    pageSize: sysPageSize,
    totalCount: sysTotal,
    fetchPage: fetchSysPage,
    setPage: setSysPage,
    setPageSize: setSysPageSize,
    globalFilter: sysGlobalFilter,
    setGlobalFilter: setSysGlobalFilter,
  } = useOutsourcedSystems()

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
      fetchContactById(contactId).catch(() => { })
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
        .catch(() => { })
    }
  }, [clienteCodigo, fetchClientByCodeOrId, fetchContactsByClient])

  useEffect(() => {
    if (!catCredential?.length) {
      refreshCatCreds(1, 50)
    }
  }, [catCredential?.length, refreshCatCreds])

  const getCatIdByName = useCallback(
    (name: string) => {
      const n = name.trim().toUpperCase()
      const found = catCredential.find((c: CatCredencialResponseDto) => (c.name || '').trim().toUpperCase() === n)
      return found?.id
    },
    [catCredential]
  )

  const [clientPickerOpen, setClientPickerOpen] = useState(false)
  const [clientPickerFilter, setClientPickerFilter] = useState('')
  const [clientPickerPage, setClientPickerPage] = useState(1)
  const [clientPickerSize, setClientPickerSize] = useState(10)
  const [clientPickerData, setClientPickerData] = useState<PagedResponse<ClientResponseDTO> | null>(null)

  const loadClientPicker = useCallback(async () => {
    const res = await getClientsPaged(clientPickerFilter, clientPickerPage, clientPickerSize)
    setClientPickerData(res)
  }, [getClientsPaged, clientPickerFilter, clientPickerPage, clientPickerSize])

  useEffect(() => {
    if (clientPickerOpen) {
      loadClientPicker().catch(() => { })
    }
  }, [clientPickerOpen, loadClientPicker])

  const pickClientAndLoad = useCallback(
    async (idOrCode: number | string) => {
      await fetchClientByCodeOrId(idOrCode)
      setClientPickerOpen(false)
    },
    [fetchClientByCodeOrId]
  )

  const [qQuick, setQQuick] = useState('')

  const filteredQuick = useMemo(() => {
    const base = quickOptions
    const n = qQuick.toLowerCase()
    return base.filter(s => s.toLowerCase().includes(n))
  }, [quickOptions, qQuick])

  const clientPhone = (client as any)?.telefono || (client as any)?.celular || ''
  const clientPhoneFmt = formatNiPhone(clientPhone)

  const hostingCreds = useMemo(() => {
    const creds = (client as any)?.hostingCredentials ?? []
    return creds.filter((c: any) => String(c.catCredencialNames || '').toUpperCase() === 'HOSTING')
  }, [client])

  const devs = useMemo(() => {
    const list = ((client as any)?.outsourcedDevices ?? []) as any[]
    return list.map(d => ({ ...d, credentials: d.credentials ?? [] }))
  }, [client])

  const systems = useMemo(() => {
    const list = ((client as any)?.outsourcedSystems ?? []) as any[]
    return list.map(s => ({ ...s, credentials: s.credentials ?? [] }))
  }, [client])

  const contacts = useMemo(() => {
    return ((client as any)?.clientContacts ?? []) as any[]
  }, [client])

  const [credSearch, setCredSearch] = useState('')
  const [devSearch, setDevSearch] = useState('')
  const [sysSearch, setSysSearch] = useState('')
  const [ctcSearch, setCtcSearch] = useState('')

  const filteredHosting = useMemo(() => {
    const n = credSearch.trim().toLowerCase()
    if (!n) return hostingCreds
    return hostingCreds.filter((c: any) =>
      [c.catCredencialNames, c.user, c.instance, c.port, c.observation]
        .filter(Boolean)
        .some((v: string) => String(v).toLowerCase().includes(n))
    )
  }, [hostingCreds, credSearch])

  const filteredDevs = useMemo(() => {
    const n = devSearch.trim().toLowerCase()
    if (!n) return devs
    return devs.filter((d: any) =>
      [d.name, d.ip, d.operatingSystem, d.versionSO, d.description]
        .filter(Boolean)
        .some((v: string) => String(v).toLowerCase().includes(n))
    )
  }, [devs, devSearch])

  const filteredSystems = useMemo(() => {
    const n = sysSearch.trim().toLowerCase()
    if (!n) return systems
    return systems.filter((s: any) => String(s.name).toLowerCase().includes(n) || String(s.version ?? '').toLowerCase().includes(n))
  }, [systems, sysSearch])

  const filteredContacts = useMemo(() => {
    const n = ctcSearch.trim().toLowerCase()
    if (!n) return contacts
    return contacts.filter(
      (c: any) => String(c.fullName ?? c.name).toLowerCase().includes(n) || String(c.phone ?? '').toLowerCase().includes(n)
    )
  }, [contacts, ctcSearch])

  const [expandedDev, setExpandedDev] = useState<number | null>(null)
  const toggleExpandedDev = (id: number) => setExpandedDev(prev => (prev === id ? null : id))

  const [addHostingOpen, setAddHostingOpen] = useState(false)
  const [newHosting, setNewHosting] = useState<any>({
    catalogName: 'HOSTING',
    user: '',
    password: '',
    instance: '',
    port: '',
    observation: '',
    isActive: true,
  })
  
  const addHosting = useCallback(async () => {
    if (!client?.id) return
    const catId = getCatIdByName(newHosting.catalogName || 'HOSTING')
    if (!catId) return
    
    const dto: CredentialRequestDTO = {
      catCredentialId: catId,
      clientId: client.id,
      user: newHosting.user,
      password: newHosting.password,
      instance: newHosting.instance || null,
      port: newHosting.port || null,
      observation: newHosting.observation || null,
      isActive: newHosting.isActive,
    }
    const created = await addCredentialHostingAsync(client.id, dto)
    
    setClient((prev: any) => {
      if (!prev) return prev
      // const nextCreds = Array.isArray(prev.credentials) ? [...prev.credentials] : []
      // if (created) nextCreds.unshift(created as CredentialResponseDTO)
      // return { ...prev, credentials: nextCreds }
      const next = Array.isArray(prev.hostingCredentials) ? [...prev.hostingCredentials] : []
      if (created) next.unshift(created as CredentialResponseDTO)
      return { ...prev, hostingCredentials: next }
    })

    if (clienteCodigo != null) await fetchClientByCodeOrId(String(clienteCodigo))
    
      setNewHosting({
      catalogName: 'HOSTING',
      user: '',
      password: '',
      instance: '',
      port: '',
      observation: '',
      isActive: true,
    })

    setAddHostingOpen(false)
  }, [client?.id, newHosting, addCredentialHostingAsync, fetchClientByCodeOrId, clienteCodigo, getCatIdByName, setClient])

  const [addDeviceOpen, setAddDeviceOpen] = useState(false)
  const [newDevice, setNewDevice] = useState<any>({
    name: '',
    ip: '',
    operatingSystem: '',
    versionSO: '',
    description: '',
    isActive: true,
  })
  const createDevice = useCallback(async () => {
    if (!client?.id) return
    const dto: DeviceRequestDTO = {
      name: newDevice.name,
      ip: newDevice.ip || null,
      operatingSystem: newDevice.operatingSystem || null,
      versionSO: newDevice.versionSO || null,
      description: newDevice.description || null,
      isActive: newDevice.isActive,
    }
    const created = await addDeviceAsync(client.id, dto)
    setClient((prev: any) => {
      if (!prev) return prev
      const list = Array.isArray(prev.outsourcedDevices) ? [...prev.outsourcedDevices] : []
      if (created) list.unshift({ ...(created as any), credentials: [] })
      else list.unshift({ id: Date.now(), ...dto, isActive: !!dto.isActive, credentials: [] })
      return { ...prev, outsourcedDevices: list }
    })
    if (clienteCodigo != null) await fetchClientByCodeOrId(String(clienteCodigo))
    setNewDevice({ name: '', ip: '', operatingSystem: '', versionSO: '', description: '', isActive: true })
    setAddDeviceOpen(false)
  }, [client?.id, newDevice, addDeviceAsync, fetchClientByCodeOrId, clienteCodigo, setClient])

  const [addDevOpenId, setAddDevOpenId] = useState<number | null>(null)
  const [newDevCred, setNewDevCred] = useState<any>({
    catalogName: '',
    user: '',
    password: '',
    instance: '',
    port: '',
    observation: '',
  })
  const addDeviceCredential = useCallback(
    async (deviceId: number) => {
      if (!client?.id) return
      const catId = getCatIdByName(newDevCred.catalogName || '')
      if (!catId) return
      const dto: CredentialRequestDTO = {
        catCredentialId: catId,
        clientId: client.id,
        outsourcedDeviceId: deviceId,
        user: newDevCred.user,
        password: newDevCred.password,
        instance: newDevCred.instance || null,
        port: newDevCred.port || null,
        observation: newDevCred.observation || null,
        isActive: true,
      }
      const created = await addCredentialForDeviceAsync(client.id, deviceId, dto)
      setClient((prev: any) => {
        if (!prev) return prev
        const devices = (prev.outsourcedDevices || []).map((d: any) => {
          if (d.id !== deviceId) return d
          const creds = Array.isArray(d.credentials) ? [...d.credentials] : []
          if (created) creds.unshift(created as CredentialResponseDTO)
          else creds.unshift({ id: Date.now(), catCredencialNames: newDevCred.catalogName, user: dto.user, password: dto.password, instance: dto.instance, port: dto.port, observation: dto.observation, isActive: true })
          return { ...d, credentials: creds }
        })
        return { ...prev, outsourcedDevices: devices }
      })
      if (clienteCodigo != null) await fetchClientByCodeOrId(String(clienteCodigo))
      setAddDevOpenId(null)
      setNewDevCred({ catalogName: '', user: '', password: '', instance: '', port: '', observation: '' })
    },
    [client?.id, newDevCred, addCredentialForDeviceAsync, fetchClientByCodeOrId, clienteCodigo, getCatIdByName, setClient]
  )

  const [addSysOpenId, setAddSysOpenId] = useState<number | null>(null)
  const [newSysCred, setNewSysCred] = useState<any>({
    catalogName: '',
    user: '',
    password: '',
    instance: '',
    port: '',
    observation: '',
  })
  const addSystemCredential = useCallback(
    async (clientOutsourcedSystemId: number) => {
      if (!client?.id) return
      const catId = getCatIdByName(newSysCred.catalogName || '')
      if (!catId) return
      const dto: CredentialRequestDTO = {
        catCredentialId: catId,
        clientId: client.id,
        clientOutsourcedSystemId,
        user: newSysCred.user,
        password: newSysCred.password,
        instance: newSysCred.instance || null,
        port: newSysCred.port || null,
        observation: newSysCred.observation || null,
        isActive: true,
      }

      const created = await addCredentialForSystemAsync(client.id, clientOutsourcedSystemId, dto)

      setClient((prev: any) => {
        if (!prev) return prev
        const systemsNext = (prev.outsourcedSystems || []).map((s: any) => {
          if (s.id !== clientOutsourcedSystemId) return s
          const creds = Array.isArray(s.credentials) ? [...s.credentials] : []
          if (created) creds.unshift(created as CredentialResponseDTO)
          else creds.unshift({ id: Date.now(), catCredencialNames: newSysCred.catalogName, user: dto.user, password: dto.password, instance: dto.instance, port: dto.port, observation: dto.observation, isActive: true })
          return { ...s, credentials: creds }
        })
        return { ...prev, outsourcedSystems: systemsNext }
      })
      if (clienteCodigo != null) await fetchClientByCodeOrId(String(clienteCodigo))
      setAddSysOpenId(null)
      setNewSysCred({ catalogName: '', user: '', password: '', instance: '', port: '', observation: '' })
    },
    [client?.id, newSysCred, addCredentialForSystemAsync, fetchClientByCodeOrId, clienteCodigo, getCatIdByName, setClient]
  )

  const [pickSysOpen, setPickSysOpen] = useState(false)
  const [newSystem, setNewSystem] = useState<SystemRequestDTO>({ outsourcedSystemsId: 0, isActive: true })

  const openSystemPicker = useCallback(() => {
    setPickSysOpen(true)
    fetchSysPage(1, sysPageSize)
  }, [fetchSysPage, sysPageSize])

  const addPickedSystem = useCallback(async () => {
    if (!client?.id || !newSystem.outsourcedSystemsId) return
    const added = await addSystemAsync(client.id, newSystem)
    if (added) {
      setClient((prev: any) => {
        if (!prev) return prev
        const list = Array.isArray(prev.outsourcedSystems) ? [...prev.outsourcedSystems] : []
        const fromCatalog = sysCatalog.find(s => s.id === newSystem.outsourcedSystemsId)
        if (fromCatalog) list.unshift({ id: (added as any).id ?? Date.now(), name: fromCatalog.name, description: fromCatalog.description, version: fromCatalog.version, isActive: !!newSystem.isActive, credentials: [] })
        return { ...prev, outsourcedSystems: list }
      })
    }
    if (clienteCodigo != null) await fetchClientByCodeOrId(String(clienteCodigo))
    setNewSystem({ outsourcedSystemsId: 0, isActive: true })
    setPickSysOpen(false)
  }, [client?.id, newSystem, addSystemAsync, fetchClientByCodeOrId, clienteCodigo, sysCatalog, setClient])

  const [pickCtcOpen, setPickCtcOpen] = useState(false)
  const [newContact, setNewContact] = useState<ContactRequestDTO>({ contactId: 0, isActive: true })
  const [contactPickerItems, setContactPickerItems] = useState<Array<{ id: number; fullName?: string | null; phone?: string | null }>>([])

  const openContactPicker = useCallback(async () => {
    setPickCtcOpen(true)
    if ((client as any)?.id) {
      const res = await fetchContactsByClient((client as any).id)
      if (res?.items) {
        setContactPickerItems(
          res.items.map((r: any) => ({ id: r.id, fullName: r.fullName ?? r.name ?? '', phone: r.phone ?? '' }))
        )
      }
    }
  }, [client, fetchContactsByClient])

  const addPickedContact = useCallback(async () => {
    if (!client?.id || !newContact.contactId) return
    await linkExistingContactsAsync(client.id, [newContact.contactId])
    setClient((prev: any) => {
      if (!prev) return prev
      const list = Array.isArray(prev.clientContacts) ? [...prev.clientContacts] : []
      const found = contactPickerItems.find(c => c.id === newContact.contactId)
      if (found) list.unshift({ id: found.id, fullName: found.fullName, phone: found.phone })
      return { ...prev, clientContacts: list }
    })
    if (clienteCodigo != null) await fetchClientByCodeOrId(String(clienteCodigo))
    setNewContact({ contactId: 0, isActive: true })
    setPickCtcOpen(false)
  }, [client?.id, newContact, linkExistingContactsAsync, fetchClientByCodeOrId, clienteCodigo, setClient, contactPickerItems])

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

  const saveClientEdits = useCallback(async () => {
    if (!client?.id) return
    const patch: Partial<ClientUpdateRequestDTO> = {
      workModel,
      priority: priority || undefined,
      supportType: supportType || undefined,
      enviromentType: envType || undefined,
      isSupportActive,
      isFranchise,
      supportLimitTime: supportLimitTime === '' ? null : Number(supportLimitTime),
      // recurrency: recurrency === '' ? null : Number(recurrency),
      observation,
    }
    setClientLocal((prev: any) => ({ ...prev, ...patch }))
    await updateClientAsync(client.id, patch)
    if (clienteCodigo != null) await fetchClientByCodeOrId(String(clienteCodigo))
    setClientEditOpen(false)
  }, [
    client?.id,
    workModel,
    priority,
    supportType,
    envType,
    isSupportActive,
    isFranchise,
    supportLimitTime,
    recurrency,
    observation,
    updateClientAsync,
    fetchClientByCodeOrId,
    clienteCodigo,
  ])

  const handleSendQuick = async (text: string, onSendNow?: (t: string) => void | Promise<void>) => {
    if (onSendNow) {
      await onSendNow(text)
      return
    }
    const w = (window as unknown) as any
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
    devs,
    systems,
    contacts,
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
    expandedDev,
    toggleExpandedDev,
    addHostingOpen,
    setAddHostingOpen,
    newHosting,
    setNewHosting,
    addHosting,
    addDeviceOpen,
    setAddDeviceOpen,
    newDevice,
    setNewDevice,
    createDevice,
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
    clientPickerOpen,
    setClientPickerOpen,
    clientPickerFilter,
    setClientPickerFilter,
    clientPickerPage,
    setClientPickerPage,
    clientPickerSize,
    setClientPickerSize,
    clientPickerData,
    loadClientPicker,
    pickClientAndLoad,
    refreshContact,
    refreshClient,
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
  }
}

export default useDetailPanel