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
  CredentialResponseDTO,
  SystemRequestDTO,
  ContactRequestDTO,
  OutsourcedDeviceResponseDTO,
  OutsourcedSystemsResponseDTO,
} from '@/Interfaces/Crm/ClientInterface'
import type { PagedResponse } from '@/Interfaces/GlobalInterface'
import type { CatCredencialResponseDto } from '@/Interfaces/Crm/CatCredential'

export const useClientTab = (clienteCodigo?: string | number | null) => {
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

  const { getByClient: fetchContactsByClient } = useContact()
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

  const loading = clientLoading
  const error = clientError ?? null

  const lastClientCodeRef = useRef<string | null>(null)
  useEffect(() => {
    if (clienteCodigo == null) return
    const codeStr = String(clienteCodigo)
    if (lastClientCodeRef.current === codeStr) return
    lastClientCodeRef.current = codeStr
    fetchClientByCodeOrId(codeStr)
      .then((c: ClientResponseDTO | null) => {
        if (c?.id) return fetchContactsByClient(c.codClient)
        return undefined
      })
      .catch(() => {})
  }, [clienteCodigo, fetchClientByCodeOrId, fetchContactsByClient])

  useEffect(() => {
    if (!catCredential?.length) refreshCatCreds(1, 50)
  }, [catCredential?.length, refreshCatCreds])

  const getCatIdByName = useCallback(
    (name: string) => {
      const n = name.trim().toUpperCase()
      const found = catCredential.find(
        (c: CatCredencialResponseDto) => (c.name || '').trim().toUpperCase() === n
      )
      return found?.id
    },
    [catCredential]
  )

  const [clientPickerOpen, setClientPickerOpen] = useState(false)
  const [clientPickerFilter, setClientPickerFilter] = useState('')
  const [clientPickerPage, setClientPickerPage] = useState(1)
  const [clientPickerSize, setClientPickerSize] = useState(10)
  const [clientPickerData, setClientPickerData] =
    useState<PagedResponse<ClientResponseDTO> | null>(null)

  const loadClientPicker = useCallback(async () => {
    const res = await getClientsPaged(clientPickerFilter, clientPickerPage, clientPickerSize)
    setClientPickerData(res)
  }, [getClientsPaged, clientPickerFilter, clientPickerPage, clientPickerSize])

  useEffect(() => {
    if (clientPickerOpen) loadClientPicker().catch(() => {})
  }, [clientPickerOpen, loadClientPicker])

  const pickClientAndLoad = useCallback(
    async (idOrCode: number | string) => {
      await fetchClientByCodeOrId(idOrCode)
      setClientPickerOpen(false)
    },
    [fetchClientByCodeOrId]
  )

  const hostingCreds = useMemo<CredentialResponseDTO[]>(() => {
    const creds = client?.hostingCredentials ?? []
    return creds.filter(c => String(c.catCredencialNames || '').toUpperCase() === 'HOSTING')
  }, [client])

  const devs = useMemo<OutsourcedDeviceResponseDTO[]>(() => {
    const list = client?.outsourcedDevices ?? []
    return list.map(d => ({ ...d, credentials: d.credentials ?? [] }))
  }, [client])

  const systems = useMemo<OutsourcedSystemsResponseDTO[]>(() => {
    const list = client?.outsourcedSystems ?? []
    return list.map(s => ({ ...s, credentials: s.credentials ?? [] }))
  }, [client])

  const contacts = useMemo(() => (client as any)?.clientContacts ?? [], [client])

  const [credSearch, setCredSearch] = useState('')
  const [devSearch, setDevSearch] = useState('')
  const [sysSearch, setSysSearch] = useState('')
  const [ctcSearch, setCtcSearch] = useState('')

  const filteredHosting = useMemo(() => {
    const n = credSearch.trim().toLowerCase()
    if (!n) return hostingCreds
    return hostingCreds.filter(c =>
      [c.catCredencialNames, c.user, c.instance, c.port, c.observation]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(n))
    )
  }, [hostingCreds, credSearch])

  const filteredDevs = useMemo(() => {
    const n = devSearch.trim().toLowerCase()
    if (!n) return devs
    return devs.filter(d =>
      [d.name, d.ip, d.operatingSystem, d.versionSO, d.description]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(n))
    )
  }, [devs, devSearch])

  const filteredSystems = useMemo(() => {
    const n = sysSearch.trim().toLowerCase()
    if (!n) return systems
    return systems.filter(
      s =>
        String(s.name).toLowerCase().includes(n) ||
        String(s.version ?? '').toLowerCase().includes(n)
    )
  }, [systems, sysSearch])

  const filteredContacts = useMemo(() => {
    const n = ctcSearch.trim().toLowerCase()
    if (!n) return contacts
    return contacts.filter(
      (c: any) =>
        String(c.fullName ?? c.name).toLowerCase().includes(n) ||
        String(c.phone ?? '').toLowerCase().includes(n)
    )
  }, [contacts, ctcSearch])

  const [expandedDev, setExpandedDev] = useState<number | null>(null)
  const toggleExpandedDev = (id: number) => setExpandedDev(prev => (prev === id ? null : id))

  const [addHostingOpen, setAddHostingOpen] = useState(false)
  const [newHosting, setNewHosting] = useState<Omit<CredentialRequestDTO, 'catCredentialId'>>({
    user: '',
    password: '',
    instance: '',
    port: '',
    observation: '',
    isActive: true,
  })

  const addHosting = useCallback(async () => {
    if (!client?.id) return
    const catId = getCatIdByName('HOSTING')
    if (!catId) return
    const dto: CredentialRequestDTO = {
      catCredentialId: catId,
      clientId: client.id,
      user: newHosting.user,
      password: newHosting.password,
      instance: newHosting.instance,
      port: newHosting.port,
      observation: newHosting.observation,
      isActive: newHosting.isActive,
    }
    const created = await addCredentialHostingAsync(client.id, dto)
    setClient(prev => {
      if (!prev) return prev
      const next = [...(prev.hostingCredentials ?? [])]
      if (created) next.unshift(created)
      return { ...prev, hostingCredentials: next }
    })
    if (clienteCodigo != null) await fetchClientByCodeOrId(String(clienteCodigo))
    setNewHosting({ user: '', password: '', instance: '', port: '', observation: '', isActive: true })
    setAddHostingOpen(false)
  }, [client, newHosting, getCatIdByName, addCredentialHostingAsync, fetchClientByCodeOrId, clienteCodigo, setClient])

  const [addDeviceOpen, setAddDeviceOpen] = useState(false)
  const [newDevice, setNewDevice] = useState<DeviceRequestDTO>({
    name: '',
    ip: '',
    operatingSystem: '',
    versionSO: '',
    description: '',
    isActive: true,
  })

  const createDevice = useCallback(async () => {
    if (!client?.id) return
    const created = await addDeviceAsync(client.id, newDevice)
    setClient(prev => {
      if (!prev) return prev
      const list = [...(prev.outsourcedDevices ?? [])]
      if (created) list.unshift({ ...created, credentials: [] })
      return { ...prev, outsourcedDevices: list }
    })
    if (clienteCodigo != null) await fetchClientByCodeOrId(String(clienteCodigo))
    setNewDevice({ name: '', ip: '', operatingSystem: '', versionSO: '', description: '', isActive: true })
    setAddDeviceOpen(false)
  }, [client, newDevice, addDeviceAsync, fetchClientByCodeOrId, clienteCodigo, setClient])

  const [addDevOpenId, setAddDevOpenId] = useState<number | null>(null)
  const [newDevCred, setNewDevCred] = useState<Omit<CredentialRequestDTO, 'catCredentialId'>>({
    user: '',
    password: '',
    instance: '',
    port: '',
    observation: '',
    isActive: true,
  })

  const addDeviceCredential = useCallback(
    async (deviceId: number) => {
      if (!client?.id) return
      const catId = getCatIdByName('DEVICE')
      if (!catId) return
      const dto: CredentialRequestDTO = {
        catCredentialId: catId,
        clientId: client.id,
        outsourcedDeviceId: deviceId,
        user: newDevCred.user,
        password: newDevCred.password,
        instance: newDevCred.instance,
        port: newDevCred.port,
        observation: newDevCred.observation,
        isActive: true,
      }
      const created = await addCredentialForDeviceAsync(client.id, deviceId, dto)
      setClient(prev => {
        if (!prev) return prev
        const updated = (prev.outsourcedDevices ?? []).map(d =>
          d.id === deviceId
            ? { ...d, credentials: [created as CredentialResponseDTO, ...(d.credentials ?? [])] }
            : d
        )
        return { ...prev, outsourcedDevices: updated }
      })
      if (clienteCodigo != null) await fetchClientByCodeOrId(String(clienteCodigo))
      setAddDevOpenId(null)
      setNewDevCred({ user: '', password: '', instance: '', port: '', observation: '', isActive: true })
    },
    [client, newDevCred, addCredentialForDeviceAsync, fetchClientByCodeOrId, clienteCodigo, getCatIdByName, setClient]
  )

  const [addSysOpenId, setAddSysOpenId] = useState<number | null>(null)
  const [newSysCred, setNewSysCred] = useState<Omit<CredentialRequestDTO, 'catCredentialId'>>({
    user: '',
    password: '',
    instance: '',
    port: '',
    observation: '',
    isActive: true,
  })

  const addSystemCredential = useCallback(
    async (clientOutsourcedSystemId: number) => {
      if (!client?.id) return
      const catId = getCatIdByName('SYSTEM')
      if (!catId) return
      const dto: CredentialRequestDTO = {
        catCredentialId: catId,
        clientId: client.id,
        clientOutsourcedSystemId,
        user: newSysCred.user,
        password: newSysCred.password,
        instance: newSysCred.instance,
        port: newSysCred.port,
        observation: newSysCred.observation,
        isActive: true,
      }
      const created = await addCredentialForSystemAsync(client.id, clientOutsourcedSystemId, dto)
      setClient(prev => {
        if (!prev) return prev
        const updated = (prev.outsourcedSystems ?? []).map(s =>
          s.id === clientOutsourcedSystemId
            ? { ...s, credentials: [created as CredentialResponseDTO, ...(s.credentials ?? [])] }
            : s
        )
        return { ...prev, outsourcedSystems: updated }
      })
      if (clienteCodigo != null) await fetchClientByCodeOrId(String(clienteCodigo))
      setAddSysOpenId(null)
      setNewSysCred({ user: '', password: '', instance: '', port: '', observation: '', isActive: true })
    },
    [client, newSysCred, addCredentialForSystemAsync, fetchClientByCodeOrId, clienteCodigo, getCatIdByName, setClient]
  )

  const [pickSysOpen, setPickSysOpen] = useState(false)
  const [newSystem, setNewSystem] = useState<SystemRequestDTO>({ outsourcedSystemsId: 0, isActive: true })

  const openSystemPicker = useCallback(() => {
    setPickSysOpen(true)
    fetchSysPage(1, sysPageSize)
  }, [fetchSysPage, sysPageSize])

  const addPickedSystem = useCallback(async () => {
    if (!client?.id || !newSystem.outsourcedSystemsId) return
    await addSystemAsync(client.id, newSystem)
    if (clienteCodigo != null) await fetchClientByCodeOrId(String(clienteCodigo))
    setNewSystem({ outsourcedSystemsId: 0, isActive: true })
    setPickSysOpen(false)
  }, [client, newSystem, addSystemAsync, fetchClientByCodeOrId, clienteCodigo])

  const [pickCtcOpen, setPickCtcOpen] = useState(false)
  const [newContact, setNewContact] = useState<ContactRequestDTO>({ contactId: 0, isActive: true })
  const [contactPickerItems, setContactPickerItems] = useState<
    Array<{ id: number; fullName?: string | null; phone?: string | null }>
  >([])

  const openContactPicker = useCallback(async () => {
    setPickCtcOpen(true)
    if (client?.id) {
      const res = await fetchContactsByClient(client.codClient)
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
    if (clienteCodigo != null) await fetchClientByCodeOrId(String(clienteCodigo))
    setNewContact({ contactId: 0, isActive: true })
    setPickCtcOpen(false)
  }, [client, newContact, linkExistingContactsAsync, fetchClientByCodeOrId, clienteCodigo])

  const [clientEditOpen, setClientEditOpen] = useState(false)
  const [clientLocal, setClientLocal] = useState<ClientResponseDTO | null>(client ?? null)

  useEffect(() => setClientLocal(client ?? null), [client])

  const [workModel, setWorkModel] = useState(clientLocal?.workModel ?? '')
  const [priority, setPriority] = useState(clientLocal?.priority ?? '')
  const [supportType, setSupportType] = useState(clientLocal?.supportType ?? '')
  const [envType, setEnvType] = useState(clientLocal?.enviromentType ?? '')
  const [isSupportActive, setIsSupportActive] = useState(!!clientLocal?.isSupportActive)
  const [isFranchise, setIsFranchise] = useState(!!clientLocal?.isFranchise)
  const [supportLimitTime, setSupportLimitTime] = useState<string | number | null>(
    clientLocal?.supportLimitTime ?? ''
  )
  const [recurrency, setRecurrency] = useState<string | number | null>(clientLocal?.recurrency ?? '')
  const [observation, setObservation] = useState(clientLocal?.observation ?? '')

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
      observation,
    }
    setClientLocal(prev => (prev ? ({ ...prev, ...patch } as ClientResponseDTO) : prev))
    await updateClientAsync(client.id, patch)
    if (clienteCodigo != null) await fetchClientByCodeOrId(String(clienteCodigo))
    setClientEditOpen(false)
  }, [
    client,
    workModel,
    priority,
    supportType,
    envType,
    isSupportActive,
    isFranchise,
    supportLimitTime,
    observation,
    updateClientAsync,
    fetchClientByCodeOrId,
    clienteCodigo,
  ])

  const refreshClient = useCallback(() => {
    if (clienteCodigo != null && String(clienteCodigo).length)
      return fetchClientByCodeOrId(String(clienteCodigo))
    return Promise.resolve()
  }, [clienteCodigo, fetchClientByCodeOrId])

  return {
    client,
    loading,
    error,
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
    refreshClient,
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

export default useClientTab