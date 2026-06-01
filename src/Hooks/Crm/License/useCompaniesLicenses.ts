/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import type { ApiResponse } from '@/Interfaces/Auth/AuthInterface'
import type { ModalMode, PagedResponse } from '@/Interfaces/Common/GlobalInterface'
import type { CompaniesLicenseProj, CompaniesLicenseRequest } from '@/Interfaces/Crm/LicenseInterfaz'
import { CompaniesLicensesService } from '@/Services/Crm/CompaniesLicensesService'

const companiesLicenseKeys = {
  all: ['companies-license'] as const,
  list: (
    filter: string,
    page: number,
    pageSize: number,
    companyId?: number | null,
    licenseId?: number | null
  ) => [...companiesLicenseKeys.all, 'list', filter, page, pageSize, companyId ?? null, licenseId ?? null] as const,
  detail: (id: number) => [...companiesLicenseKeys.all, 'detail', id] as const
}

const emptyPagedCompaniesLicense: PagedResponse<CompaniesLicenseProj> = {
  items: [],
  meta: {
    totalCount: 0,
    page: 1,
    pageSize: 30,
    totalPages: 0,
    currentPage: 1
  }
} as PagedResponse<CompaniesLicenseProj>

const useCompaniesLicenses = () => {
  const queryClient = useQueryClient()

  const [selectedData, setSelectedData] = useState<CompaniesLicenseProj | null>(null)
  const [modalMode, setModalMode] = useState<ModalMode>('create')
  const [isModalOpen, setModalOpen] = useState(false)
  const [globalFilter, setGlobalFilter] = useState('')
  const [companyId, setCompanyId] = useState<number | null>(null)
  const [licenseId, setLicenseId] = useState<number | null>(null)
  const [page, setPageState] = useState(1)
  const [pageSize, setPageSizeState] = useState(30)

  const {
    data: pagedCompaniesLicense = emptyPagedCompaniesLicense,
    isLoading: loadingList,
    isFetching: fetchingList,
    error: listError
  } = useQuery<PagedResponse<CompaniesLicenseProj>, Error>({
    queryKey: companiesLicenseKeys.list(globalFilter, page, pageSize, companyId, licenseId),
    queryFn: async () => {
      const response = await CompaniesLicensesService.getAllAsync(
        globalFilter,
        page,
        pageSize,
        companyId,
        licenseId
      )

      return response ?? emptyPagedCompaniesLicense
    },
    staleTime: 1000 * 60 * 5
  })

  const createMutation = useMutation<ApiResponse<CompaniesLicenseProj>, Error, CompaniesLicenseRequest>({
    mutationFn: async values => {
      return await CompaniesLicensesService.createAsync(values)
    },
    onSuccess: async res => {
      toast.success(res?.message ?? 'Licencia asignada correctamente')
      await queryClient.invalidateQueries({ queryKey: companiesLicenseKeys.all })
    },
    onError: err => {
      toast.error(err?.message ?? 'Error al asignar la licencia')
    }
  })

  const updateMutation = useMutation<
    ApiResponse<CompaniesLicenseProj>,
    Error,
    { id: number; values: CompaniesLicenseRequest }
  >({
    mutationFn: async ({ id, values }) => {
      return await CompaniesLicensesService.updateAsync(id, values)
    },
    onSuccess: async res => {
      toast.success(res?.message ?? 'Licencia actualizada correctamente')
      await queryClient.invalidateQueries({ queryKey: companiesLicenseKeys.all })
    },
    onError: err => {
      toast.error(err?.message ?? 'Error al actualizar la licencia')
    }
  })

  const toggleMutation = useMutation<ApiResponse<CompaniesLicenseProj>, Error, number>({
    mutationFn: async id => {
      return await CompaniesLicensesService.toggleAsync(id)
    },
    onSuccess: async (_, id) => {
      queryClient.setQueriesData<PagedResponse<CompaniesLicenseProj>>(
        { queryKey: companiesLicenseKeys.all },
        old => {
          if (!old?.items) return old

          return {
            ...old,
            items: old.items.map(item =>
              item.id === id ? { ...item, isActive: !item.isActive } : item
            )
          }
        }
      )

      await queryClient.invalidateQueries({ queryKey: companiesLicenseKeys.all })
    },
    onError: err => {
      toast.error(err?.message ?? 'Error al cambiar el estado')
    }
  })

  const lockedMutation = useMutation<ApiResponse<CompaniesLicenseProj>, Error, number>({
    mutationFn: async id => {
      return await CompaniesLicensesService.toogleLockedAsync(id)
    },
    onSuccess: async (_, id) => {
      queryClient.setQueriesData<PagedResponse<CompaniesLicenseProj>>(
        { queryKey: companiesLicenseKeys.all },
        old => {
          if (!old?.items) return old

          return {
            ...old,
            items: old.items.map(item =>
              item.id === id ? { ...item, isLocked: !item.isLocked } : item
            )
          }
        }
      )

      await queryClient.invalidateQueries({ queryKey: companiesLicenseKeys.all })
    },
    onError: err => {
      toast.error(err?.message ?? 'Error al bloquear o desbloquear')
    }
  })

  const suspendMutation = useMutation<ApiResponse<CompaniesLicenseProj>, Error, number>({
    mutationFn: async id => {
      return await CompaniesLicensesService.toogleSuspendAsync(id)
    },
    onSuccess: async (_, id) => {
      queryClient.setQueriesData<PagedResponse<CompaniesLicenseProj>>(
        { queryKey: companiesLicenseKeys.all },
        old => {
          if (!old?.items) return old

          return {
            ...old,
            items: old.items.map(item =>
              item.id === id ? { ...item, isSuspended: !item.isSuspended } : item
            )
          }
        }
      )

      await queryClient.invalidateQueries({ queryKey: companiesLicenseKeys.all })
    },
    onError: err => {
      toast.error(err?.message ?? 'Error al suspender o reactivar')
    }
  })

  const getById = useCallback(
    async (id: number) => {
      try {
        const data = await CompaniesLicensesService.getByIdAsync(id)

        if (data) {
          setSelectedData(data)
          queryClient.setQueryData(companiesLicenseKeys.detail(id), data)
          return data
        }

        toast.error('No se pudo obtener la relación')
        return null
      } catch (err: any) {
        toast.error(err?.message ?? 'Error al obtener la relación')
        return null
      }
    },
    [queryClient]
  )

  const create = useCallback(
    async (values: CompaniesLicenseRequest) => {
      try {
        return await createMutation.mutateAsync(values)
      } catch {
        return null
      }
    },
    [createMutation]
  )

  const update = useCallback(
    async (id: number, values: CompaniesLicenseRequest) => {
      try {
        return await updateMutation.mutateAsync({ id, values })
      } catch {
        return null
      }
    },
    [updateMutation]
  )

  const toggle = useCallback(
    async (id: number) => {
      try {
        await toggleMutation.mutateAsync(id)
        return true
      } catch {
        return false
      }
    },
    [toggleMutation]
  )

  const toggleLocked = useCallback(
    async (id: number) => {
      try {
        await lockedMutation.mutateAsync(id)
        return true
      } catch {
        return false
      }
    },
    [lockedMutation]
  )

  const toggleSuspend = useCallback(
    async (id: number) => {
      try {
        await suspendMutation.mutateAsync(id)
        return true
      } catch {
        return false
      }
    },
    [suspendMutation]
  )

  const openCreate = useCallback(() => {
    setSelectedData(null)
    setModalMode('create')
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((item: CompaniesLicenseProj) => {
    setSelectedData(item)
    setModalMode('edit')
    setModalOpen(true)
  }, [])

  const openView = useCallback((item: CompaniesLicenseProj) => {
    setSelectedData(item)
    setModalMode('view')
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setSelectedData(null)
    setModalMode('create')
  }, [])

  const handleSubmit = useCallback(
    async (values: CompaniesLicenseRequest) => {
      let result: ApiResponse<CompaniesLicenseProj> | null = null

      if (modalMode === 'create') {
        result = await create(values)
      }

      if (modalMode === 'edit' && selectedData?.id) {
        result = await update(selectedData.id, values)
      }

      if (result?.success) {
        closeModal()
      }
    },
    [modalMode, selectedData, create, update, closeModal]
  )

  const data = useMemo(() => pagedCompaniesLicense?.items ?? [], [pagedCompaniesLicense])

  const totalCount = pagedCompaniesLicense?.meta?.totalCount ?? 0

  const loadingMutations =
    createMutation.isPending ||
    updateMutation.isPending ||
    toggleMutation.isPending ||
    lockedMutation.isPending ||
    suspendMutation.isPending

  const loading = loadingList || fetchingList || loadingMutations

  const error = useMemo(
    () =>
      createMutation.error ||
      updateMutation.error ||
      toggleMutation.error ||
      lockedMutation.error ||
      suspendMutation.error ||
      listError ||
      null,
    [
      createMutation.error,
      updateMutation.error,
      toggleMutation.error,
      lockedMutation.error,
      suspendMutation.error,
      listError
    ]
  )

  return {
    data,
    selectedData,
    loading,
    error,
    page,
    pageSize,
    totalCount,
    isModalOpen,
    modalMode,
    globalFilter,
    companyId,
    licenseId,

    setPage: (p: number) => {
      setPageState(p)
    },

    setPageSize: (s: number) => {
      setPageSizeState(s)
      setPageState(1)
    },

    setGlobalFilter: (value: string) => {
      setGlobalFilter(value)
      setPageState(1)
    },

    setCompanyId: (value: number | null) => {
      setCompanyId(value)
      setPageState(1)
    },

    setLicenseId: (value: number | null) => {
      setLicenseId(value)
      setPageState(1)
    },

    openCreate,
    openEdit,
    openView,
    closeModal,
    handleSubmit,
    create,
    update,
    toggle,
    toggleLocked,
    toggleSuspend,
    getById
  }
}

export default useCompaniesLicenses