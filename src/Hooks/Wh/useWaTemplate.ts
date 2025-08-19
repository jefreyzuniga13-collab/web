/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react'
import type {
  WaTemplateRequestDto,
  WaTemplateResponseDto,
} from '@/Interfaces/Wh/TemplateInterface'
import { WaTemplateService } from '@/Services/Wa/WaTemplateService'

export function useWaTemplate() {
  const [allItems, setAllItems] = useState<WaTemplateResponseDto[]>([])
  const [waTemplates, setWaTemplates] = useState<WaTemplateResponseDto[]>([])
  const [selectedWaTemplate, setSelectedWaTemplate] = useState<WaTemplateResponseDto | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [totalCount, setTotalCount] = useState(0)
  const [loadingList, setLoadingList] = useState(false)
  const [loadingItem, setLoadingItem] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'view'>('create')
  const [isModalOpen, setModalOpen] = useState(false)

  const paginate = useCallback((items: WaTemplateResponseDto[], p: number, s: number) => {
    const start = (p - 1) * s
    const end = start + s
    setWaTemplates(items.slice(start, end))
    setTotalCount(items.length)
  }, [])

  const fetchAll = useCallback(
    async (sync = false) => {
      setLoadingList(true)
      setError(null)
      try {
        const list = await WaTemplateService.GetAllAsync(sync)
        setAllItems(list)
        paginate(list, 1, pageSize)
        setPage(1)
      } catch (err: any) {
        setError(err)
      } finally {
        setLoadingList(false)
      }
    },
    [paginate, pageSize]
  )

  const refreshPageWindow = useCallback(
    (p = page, s = pageSize) => {
      paginate(allItems, p, s)
      setPage(p)
      setPageSize(s)
    },
    [allItems, page, pageSize, paginate]
  )

  const create = useCallback(
    async (values: WaTemplateRequestDto) => {
      setLoadingItem(true)
      setError(null)
      try {
        console.log("Haciendo petición a la api. Los valores son: ", values)
        await WaTemplateService.CreateWaTemplate(values)
        await fetchAll(true)
      } catch (err: any) {
        setError(err)
      } finally {
        setLoadingItem(false)
      }
    },
    [fetchAll]
  )

  const openCreate = useCallback(() => {
    setSelectedWaTemplate(null)
    setModalMode('create')
    setModalOpen(true)
  }, [])
  const openView = useCallback((id: number) => {
    const cache = allItems.find(x => x.id === id) || null
    setSelectedWaTemplate(cache)
    setModalMode('view')
    setModalOpen(true)
  }, [allItems])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setSelectedWaTemplate(null)
  }, [])

  const handleSubmit = useCallback(
    (values: WaTemplateRequestDto) => {
      if (modalMode === 'create') create(values)
      closeModal()
    },
    [modalMode, create, closeModal]
  )

  const setPageExternal = useCallback((p: number) => {
    refreshPageWindow(p, pageSize)
  }, [pageSize, refreshPageWindow])

  const setPageSizeExternal = useCallback((s: number) => {
    refreshPageWindow(1, s)
  }, [refreshPageWindow])

  const syncNow = useCallback(async () => {
    await fetchAll(true)
  }, [fetchAll])

  useEffect(() => {
    fetchAll(false)
  }, [fetchAll])

  return {
    waTemplates,
    selectedWaTemplate,
    loading: loadingList || loadingItem,
    error,
    page,
    pageSize,
    totalCount,
    setPage: setPageExternal,
    setPageSize: setPageSizeExternal,
    modalMode,
    isModalOpen,
    openCreate,
    openView,
    closeModal,
    handleSubmit,
    syncNow,
  }
}