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
  } from '@/Interfaces/Crm/ClientInterface'
  import type { PagedResponse } from '@/Interfaces/GlobalInterface'
  import { CredentialsService } from '@/Services/Crm/CredentialService'
  import { useOutsourcedDevices } from '../Crm/useOutsourcedDevices'

  type OptionMenu = 1 | 2 | 3 | 4 | 5
  type MoreTab = 'cred' | 'dev' | 'sys' | 'ctc'
  type CredScope = 'client' | 'device' | 'system'
  type CredMode = 'create' | 'view' | 'update'
  type ErrorBag = Record<string, string>

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

    const { update: updateOutsourcedDevices } = useOutsourcedDevices()
    const { catCredential } = useCatCredential()

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
        fetchContactById(contactId).catch(() => {})
      }
    }, [contactId, fetchContactById])

    const clienteCodigo = useMemo(() => {
      const c: any = selectedData
      return c?.clienteCodigo ?? c?.codcli ?? c?.codCliente ?? c?.clientCode ?? null
    }, [selectedData])

    const clientId = useMemo(() => {
      const c: any = selectedData
      return c?.clientId ?? c?.clienteId ?? null
    }, [selectedData])

    const [clientLocal, setClientLocal] = useState<any>(client ?? null)
    useEffect(() => {
      setClientLocal(client ?? null)
    }, [client])

    const lastClientKeyRef = useRef<string | null>(null)
    useEffect(() => {
      const code = clienteCodigo != null ? String(clienteCodigo).trim() : ''
      const key = clientId ? `id:${clientId}` : code ? `code:${code}` : null
      if (!key) {
        lastClientKeyRef.current = null
        setClient(null as any)
        setClientLocal(null)
        return
      }
      if (lastClientKeyRef.current === key) return
      lastClientKeyRef.current = key
      if (clientId) {
        fetchClientByCodeOrId(clientId).catch(() => {})
      } else if (code) {
        fetchClientByCodeOrId(code).catch(() => {})
      }
    }, [clientId, clienteCodigo, fetchClientByCodeOrId, setClient])

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
      if (clientPickerOpen) {
        loadClientPicker().catch(() => {})
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
      return creds.filter((c: any) => c)
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
      return systems.filter((s: any) =>
        String(s.name).toLowerCase().includes(n) ||
        String(s.version ?? '').toLowerCase().includes(n)
      )
    }, [systems, sysSearch])

    const [expandedDev, setExpandedDev] = useState<number | null>(null)
    const toggleExpandedDev = (id: number) =>
      setExpandedDev(prev => (prev === id ? null : id))

    const [addDeviceOpen, setAddDeviceOpen] = useState(false)
    const [newDevice, setNewDevice] = useState<any>({
      name: '',
      ip: '',
      operatingSystem: '',
      versionSO: '',
      description: '',
      isActive: true,
    })
    const [deviceErrors, setDeviceErrors] = useState<ErrorBag>({})

    const validateDevice = useCallback(() => {
      const e: ErrorBag = {}
      const name = String(newDevice.name ?? '').trim()
      const os = String(newDevice.operatingSystem ?? '').trim()
      const version = String(newDevice.versionSO ?? '').trim()
      const desc = String(newDevice.description ?? '').trim()
      const ip = String(newDevice.ip ?? '').trim()

      if (!name) e.name = 'Nombre es obligatorio.'
      else if (name.length > 255) e.name = 'Nombre: máximo 255 caracteres.'

      if (ip && ip.length > 100) e.ip = 'Ip: máximo 100 caracteres.'
      if (os && os.length > 100) e.operatingSystem = 'Sistema operativo: máximo 100 caracteres.'
      if (version && version.length > 100) e.versionSO = 'Versión SO: máximo 100 caracteres.'
      if (desc && desc.length > 500) e.description = 'Descripción: máximo 500 caracteres.'

      setDeviceErrors(e)
      return Object.keys(e).length === 0
    }, [newDevice])

    const reloadClient = useCallback(async () => {
      const code = clienteCodigo != null ? String(clienteCodigo).trim() : ''
      if (clientId) await fetchClientByCodeOrId(clientId)
      else if (code) await fetchClientByCodeOrId(code)
    }, [clientId, clienteCodigo, fetchClientByCodeOrId])

    const createDevice = useCallback(async () => {
      if (!client?.id) return
      if (!validateDevice()) return

      const dto: DeviceRequestDTO = {
        name: newDevice.name.trim(),
        ip: newDevice.ip || null,
        operatingSystem: newDevice.operatingSystem || null,
        versionSO: newDevice.versionSO || null,
        description: newDevice.description || null,
        isActive: !!newDevice.isActive,
      }

      const created = await addDeviceAsync(client.id, dto)

      setClient((prev: any) => {
        if (!prev) return prev
        const list = Array.isArray(prev.outsourcedDevices)
          ? [...prev.outsourcedDevices]
          : []
        if (created)
          list.unshift({ ...(created as any), credentials: [] })
        else
          list.unshift({
            id: Date.now(),
            ...dto,
            isActive: !!dto.isActive,
            credentials: [],
          })
        return { ...prev, outsourcedDevices: list }
      })
      await reloadClient()
      setNewDevice({
        name: '',
        ip: '',
        operatingSystem: '',
        versionSO: '',
        description: '',
        isActive: true,
      })
      setDeviceErrors({})
      setAddDeviceOpen(false)
    }, [
      client?.id,
      newDevice,
      addDeviceAsync,
      setClient,
      validateDevice,
      reloadClient,
    ])

    const [pickSysOpen, setPickSysOpen] = useState(false)
    const [newSystem, setNewSystem] =
      useState<SystemRequestDTO>({ outsourcedSystemsId: 0, isActive: true })

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
          const list = Array.isArray(prev.outsourcedSystems)
            ? [...prev.outsourcedSystems]
            : []
          const fromCatalog = sysCatalog.find(
            s => s.id === newSystem.outsourcedSystemsId
          )
          if (fromCatalog)
            list.unshift({
              id: (added as any).id ?? Date.now(),
              name: fromCatalog.name,
              description: fromCatalog.description,
              version: fromCatalog.version,
              isActive: !!newSystem.isActive,
              credentials: [],
            })
          return { ...prev, outsourcedSystems: list }
        })
      }
      await reloadClient()
      setNewSystem({ outsourcedSystemsId: 0, isActive: true })
      setPickSysOpen(false)
    }, [
      client?.id,
      newSystem,
      addSystemAsync,
      reloadClient,
      sysCatalog,
      setClient,
    ])

    const [pickCtcOpen, setPickCtcOpen] = useState(false)
    const [newContact, setNewContact] =
      useState<ContactRequestDTO>({ contactId: 0, isActive: true })
    const [contactPickerItems, setContactPickerItems] = useState<
      Array<{ id: number; fullName?: string | null; phone?: string | null }>
    >([])

    const openContactPicker = useCallback(async () => {
      setPickCtcOpen(true)
      if ((client as any)?.id) {
        const res = await fetchContactsByClient((client as any).id)
        if (res?.items) {
          setContactPickerItems(
            res.items.map((r: any) => ({
              id: r.id,
              fullName: r.fullName ?? r.name ?? '',
              phone: r.phone ?? '',
            }))
          )
        }
      }
    }, [client, fetchContactsByClient])

    const addPickedContact = useCallback(async () => {
      if (!client?.id || !newContact.contactId) return
      await linkExistingContactsAsync(client.id, [newContact.contactId])
      setClient((prev: any) => {
        if (!prev) return prev
        const list = Array.isArray(prev.clientContacts)
          ? [...prev.clientContacts]
          : []
        const found = contactPickerItems.find(
          c => c.id === newContact.contactId
        )
        if (found)
          list.unshift({
            id: found.id,
            fullName: found.fullName,
            phone: found.phone,
          })
        return { ...prev, clientContacts: list }
      })
      await reloadClient()
      setNewContact({ contactId: 0, isActive: true })
      setPickCtcOpen(false)
    }, [
      client?.id,
      newContact,
      linkExistingContactsAsync,
      reloadClient,
      setClient,
      contactPickerItems,
    ])

    const [clientEditOpen, setClientEditOpen] = useState(false)

    const [workModel, setWorkModel] = useState<string>(
      clientLocal?.workModel ?? ''
    )
    const [priority, setPriority] = useState<string>(
      clientLocal?.priority ?? ''
    )
    const [supportType, setSupportType] = useState<string>(
      clientLocal?.supportType ?? ''
    )
    const [envType, setEnvType] = useState<string>(
      clientLocal?.enviromentType ?? ''
    )
    const [isSupportActive, setIsSupportActive] = useState<boolean>(
      !!clientLocal?.isSupportActive
    )
    const [isFranchise, setIsFranchise] = useState<boolean>(
      !!clientLocal?.isFranchise
    )
    const [supportLimitTime, setSupportLimitTime] = useState<string>(
      clientLocal?.supportLimitTime != null ? String(clientLocal.supportLimitTime) : ''
    )
    const [recurrency, setRecurrency] = useState<string>(
      clientLocal?.recurrency != null ? String(clientLocal.recurrency) : ''
    )
    const [observation, setObservation] = useState<string>(
      clientLocal?.observation ?? ''
    )

    useEffect(() => {
      setWorkModel(clientLocal?.workModel ?? '')
      setPriority(clientLocal?.priority ?? '')
      setSupportType(clientLocal?.supportType ?? '')
      setEnvType(clientLocal?.enviromentType ?? '')
      setIsSupportActive(!!clientLocal?.isSupportActive)
      setIsFranchise(!!clientLocal?.isFranchise)
      setSupportLimitTime(
        clientLocal?.supportLimitTime != null ? String(clientLocal.supportLimitTime) : ''
      )
      setRecurrency(
        clientLocal?.recurrency != null ? String(clientLocal.recurrency) : ''
      )
      setObservation(clientLocal?.observation ?? '')
    }, [clientEditOpen, clientLocal])

    const saveClientEdits = useCallback(async () => {
      if (!client?.id) return
      const patch: Partial<ClientUpdateRequestDTO> = {
        workModel,
        priority,
        supportType,
        enviromentType: envType,
        isSupportActive,
        isFranchise,
        supportLimitTime:
          supportLimitTime === '' ? null : Number(supportLimitTime),
        observation,
      }
      setClientLocal((prev: any) => ({ ...prev, ...patch }))
      await updateClientAsync(client.id, patch)
      await reloadClient()
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
      observation,
      updateClientAsync,
      reloadClient,
    ])

    const handleSendQuick = async (
      text: string,
      onSendNow?: (t: string) => void | Promise<void>
    ) => {
      if (onSendNow) {
        await onSendNow(text)
        return
      }
      const w = (window as unknown) as any
      if (typeof w.__CHAT_SEND_QUICK__ === 'function') {
        w.__CHAT_SEND_QUICK__(text)
        return
      }
      window.dispatchEvent(
        new CustomEvent('chat:sendQuick', { detail: { text } })
      )
    }

    const refreshContact = useCallback(() => {
      if (typeof contactId === 'number' && contactId > 0)
        return fetchContactById(contactId)
      return Promise.resolve()
    }, [contactId, fetchContactById])

    const refreshClient = useCallback(() => reloadClient(), [reloadClient])

    const setTabFromParam = useCallback((p: unknown): OptionMenu => {
      if (typeof p === 'number' && p >= 1 && p <= 5) return p as OptionMenu
      if (typeof p === 'string') {
        const s = p.toLowerCase()
        if (s.includes('contact')) return 2
        if (s.includes('client') || s.includes('cliente')) return 1
        if (s.includes('history') || s.includes('historial')) return 3
        if (s.includes('conv') || s.includes('convers')) return 4
        if (s.includes('quick') || s.includes('rápido')) return 5
      }
      return 1
    }, [])

    useEffect(() => {
      if (selectedParam != null)
        setOptionMenu(setTabFromParam(selectedParam))
    }, [selectedParam, setTabFromParam])

    const credentials = useMemo<CredentialResponseDTO[]>(() => {
      const c = client as ClientResponseDTO | null
      if (!c) return []
      const host = (c.hostingCredentials ?? []) as CredentialResponseDTO[]
      const dev = (c.outsourcedDevices ?? []).flatMap((d: any) =>
        (d.credentials ?? []).map((cr: CredentialResponseDTO) => ({
          ...cr,
          outsourcedDeviceId: d.id,
          outsourcedDeviceName: d.name,
        }))
      )
      const sys = (c.outsourcedSystems ?? []).flatMap((sy: any) =>
        (sy.credentials ?? []).map((cr: CredentialResponseDTO) => ({
          ...cr,
          clientOutsourcedSystemsId: sy.id,
          clientOutsourcedSystemsName: sy.name,
        }))
      )
      return [...host, ...dev, ...sys]
    }, [client])

    const [credModalOpen, setCredModalOpen] = useState(false)
    const [credMode, setCredMode] = useState<CredMode>('create')
    const [credScope, setCredScope] = useState<CredScope>('client')
    const [deviceTargetId, setDeviceTargetId] = useState<number | ''>('')
    const [systemTargetId, setSystemTargetId] = useState<number | ''>('')
    const [credReq, setCredReq] = useState<CredentialRequestDTO>({
      catCredentialId: 0,
      clientId: client?.id ?? 0,
      outsourcedDeviceId: null,
      clientOutsourcedSystemId: null,
      user: '',
      password: '',
      instance: '',
      port: '',
      observation: '',
      isActive: true,
    })
    const [credErrors, setCredErrors] = useState<ErrorBag>({})

    useEffect(() => {
      setCredReq(s => ({
        ...s,
        clientId: client?.id ?? 0,
      }))
    }, [client?.id])

    const openCredCreate = useCallback(() => {
      setCredMode('create')
      setCredScope('client')
      setDeviceTargetId('')
      setSystemTargetId('')
      setCredErrors({})
      setCredReq({
        catCredentialId: 0,
        clientId: client?.id ?? 0,
        outsourcedDeviceId: null,
        clientOutsourcedSystemId: null,
        user: '',
        password: '',
        instance: '',
        port: '',
        observation: '',
        isActive: true,
      })
      setCredModalOpen(true)
    }, [client?.id])

    const openCredView = useCallback(
      (c: CredentialResponseDTO) => {
        const scope: CredScope = c.outsourcedDeviceId
          ? 'device'
          : c.clientOutsourcedSystemsId
          ? 'system'
          : 'client'
        setCredMode('view')
        setCredScope(scope)
        setDeviceTargetId(c.outsourcedDeviceId ?? '')
        setSystemTargetId(c.clientOutsourcedSystemsId ?? '')
        setCredErrors({})
        setCredReq({
          id: c.id,
          catCredentialId: c.catCredencialId,
          clientId: scope === 'client' ? client?.id ?? null : null,
          outsourcedDeviceId:
            scope === 'device' ? c.outsourcedDeviceId ?? null : null,
          clientOutsourcedSystemId:
            scope === 'system'
              ? c.clientOutsourcedSystemsId ?? null
              : null,
          user: c.user,
          password: '',
          instance: c.instance ?? '',
          port: c.port ?? '',
          observation: c.observation ?? '',
          isActive: c.isActive,
        } as CredentialRequestDTO)
        setCredModalOpen(true)
      },
      [client?.id]
    )

    const openCredEdit = useCallback(
      (c: CredentialResponseDTO) => {
        const scope: CredScope = c.outsourcedDeviceId
          ? 'device'
          : c.clientOutsourcedSystemsId
          ? 'system'
          : 'client'
        setCredMode('update')
        setCredScope(scope)
        setDeviceTargetId(c.outsourcedDeviceId ?? '')
        setSystemTargetId(c.clientOutsourcedSystemsId ?? '')
        setCredErrors({})
        setCredReq({
          id: c.id,
          catCredentialId: c.catCredencialId,
          clientId: scope === 'client' ? client?.id ?? null : null,
          outsourcedDeviceId:
            scope === 'device' ? c.outsourcedDeviceId ?? null : null,
          clientOutsourcedSystemId:
            scope === 'system'
              ? c.clientOutsourcedSystemsId ?? null
              : null,
          user: c.user,
          password: '',
          instance: c.instance ?? '',
          port: c.port ?? '',
          observation: c.observation ?? '',
          isActive: c.isActive,
        } as CredentialRequestDTO)
        setCredModalOpen(true)
      },
      [client?.id]
    )

    const credPayload = useMemo<CredentialRequestDTO>(() => {
      if (credScope === 'client') {
        return {
          ...credReq,
          clientId: client?.id ?? 0,
          outsourcedDeviceId: null,
          clientOutsourcedSystemId: null,
        }
      }
      if (credScope === 'device') {
        return {
          ...credReq,
          clientId: null,
          outsourcedDeviceId:
            deviceTargetId === '' ? null : Number(deviceTargetId),
          clientOutsourcedSystemId: null,
        }
      }
      return {
        ...credReq,
        clientId: null,
        outsourcedDeviceId: null,
        clientOutsourcedSystemId:
          systemTargetId === '' ? null : Number(systemTargetId),
      }
    }, [credReq, credScope, client?.id, deviceTargetId, systemTargetId])

    const validateCred = useCallback((): boolean => {
      const e: ErrorBag = {}
      if (!credReq.catCredentialId || credReq.catCredentialId <= 0)
        e.catCredentialId = 'Seleccione el tipo.'
      if (!credReq.user || credReq.user.trim().length === 0)
        e.user = 'Usuario es obligatorio.'
      if (credReq.user && credReq.user.length > 255)
        e.user = 'Máximo 255 caracteres.'
      if (!credReq.password || credReq.password.trim().length === 0)
        e.password = 'Contraseña es obligatorio.'
      if (credReq.instance && credReq.instance.length > 100)
        e.instance = 'Máximo 100 caracteres.'
      if (credReq.port && credReq.port.length > 100)
        e.port = 'Máximo 100 caracteres.'
      if (credReq.observation && credReq.observation.length > 255)
        e.observation = 'Máximo 255 caracteres.'
      if (
        credScope === 'device' &&
        !credPayload.outsourcedDeviceId
      )
        e.scope = 'Seleccione un equipo.'
      if (
        credScope === 'system' &&
        !credPayload.clientOutsourcedSystemId
      )
        e.scope = 'Seleccione un sistema.'
      setCredErrors(e)
      return Object.keys(e).length === 0
    }, [credReq, credScope, credPayload])

    const saveCred = useCallback(async () => {
      if (!client?.id) return
      if (!validateCred()) return
      if (credMode === 'update' && (credReq as any).id) {
        await CredentialsService.updateAsync(
          (credReq as any).id,
          credPayload
        )
      } else {
        if (credScope === 'client') {
          await addCredentialHostingAsync(client.id, credPayload)
        } else if (
          credScope === 'device' &&
          credPayload.outsourcedDeviceId
        ) {
          await addCredentialForDeviceAsync(
            client.id,
            credPayload.outsourcedDeviceId,
            credPayload
          )
        } else if (
          credScope === 'system' &&
          credPayload.clientOutsourcedSystemId
        ) {
          await addCredentialForSystemAsync(
            client.id,
            credPayload.clientOutsourcedSystemId,
            credPayload
          )
        }
      }
      await reloadClient()
      setCredModalOpen(false)
    }, [
      client?.id,
      validateCred,
      credMode,
      credReq,
      credScope,
      credPayload,
      addCredentialHostingAsync,
      addCredentialForDeviceAsync,
      addCredentialForSystemAsync,
      reloadClient,
    ])

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
      filteredHosting,
      filteredDevs,
      filteredSystems,
      expandedDev,
      toggleExpandedDev,
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
      credentials,
      credModalOpen,
      setCredModalOpen,
      credMode,
      setCredMode,
      credScope,
      setCredScope,
      deviceTargetId,
      setDeviceTargetId,
      systemTargetId,
      setSystemTargetId,
      credReq,
      setCredReq,
      credErrors,
      setCredErrors,
      openCredCreate,
      openCredView,
      openCredEdit,
      saveCred,
      catCredential,
      updateOutsourcedDevices,
    }
  }

  export default useDetailPanel