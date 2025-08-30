/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react'
import type {
  ProductCatalogRequest,
  ProductCatalogResponse,
} from '@/Interfaces/Wh/ProductCatalogInterfaces'
import { ProductCatalogService } from '@/Services/Wa/ProductCatalogService'

export function useProductCatalog() {
  const [productCatalog, setProductCatalog] = useState<ProductCatalogResponse[]>([])
  const [selectedProductCatalog, setSelectedProductCatalog] = useState<ProductCatalogResponse | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
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
        const resp = await ProductCatalogService.getAllAsync(globalFilter, p, s)
        setProductCatalog(resp.items)
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
      const item = await ProductCatalogService.getByIdAsync(id)
      setSelectedProductCatalog(item)
    } catch (err: any) {
      setError(err)
    } finally {
      setLoadingItem(false)
    }
  }, [])

  // Create
  const create = useCallback(
    async (values: ProductCatalogRequest) => {
      setLoadingItem(true)
      setError(null)
      try {
        await ProductCatalogService.createAsync(values)
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
    async (id: number, values: ProductCatalogRequest) => {
      setLoadingItem(true)
      setError(null)
      try {
        await ProductCatalogService.updateAsync(id, values)
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
        const toggled = await ProductCatalogService.toggleStatusAsync(id)
        
        setProductCatalog(prev =>
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
    setSelectedProductCatalog(null)
    setModalMode('create')
    setModalOpen(true)
  }, [])

  const openEdit = useCallback(
    (id: number) => {
      const cache = productCatalog.find(x => x.id === id) || null
      setSelectedProductCatalog(cache)
      setModalMode('edit')
      setModalOpen(true)
      fetchById(id)
    },
    [productCatalog, fetchById]
  )

  const openView = useCallback(
    (id: number) => {
      const cache = productCatalog.find(x => x.id === id) || null
      setSelectedProductCatalog(cache)
      setModalMode('view')
      setModalOpen(true)
      fetchById(id)
    },
    [productCatalog, fetchById]
  )

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setSelectedProductCatalog(null)
  }, [])

  const handleSubmit = useCallback(
    (values: ProductCatalogRequest) => {
      if (modalMode === 'create') create(values)
      else if (modalMode === 'edit' && selectedProductCatalog) update(selectedProductCatalog.id, values)
      closeModal()
    },
    [modalMode, selectedProductCatalog, create, update, closeModal]
  )

  // Initial load & reload
  useEffect(() => {
    fetchPage()
  }, [fetchPage, globalFilter])

  return {
    productCatalog,
    selectedProductCatalog,
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
    setGlobalFilter
  }
}