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

export type MetaChannelOption = {
  id: number
  name: string
}

const metaChannels: MetaChannelOption[] = [
  { id: 1, name: 'WhatsApp' },
  { id: 2, name: 'Messenger' },
  { id: 3, name: 'Instagram' },
]

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
  const [systemParamId, setSystemParamIdState] = useState<number | null>(null)
  const [metaChannelId, setMetaChannelIdState] = useState<number | null>(null)

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
      setSystemParams(paramsData.items ?? [])
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoadingCatalogs(false)
    }
  }, [])

  const fetchPage = useCallback(
    async (
      p = page,
      s = pageSize,
      filter = globalFilter,
      cId = companyId,
      spId = systemParamId,
      chId = metaChannelId
    ) => {
      setLoadingList(true)
      setError(null)

      try {
        const resp = await CompanySystemParamsService.getAllAsync(
          filter,
          p,
          s,
          cId,
          spId,
          chId
        )
        setItems(resp.items)
        setTotalCount(resp.meta?.totalCount)
        setPageState(resp.meta?.currentPage ?? p)
        setPageSizeState(resp.meta?.pageSize ?? s)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoadingList(false)
      }
    },
    [page, pageSize, globalFilter, companyId, systemParamId, metaChannelId]
  )

  const create = useCallback(
    async (values: CompanySystemParamRequest) => {
      setLoadingItem(true)
      setError(null)

      try {
        await CompanySystemParamsService.createAsync(values)
        await fetchPage()
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoadingItem(false)
      }
    },
    [fetchPage]
  )

  const update = useCallback(
    async (values: CompanySystemParamRequest) => {
      setLoadingItem(true)
      setError(null)

      try {
        await CompanySystemParamsService.updateAsync(values)
        await fetchPage()
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoadingItem(false)
      }
    },
    [fetchPage]
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

        setItems((prev) =>
          prev.map((item) =>
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

  const setPage = useCallback(
    (p: number) => {
      fetchPage(p, pageSize)
    },
    [fetchPage, pageSize]
  )

  const setPageSize = useCallback(
    (s: number) => {
      fetchPage(1, s)
    },
    [fetchPage]
  )

  const setGlobalFilter = useCallback((value: string) => {
    setGlobalFilterState(value)
    setPageState(1)
  }, [])

  const setCompanyId = useCallback((value: number | null) => {
    setCompanyIdState(value)
    setPageState(1)
  }, [])

  const setSystemParamId = useCallback((value: number | null) => {
    setSystemParamIdState(value)
    setPageState(1)
  }, [])

  const setMetaChannelId = useCallback((value: number | null) => {
    setMetaChannelIdState(value)
    setPageState(1)
  }, [])

  useEffect(() => {
    loadCatalogs()
  }, [loadCatalogs])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      fetchPage(1, pageSize)
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [globalFilter, companyId, systemParamId, metaChannelId, pageSize, fetchPage])

  return {
    items,
    companies,
    systemParams,
    metaChannels,
    selectedItem,
    loading,
    error,
    page,
    pageSize,
    totalCount,
    globalFilter,
    companyId,
    systemParamId,
    metaChannelId,
    modalMode,
    isModalOpen,
    setPage,
    setPageSize,
    setGlobalFilter,
    setCompanyId,
    setSystemParamId,
    setMetaChannelId,
    fetchPage,
    openCreate,
    openEdit,
    openView,
    closeModal,
    handleSubmit,
    toggle,
  }
}