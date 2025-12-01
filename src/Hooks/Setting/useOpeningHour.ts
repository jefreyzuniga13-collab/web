/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react'
import { OpeningHourService } from '@/Services/Setting/OpeningHourService'
import type {
  OpeningHourInterface,
  OpeningHourFormValues,
} from '@/Interfaces/Setting/OpeningHour'

export const useOpeningHour = () => {
  const [openingHours, setOpeningHours] = useState<OpeningHourInterface[]>([])
  const [selectedOpeningHour, setSelectedOpeningHour] = useState<OpeningHourInterface|null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalCount, setTotalCount] = useState(0)
  const [loadingList, setLoadingList] = useState(false)
  const [loadingItem, setLoadingItem] = useState(false)
  const [error, setError] = useState<Error|null>(null)
  const [modalMode, setModalMode] = useState<'create'|'edit'|'view'>('create')
  const [isModalOpen, setModalOpen] = useState(false)
  const [globalFilter, setGlobalFilter] = useState<string>('')

  // Fetch a page of data
  const fetchPage = useCallback(async (p = page, s = pageSize) => {
    setLoadingList(true)
    setError(null)
    try {
      const resp = await OpeningHourService.getAll(globalFilter, p, s)
      setOpeningHours(resp.items)
      setTotalCount(resp.meta.totalCount)
      setPage(resp.meta.currentPage)
      setPageSize(resp.meta.pageSize)
    } catch (err: any) {
      setError(err)
    } finally {
      setLoadingList(false)
    }
  }, [globalFilter, page, pageSize])

  // Fetch one item by id (for edit/view)
  const fetchById = useCallback(async (id: number) => {
    setLoadingItem(true)
    setError(null)
    try {
      const item = await OpeningHourService.getOpeningHourByIdAsync(id)
      setSelectedOpeningHour(item)
    } catch (err: any) {
      setError(err)
    } finally {
      setLoadingItem(false)
    }
  }, [])

  // Create
  const create = useCallback(async (values: OpeningHourFormValues) => {
    setLoadingItem(true)
    setError(null)
    try {
      await OpeningHourService.createOpeningHourAsync(values)
      // reload first page
      await fetchPage(1, pageSize)
    } catch (err: any) {
      setError(err)
    } finally {
      setLoadingItem(false)
    }
  }, [fetchPage, pageSize])

  // Update
  const update = useCallback(async (id: number, values: OpeningHourFormValues) => {
    setLoadingItem(true)
    setError(null)
    try {
      const res = await OpeningHourService.updateOpeningHourAsync(id, values)
      
     setOpeningHours(prev =>
        prev.map(item => item.id === res.id ? res : item)
      )

    } catch (err: any) {
      setError(err)
    } finally {
      setLoadingItem(false)
    }
  }, [fetchPage, page, pageSize])

  // Toggle status in place
  const toggleStatus = useCallback(async (id: number) => {
    setLoadingItem(true)
    setError(null)
    try {
      const toggled = await OpeningHourService.toggleOpeningHourStatusAsync(id)
      setOpeningHours(prev =>
        prev.map(item => item.id === toggled.id ? toggled : item)
      )
    } catch (err: any) {
      setError(err)
    } finally {
      setLoadingItem(false)
    }
  }, [])

  // Modal controls
  const openCreate = useCallback(() => {
    setSelectedOpeningHour(null)
    setModalMode('create')
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((id: number) => {
    // show modal immediately with cached data
    const cached = openingHours.find(x => x.id === id) || null
    setSelectedOpeningHour(cached)
    setModalMode('edit')
    setModalOpen(true)
    // then refresh from server
    fetchById(id)
  }, [openingHours, fetchById])

  const openView = useCallback((id: number) => {
    const cached = openingHours.find(x => x.id === id) || null
    setSelectedOpeningHour(cached)
    setModalMode('view')
    setModalOpen(true)
    fetchById(id)
  }, [openingHours, fetchById])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setSelectedOpeningHour(null);
  }, [])

  const handleSubmit = useCallback((values: OpeningHourFormValues) => {
    if (modalMode === 'create') {
      create(values)
    } else if (modalMode === 'edit' && selectedOpeningHour) {
      update(selectedOpeningHour.id, values)
    }
    closeModal()
  }, [modalMode, selectedOpeningHour, create, update, closeModal])

  // Initial load & reload on page/pageSize change
  useEffect(() => {
    fetchPage()
  }, [fetchPage, globalFilter])

  return {
    openingHours,
    selectedOpeningHour,
    loading: loadingList || loadingItem,
    error,
    page,
    pageSize,
    totalCount,
    setPage:      (p: number) => fetchPage(p, pageSize),
    setPageSize:  (s: number) => fetchPage(1, s),
    modalMode,
    isModalOpen,
    openCreate,
    openEdit,
    openView,
    closeModal,
    handleSubmit,
    toggleOpeningHourStatus: toggleStatus,
    globalFilter,
    setGlobalFilter
  }
}