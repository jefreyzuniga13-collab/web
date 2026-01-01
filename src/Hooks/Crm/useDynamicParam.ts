/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react'
import type {
    DynamicParamRequiestDto,
    DynamicParamResponseDto
} from '@/Interfaces/Crm/DynamicParamInterface'
import { SystemParamService } from '@/Services/Crm/DynamicParamService'

export function useDynamicParam() {
  const [dynamicParams, setDynamicParams] = useState<DynamicParamResponseDto[]>([])
  const [selectedDynamicParam, setSelectedDynamicParam] = useState<DynamicParamResponseDto | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalCount, setTotalCount] = useState(0)
  const [loadingList, setLoadingList] = useState(false)
  const [loadingItem, setLoadingItem] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [isModalOpen, setModalOpen] = useState(false)
  const [globalFilter, setGlobalFilter] = useState<string>('')

  // Fetch paginated list
  const fetchPage = useCallback(
    async (p = page, s = pageSize) => {
      setLoadingList(true)
      setError(null)
      try {
        //Aqui el globalFilter lleno basillo
        const resp = await SystemParamService.getAllAsync(globalFilter, p, s)
        setDynamicParams(resp.items)
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

  // Fetch single item
  const fetchById = useCallback(async (id: string) => {
    setLoadingItem(true)
    setError(null)
    try {
      const item = await SystemParamService.getByIdAsync(id)
      setSelectedDynamicParam(item)
    } catch (err: any) {
      setError(err)
    } finally {
      setLoadingItem(false)
    }
  }, [])

    const fetchByName = useCallback(async (name: string) => {
    setLoadingItem(true)
    setError(null)
    try {
      const item = await SystemParamService.getByNameAsync(name)
      setSelectedDynamicParam(item)
    } catch (err: any) {
      setError(err)
    } finally {
      setLoadingItem(false)
    }
  }, [])

  // Create
  const create = useCallback(
    async (values: DynamicParamRequiestDto) => {
      setLoadingItem(true)
      setError(null)
      try {
        await SystemParamService.createAsync(values)
        await fetchPage(page, pageSize)
      } catch (err: any) {
        setError(err)
      } finally {
        setLoadingItem(false)
      }
    },
    [fetchPage, pageSize]
  )

  // Update
  const update = useCallback(
    async (id: string, values: DynamicParamRequiestDto) => {
      setLoadingItem(true)
      setError(null)
      try {
        await SystemParamService.updateAsync(id, values)
        await fetchPage(page, pageSize)
      } catch (err: any) {
        setError(err)
      } finally {
        setLoadingItem(false)
      }
    },
    [fetchPage, page, pageSize]
  )

  // Toggle status
  const toggleStatus = useCallback(
    async (id: string) => {
      setLoadingItem(true)
      setError(null)
      try {
        const toggled = await SystemParamService.toggleStatusAsync(id)
        
        setDynamicParams(prev =>
          prev.map(item => (item.publicId === toggled.publicId ? toggled : item))
        )
      } catch (err: any) {
        setError(err)
      } finally {
        setLoadingItem(false)
      }
    },
    []
  )

  // Modal controls
  const openCreate = useCallback(() => {
    setSelectedDynamicParam(null)
    setModalMode('create')
    setModalOpen(true)
  }, [])

  const openEdit = useCallback(
    (id: string) => {
      const cache = dynamicParams.find(x => x.publicId === id) || null
      setSelectedDynamicParam(cache)
      setModalMode('edit')
      setModalOpen(true)
      fetchById(id)
    },
    [dynamicParams, fetchById]
  )

  const openView = useCallback(
    (id: string) => {
      const cache = dynamicParams.find(x => x.publicId === id) || null
      setSelectedDynamicParam(cache)
      setModalMode('view')
      setModalOpen(true)
      fetchById(id)
    },
    [dynamicParams, fetchById]
  )

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setSelectedDynamicParam(null)
  }, [])

  const handleSubmit = useCallback(
    (values: DynamicParamRequiestDto) => {
      if (modalMode === 'create') create(values)
      else if (modalMode === 'edit' && selectedDynamicParam) update(selectedDynamicParam.publicId, values)
      closeModal()
    },
    [modalMode, selectedDynamicParam, create, update, closeModal]
  )

  // Initial load & reload
  useEffect(() => {
    //Aqui el filtro muestra la informacion que se esta asignado en vivo con el setGlobalFilter
    fetchPage()
  }, [fetchPage, globalFilter])

  return {
    dynamicParams,
    selectedDynamicParam,
    loading: loadingList || loadingItem,
    error,
    page,
    pageSize,
    totalCount,
    setPage: (p: number) => fetchPage(p, pageSize),
    setPageSize: (s: number) => fetchPage(1, s),
    modalMode,
    isModalOpen,
    openCreate,
    openEdit,
    openView,
    closeModal,
    handleSubmit,
    toggleStatus: toggleStatus,
    globalFilter,
    setGlobalFilter,
    fetchByName
  }
}