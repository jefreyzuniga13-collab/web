/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react'
import { OutsourcedDevicesService } from '@/Services/Crm/OutsourcedDeviceServices'
import type {
  OutsourcedDeviceRequestDTO,
  OutsourcedDeviceResponseDTO,
} from '@/Interfaces/Crm/ClientInterface'

export const useOutsourcedDevices = () => {
  const [items, setItems] = useState<OutsourcedDeviceResponseDTO[]>([])
  const [selected, setSelected] = useState<OutsourcedDeviceResponseDTO | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(30)
  const [totalCount, setTotalCount] = useState(0)
  const [loadingList, setLoadingList] = useState(false)
  const [loadingItem, setLoadingItem] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'update' | 'view'>('create')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [globalFilter, setGlobalFilter] = useState<string>('')
  const [clientId, setClientId] = useState<number | null>(null)

  const fetchPage = useCallback(
    async (p = page, s = pageSize) => {
      setLoadingList(true)
      setError(null)
      try {
        const resp = await OutsourcedDevicesService.getAllAsync(globalFilter, p, s)
        setItems(resp.items)
        setTotalCount(resp.meta.totalCount)
        setPage(resp.meta.currentPage)
        setPageSize(resp.meta.pageSize)
      } catch (err: any) {
        setError(err)
      } finally {
        setLoadingList(false)
      }
    },
    [globalFilter, page, pageSize]
  )

  const fetchById = useCallback(async (id: number) => {
    setLoadingItem(true)
    setError(null)
    try {
      const ws = await OutsourcedDevicesService.getByIdAsync(id)
      setSelected(ws)
    } catch (err: any) {
      setError(err)
    } finally {
      setLoadingItem(false)
    }
  }, [])

  const create = useCallback(
    async (values: OutsourcedDeviceRequestDTO, cId?: number) => {
      setLoadingItem(true)
      setError(null)
      try {
        const theClientId = cId ?? clientId
        if (theClientId == null) throw new Error('clientId requerido')
        await OutsourcedDevicesService.createAsync(theClientId, values)
        await fetchPage(1, pageSize)
      } catch (err: any) {
        setError(err)
      } finally {
        setLoadingItem(false)
      }
    },
    [clientId, fetchPage, pageSize]
  )

  const update = useCallback(
    async (id: number, values: OutsourcedDeviceRequestDTO) => {
      setLoadingItem(true)
      setError(null)
      try {
        await OutsourcedDevicesService.updateAsync(id, values)
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
      const updated = await OutsourcedDevicesService.toggleAsync(id)
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
      fetchById(id)
    },
    [items, fetchById]
  )

  const openView = useCallback(
    (id: number) => {
      const cached = items.find(w => w.id === id) || null
      setSelected(cached)
      setModalMode('view')
      setIsModalOpen(true)
      fetchById(id)
    },
    [items, fetchById]
  )

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setSelected(null)
  }, [])

  const handleSubmit = useCallback(
    (values: OutsourcedDeviceRequestDTO) => {
      if (modalMode === 'create') {
        create(values)
      } else if (modalMode === 'update' && selected) {
        update(selected.id, values)
      }
      closeModal()
    },
    [modalMode, selected, create, update, closeModal]
  )

  useEffect(() => {
    fetchPage()
  }, [fetchPage, globalFilter])

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
    clientId,
    setClientId,
    create,
    update,
    fetchById,
  }
}