/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import type { ApiResponse } from '@/Interfaces/Auth/AuthInterface'
import type { ModalMode, PagedResponse } from '@/Interfaces/Common/GlobalInterface'
import type {
  CompaniesLicenseProj,
  CompaniesLicenseRequest
} from '@/Interfaces/Crm/LicenseInterfaz'
import type { StatusResponseDto } from '@/Interfaces/Crm/StatusInterface'
import { CompaniesLicensesService } from '@/Services/Crm/CompaniesLicensesService'
import { StatusService } from '@/Services/Crm/StatusService'

const companiesLicenseKeys = {
  all: ['companies-license'] as const,

  list: (
    filter: string,
    page: number,
    pageSize: number,
    companyId?: number | null,
    licenseId?: number | null
  ) =>
    [
      ...companiesLicenseKeys.all,
      'list',
      filter,
      page,
      pageSize,
      companyId ?? null,
      licenseId ?? null
    ] as const,

  detail: (id: number) =>
    [...companiesLicenseKeys.all, 'detail', id] as const,

  statuses: () =>
    [...companiesLicenseKeys.all, 'statuses'] as const
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
  const [globalFilter, setGlobalFilterState] = useState('')
  const [companyId, setCompanyIdState] = useState<number | null>(null)
  const [licenseId, setLicenseIdState] = useState<number | null>(null)
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

  const {
    data: companyLicenseStatuses = [],
    isLoading: loadingStatuses,
    isFetching: fetchingStatuses,
    error: statusesError
  } = useQuery<StatusResponseDto[], Error>({
    queryKey: companiesLicenseKeys.statuses(),
    queryFn: async () => {
      return await StatusService.getCompanyLicenseStatusesAsync()
    },
    staleTime: 1000 * 60 * 10
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

  const changeStatusMutation = useMutation<
    ApiResponse<CompaniesLicenseProj>,
    Error,
    { id: number; statusId: number }
  >({
    mutationFn: async ({ id, statusId }) => {
      return await CompaniesLicensesService.changeStatusAsync(id, statusId)
    },
    onSuccess: async res => {
      toast.success(res?.message ?? 'Estado actualizado correctamente')
      await queryClient.invalidateQueries({ queryKey: companiesLicenseKeys.all })
    },
    onError: err => {
      toast.error(err?.message ?? 'Error al cambiar el estado')
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

  const changeStatus = useCallback(
    async (id: number, statusId: number) => {
      try {
        await changeStatusMutation.mutateAsync({ id, statusId })
        return true
      } catch {
        return false
      }
    },
    [changeStatusMutation]
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

      if (result?.success && result.data?.id && values.statusId > 0) {
        if (result.data.statusId !== values.statusId) {
          await changeStatus(result.data.id, values.statusId)
        }
      }
    }

    if (modalMode === 'edit' && selectedData?.id) {
      result = await update(selectedData.id, values)

      if (result?.success && values.statusId > 0) {
        if (selectedData.statusId !== values.statusId) {
          await changeStatus(selectedData.id, values.statusId)
        }
      }
    }

    if (result?.success) {
      await queryClient.invalidateQueries({ queryKey: companiesLicenseKeys.all })
      closeModal()
    }
  },
  [
    modalMode,
    selectedData,
    create,
    update,
    changeStatus,
    closeModal,
    queryClient
  ]
)

  const data = useMemo(
    () => pagedCompaniesLicense?.items ?? [],
    [pagedCompaniesLicense]
  )

  const totalCount = pagedCompaniesLicense?.meta?.totalCount ?? 0

  const loadingMutations =
    createMutation.isPending ||
    updateMutation.isPending ||
    changeStatusMutation.isPending

  const loading =
    loadingList ||
    fetchingList ||
    loadingStatuses ||
    fetchingStatuses ||
    loadingMutations

  const error = useMemo(
    () =>
      createMutation.error ||
      updateMutation.error ||
      changeStatusMutation.error ||
      statusesError ||
      listError ||
      null,
    [
      createMutation.error,
      updateMutation.error,
      changeStatusMutation.error,
      statusesError,
      listError
    ]
  )

  return {
    data,
    selectedData,
    loading,
    loadingList,
    error,

    page,
    pageSize,
    totalCount,

    isModalOpen,
    modalMode,

    globalFilter,
    companyId,
    licenseId,

    companyLicenseStatuses,

    setPage: (p: number) => {
      setPageState(p)
    },

    setPageSize: (s: number) => {
      setPageSizeState(s)
      setPageState(1)
    },

    setGlobalFilter: (value: string) => {
      setGlobalFilterState(value)
      setPageState(1)
    },

    setCompanyId: (value: number | null) => {
      setCompanyIdState(value)
      setPageState(1)
    },

    setLicenseId: (value: number | null) => {
      setLicenseIdState(value)
      setPageState(1)
    },

    openCreate,
    openEdit,
    openView,
    closeModal,

    handleSubmit,

    create,
    update,
    changeStatus,
    getById
  }
}

export default useCompaniesLicenses