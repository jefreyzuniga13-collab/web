import { useCallback, useEffect, useMemo, useState } from 'react'
import { CompanySystemParamsService } from '@/Services/Crm/CompanySystemParamsService'
import { CompanyService } from '@/Services/Crm/CompanyService'
import { SystemParamService } from '@/Services/Crm/SystemParamService'
import type { CompanyInterface } from '@/Interfaces/Crm/CompanyInterface'
import type { SystemParamResponseDto } from '@/Interfaces/Auth/AuthInterface'
import type {
  CompanySystemParamProj,
  CompanySystemParamRequest,
} from '@/Interfaces/Crm/CompanySystemParams'

export function useCompanySystemParams() {
  const [items, setItems] = useState<CompanySystemParamProj[]>([])
  const [companies, setCompanies] = useState<CompanyInterface[]>([])
  const [systemParams, setSystemParams] = useState<SystemParamResponseDto[]>([])
  const [selectedItem, setSelectedItem] = useState<CompanySystemParamProj | null>(null)

  const [page, setPageState] = useState(1)
  const [pageSize, setPageSizeState] = useState(20)
  const [totalCount, setTotalCount] = useState(0)

  const [globalFilter, setGlobalFilterState] = useState('')
  const [companyId, setCompanyIdState] = useState<number | null>(null)

  const [loadingList, setLoadingList] = useState(false)
  const [loadingCatalogs, setLoadingCatalogs] = useState(false)
  const [loadingItem, setLoadingItem] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [isModalOpen, setModalOpen] = useState(false)

  const loading = useMemo(
    () => loadingList || loadingCatalogs || loadingItem,
    [loadingList, loadingCatalogs, loadingItem]
  )

  const loadCatalogs = useCallback(async () => {
    setLoadingCatalogs(true)
    setError(null)

    try {
      const [companiesData, paramsData] = await Promise.all([
        CompanyService.getAllAsync(),
        SystemParamService.getAllAsync('', 1, 500),
      ])

      setCompanies(companiesData ?? [])
      setSystemParams(paramsData?.items ?? [])
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoadingCatalogs(false)
    }
  }, [])

  const fetchPage = useCallback(
    async (
      p: number,
      s: number,
      filter: string,
      cId: number | null
    ) => {
      setLoadingList(true)
      setError(null)

      try {
        const resp = await CompanySystemParamsService.getAllAsync(
          filter,
          p,
          s,
          cId
        )

        setItems(resp?.items ?? [])
        setTotalCount(resp?.meta?.totalCount ?? 0)
        setPageState(resp?.meta?.currentPage ?? p)
        setPageSizeState(resp?.meta?.pageSize ?? s)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoadingList(false)
      }
    },
    []
  )

  const create = useCallback(
    async (values: CompanySystemParamRequest) => {
      setLoadingItem(true)
      setError(null)

      try {
        await CompanySystemParamsService.createAsync(values)
        await fetchPage(page, pageSize, globalFilter, companyId)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoadingItem(false)
      }
    },
    [fetchPage, page, pageSize, globalFilter, companyId]
  )

  const update = useCallback(
    async (values: CompanySystemParamRequest) => {
      setLoadingItem(true)
      setError(null)

      try {
        await CompanySystemParamsService.updateAsync(values)
        await fetchPage(page, pageSize, globalFilter, companyId)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoadingItem(false)
      }
    },
    [fetchPage, page, pageSize, globalFilter, companyId]
  )

  const toggle = useCallback(
    async (row: CompanySystemParamProj) => {
      setLoadingItem(true)
      setError(null)

      try {
        const resp = await CompanySystemParamsService.toggleAsync(
          row.companyId,
          row.systemParamId,
          row.metaChannelId
        )

        const updated = resp.data

        setItems(prev =>
          prev.map(item =>
            item.companyId === updated.companyId &&
            item.systemParamId === updated.systemParamId &&
            item.metaChannelId === updated.metaChannelId
              ? updated
              : item
          )
        )
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoadingItem(false)
      }
    },
    []
  )

  const openCreate = useCallback(() => {
    setSelectedItem(null)
    setModalMode('create')
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((row: CompanySystemParamProj) => {
    setSelectedItem(row)
    setModalMode('edit')
    setModalOpen(true)
  }, [])

  const openView = useCallback((row: CompanySystemParamProj) => {
    setSelectedItem(row)
    setModalMode('view')
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setSelectedItem(null)
    setModalMode('create')
  }, [])

  const handleSubmit = useCallback(
    async (values: CompanySystemParamRequest) => {
      if (modalMode === 'create') {
        await create(values)
      }

      if (modalMode === 'edit') {
        await update(values)
      }

      closeModal()
    },
    [modalMode, create, update, closeModal]
  )

  const setPage = useCallback((p: number) => {
    setPageState(p)
  }, [])

  const setPageSize = useCallback((s: number) => {
    setPageSizeState(s)
    setPageState(1)
  }, [])

  const setGlobalFilter = useCallback((value: string) => {
    setGlobalFilterState(value)
    setPageState(1)
  }, [])

  const setCompanyId = useCallback((value: number | null) => {
    setCompanyIdState(value)
    setPageState(1)
  }, [])

  useEffect(() => {
    loadCatalogs()
  }, [loadCatalogs])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      fetchPage(page, pageSize, globalFilter, companyId)
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [page, pageSize, globalFilter, companyId, fetchPage])

  return {
    items,
    companies,
    systemParams,
    selectedItem,

    loading,
    error,

    page,
    pageSize,
    totalCount,

    globalFilter,
    companyId,

    modalMode,
    isModalOpen,

    setPage,
    setPageSize,
    setGlobalFilter,
    setCompanyId,

    fetchPage,

    openCreate,
    openEdit,
    openView,
    closeModal,
    handleSubmit,
    toggle,
  }
}