/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react'
import type {
  TemplateCategoryRequestDto,
  TemplateCategoryResponseDto,
} from '@/Interfaces/Chat/TemplateCategoryInterfaces'
import { TemplateCategoryService } from '@/Services/chat/TemplateCategoryService'

export function useTemplateCategory() {
  const [templateCategories, setTemplateCategories] = useState<TemplateCategoryResponseDto[]>([])
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<TemplateCategoryResponseDto | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [totalCount, setTotalCount] = useState(0)
  const [loadingList, setLoadingList] = useState(false)
  const [loadingItem, setLoadingItem] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [isModalOpen, setModalOpen] = useState(false)

  // Fetch paginated list
  const fetchPage = useCallback(
    async (p = page, s = pageSize) => {
      setLoadingList(true)
      setError(null)
      try {
        const resp = await TemplateCategoryService.getAllAsync(p, s)
        setTemplateCategories(resp.items)
        setTotalCount(resp.meta.totalCount)
        setPage(resp.meta.currentPage)
        setPageSize(resp.meta.pageSize)
      } catch (err: any) {
        setError(err)
      } finally {
        setLoadingList(false)
      }
    },
    [page, pageSize]
  )

  // Fetch single item
  const fetchById = useCallback(async (id: number) => {
    setLoadingItem(true)
    setError(null)
    try {
      const item = await TemplateCategoryService.getByIdAsync(id)
      setSelectedTemplateCategory(item)
    } catch (err: any) {
      setError(err)
    } finally {
      setLoadingItem(false)
    }
  }, [])

  // Create
  const create = useCallback(
    async (values: TemplateCategoryRequestDto) => {
      setLoadingItem(true)
      setError(null)
      try {
        await TemplateCategoryService.createAsync(values)
        await fetchPage(1, pageSize)
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
    async (id: number, values: TemplateCategoryRequestDto) => {
      setLoadingItem(true)
      setError(null)
      try {
        await TemplateCategoryService.updateAsync(id, values)
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
        const toggled = await TemplateCategoryService.toggleStatusAsync(id)
        
        setTemplateCategories(prev =>
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
    setSelectedTemplateCategory(null)
    setModalMode('create')
    setModalOpen(true)
  }, [])

  const openEdit = useCallback(
    (id: number) => {
      const cache = templateCategories.find(x => x.id === id) || null
      setSelectedTemplateCategory(cache)
      setModalMode('edit')
      setModalOpen(true)
      fetchById(id)
    },
    [templateCategories, fetchById]
  )

  const openView = useCallback(
    (id: number) => {
      const cache = templateCategories.find(x => x.id === id) || null
      setSelectedTemplateCategory(cache)
      setModalMode('view')
      setModalOpen(true)
      fetchById(id)
    },
    [templateCategories, fetchById]
  )

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setSelectedTemplateCategory(null)
  }, [])

  const handleSubmit = useCallback(
    (values: TemplateCategoryRequestDto) => {
      if (modalMode === 'create') create(values)
      else if (modalMode === 'edit' && selectedTemplateCategory) update(selectedTemplateCategory.id, values)
      closeModal()
    },
    [modalMode, selectedTemplateCategory, create, update, closeModal]
  )

  // Initial load & reload
  useEffect(() => {
    fetchPage()
  }, [fetchPage])

  return {
    templateCategories,
    selectedTemplateCategory,
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
    toggleStatus,
  }
}