/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react'
import type {
  SystemParamRequestDto,
  SystemParamResponseDto,
} from '@/Interfaces/Auth/AuthInterface'
import { SystemParamService } from '@/Services/SystemParamService'

export function useSystemParams() {
  const [systemParams, setSystemParams] = useState<SystemParamResponseDto[]>([])
  const [selectedParam, setSelectedParam] = useState<SystemParamResponseDto | null>(null)
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
        console.log("El estado global es antes de la peticion", globalFilter);
        const resp = await SystemParamService.getAllAsync(globalFilter, p, s)
        setSystemParams(resp.items)
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
  const fetchById = useCallback(async (id: number) => {
    setLoadingItem(true)
    setError(null)
    try {
      const item = await SystemParamService.getByIdAsync(id)
      setSelectedParam(item)
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
      setSelectedParam(item)
    } catch (err: any) {
      setError(err)
    } finally {
      setLoadingItem(false)
    }
  }, [])

  // Create
  const create = useCallback(
    async (values: SystemParamRequestDto) => {
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
    async (id: number, values: SystemParamRequestDto) => {
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
    async (id: number) => {
      setLoadingItem(true)
      setError(null)
      try {
        const toggled = await SystemParamService.toggleStatusAsync(id)
        
        setSystemParams(prev =>
          prev.map(item => (item.id === toggled.id ? toggled : item))
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
    setSelectedParam(null)
    setModalMode('create')
    setModalOpen(true)
  }, [])

  const openEdit = useCallback(
    (id: number) => {
      const cache = systemParams.find(x => x.id === id) || null
      setSelectedParam(cache)
      setModalMode('edit')
      setModalOpen(true)
      fetchById(id)
    },
    [systemParams, fetchById]
  )

  const openView = useCallback(
    (id: number) => {
      const cache = systemParams.find(x => x.id === id) || null
      setSelectedParam(cache)
      setModalMode('view')
      setModalOpen(true)
      fetchById(id)
    },
    [systemParams, fetchById]
  )

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setSelectedParam(null)
  }, [])

  const handleSubmit = useCallback(
    (values: SystemParamRequestDto) => {
      if (modalMode === 'create') create(values)
      else if (modalMode === 'edit' && selectedParam) update(selectedParam.id, values)
      closeModal()
    },
    [modalMode, selectedParam, create, update, closeModal]
  )

  // Initial load & reload
  useEffect(() => {
    //Aqui el filtro muestra la informacion que se esta asignado en vivo con el setGlobalFilter
    console.log("El estado global a llamar a fetchPage", globalFilter);
    fetchPage()
  }, [fetchPage, globalFilter])

  return {
    systemParams,
    selectedParam,
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
    toggleSystemParam: toggleStatus,
    globalFilter,
    setGlobalFilter,
    fetchByName
  }
}