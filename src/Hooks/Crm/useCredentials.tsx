/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react'
import { CredentialsService } from '@/Services/Crm/CredentialService'
import type {
  CredentialRequestDTO,
  CredentialResponseDTO,
} from '@/Interfaces/Crm/ClientInterface'

type Mode = 'client' | 'device' | 'system'

export const useCredentials = (initialMode: Mode = 'client') => {
  const [items, setItems] = useState<CredentialResponseDTO[]>([])
  const [selected, setSelected] = useState<CredentialResponseDTO | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(30)
  const [totalCount, setTotalCount] = useState(0)
  const [loadingList, setLoadingList] = useState(false)
  const [loadingItem, setLoadingItem] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'update' | 'view'>('create')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [globalFilter, setGlobalFilter] = useState<string>('')

  const [mode, setMode] = useState<Mode>(initialMode)
  const [clientId, setClientId] = useState<number | null>(null)
  const [deviceId, setDeviceId] = useState<number | null>(null)
  const [clientSystemId, setClientSystemId] = useState<number | null>(null)

  const fetchPage = useCallback(
    async (p = page, s = pageSize) => {
      setLoadingList(true)
      setError(null)
      try {
        if (mode === 'client') {
          if (clientId == null) throw new Error('clientId requerido')
          const resp = await CredentialsService.getByClientAsync(clientId, p, s, globalFilter)
          setItems(resp.items)
          setTotalCount(resp.meta.totalCount)
          setPage(resp.meta.currentPage)
          setPageSize(resp.meta.pageSize)
        } else if (mode === 'device') {
          if (deviceId == null) throw new Error('deviceId requerido')
          const resp = await CredentialsService.getByDeviceAsync(deviceId, p, s, globalFilter)
          setItems(resp.items)
          setTotalCount(resp.meta.totalCount)
          setPage(resp.meta.currentPage)
          setPageSize(resp.meta.pageSize)
        } else {
          if (clientSystemId == null) throw new Error('clientSystemId requerido')
          const resp = await CredentialsService.getByClientSystemAsync(clientSystemId, p, s, globalFilter)
          setItems(resp.items)
          setTotalCount(resp.meta.totalCount)
          setPage(resp.meta.currentPage)
          setPageSize(resp.meta.pageSize)
        }
      } catch (err: any) {
        setError(err)
      } finally {
        setLoadingList(false)
      }
    },
    [mode, clientId, deviceId, clientSystemId, globalFilter, page, pageSize]
  )

  const createHosting = useCallback(
    async (values: CredentialRequestDTO, cId?: number) => {
      setLoadingItem(true)
      setError(null)
      try {
        const theClientId = cId ?? clientId
        if (theClientId == null) throw new Error('clientId requerido')
        await CredentialsService.createHostingAsync(theClientId, values)
        await fetchPage(1, pageSize)
      } catch (err: any) {
        setError(err)
      } finally {
        setLoadingItem(false)
      }
    },
    [clientId, fetchPage, pageSize]
  )

  const createForDevice = useCallback(
    async (values: CredentialRequestDTO, cId?: number, dId?: number) => {
      setLoadingItem(true)
      setError(null)
      try {
        const theClientId = cId ?? clientId
        const theDeviceId = dId ?? deviceId
        if (theClientId == null) throw new Error('clientId requerido')
        if (theDeviceId == null) throw new Error('deviceId requerido')
        await CredentialsService.createForDeviceAsync(theClientId, theDeviceId, values)
        await fetchPage(1, pageSize)
      } catch (err: any) {
        setError(err)
      } finally {
        setLoadingItem(false)
      }
    },
    [clientId, deviceId, fetchPage, pageSize]
  )

  const createForClientSystem = useCallback(
    async (values: CredentialRequestDTO, cId?: number, csId?: number) => {
      setLoadingItem(true)
      setError(null)
      try {
        const theClientId = cId ?? clientId
        const theClientSystemId = csId ?? clientSystemId
        if (theClientId == null) throw new Error('clientId requerido')
        if (theClientSystemId == null) throw new Error('clientSystemId requerido')
        await CredentialsService.createForClientSystemAsync(theClientId, theClientSystemId, values)
        await fetchPage(1, pageSize)
      } catch (err: any) {
        setError(err)
      } finally {
        setLoadingItem(false)
      }
    },
    [clientId, clientSystemId, fetchPage, pageSize]
  )

  const update = useCallback(
    async (id: number, values: CredentialRequestDTO) => {
      setLoadingItem(true)
      setError(null)
      try {
        await CredentialsService.updateAsync(id, values)
        await fetchPage(page, pageSize)
      } catch (err: any) {
        setError(err)
      } finally {
        setLoadingItem(false)
      }
    },
    [fetchPage, page, pageSize]
  )

  const toggleStatus = useCallback(async (id: number) => {
    setLoadingItem(true)
    setError(null)
    try {
      const updated = await CredentialsService.toggleAsync(id)
      setItems(ws => ws.map(w => (w.id === updated.id ? updated : w)))
      setSelected(s => (s && s.id === updated.id ? updated : s))
    } catch (err: any) {
      setError(err)
    } finally {
      setLoadingItem(false)
    }
  }, [])

  const openCreate = useCallback(() => {
    setSelected(null)
    setModalMode('create')
    setIsModalOpen(true)
  }, [])

  const openEdit = useCallback(
    (id: number) => {
      const cached = items.find(w => w.id === id) || null
      setSelected(cached)
      setModalMode('update')
      setIsModalOpen(true)
    },
    [items]
  )

  const openView = useCallback(
    (id: number) => {
      const cached = items.find(w => w.id === id) || null
      setSelected(cached)
      setModalMode('view')
      setIsModalOpen(true)
    },
    [items]
  )

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setSelected(null)
  }, [])

  const handleSubmit = useCallback(
    (values: CredentialRequestDTO) => {
      if (modalMode === 'create') {
        if (mode === 'client') createHosting(values)
        else if (mode === 'device') createForDevice(values)
        else createForClientSystem(values)
      } else if (modalMode === 'update' && selected) {
        update(selected.id, values)
      }
      closeModal()
    },
    [modalMode, mode, selected, createHosting, createForDevice, createForClientSystem, update, closeModal]
  )

  useEffect(() => {
    if (
      (mode === 'client' && clientId != null) ||
      (mode === 'device' && deviceId != null) ||
      (mode === 'system' && clientSystemId != null)
    ) {
      fetchPage()
    }
  }, [fetchPage, mode, clientId, deviceId, clientSystemId])

  return {
    items,
    selected,
    loading: loadingList || loadingItem,
    error,
    page,
    pageSize,
    totalCount,
    fetchPage,
    setPage: (p: number) => fetchPage(p, pageSize),
    setPageSize: (s: number) => fetchPage(1, s),
    modalMode,
    isModalOpen,
    openCreate,
    openEdit,
    openView,
    closeModal,
    handleSubmit,
    toggleStatus,
    globalFilter,
    setGlobalFilter,
    mode,
    setMode,
    clientId,
    setClientId,
    deviceId,
    setDeviceId,
    clientSystemId,
    setClientSystemId,
    createHosting,
    createForDevice,
    createForClientSystem,
    update,
  }
}