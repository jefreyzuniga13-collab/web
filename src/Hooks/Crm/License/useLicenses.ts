/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import type { LicenseProj, LicenseRequest } from '@/Interfaces/Crm/LicenseInterfaz'
import { LicensesService } from '@/Services/Crm/LicensesService'
import type { ModalMode, PagedResponse } from '@/Interfaces/Common/GlobalInterface'
import type { ApiResponse } from '@/Interfaces/Auth/AuthInterface'

const licenseKeys = {
  all: ['license'] as const,
  list: (filter: string, page: number, pageSize: number) =>
    [...licenseKeys.all, 'list', filter, page, pageSize] as const,
  detail: (id: number) => [...licenseKeys.all, 'detail', id] as const,
}


// Api, obtiene la informacion pero o se muestra en la web
const emptyPagedLicense: PagedResponse<LicenseProj> = {
  items: [],
  meta: {
    totalCount: 0,
    page: 1,
    pageSize: 30,
    totalPages: 0,
    currentPage:1
  },
} as PagedResponse<LicenseProj>

const useLicenses = (licenseId?: number) => {
  const queryClient = useQueryClient()

  const [selectedData, setSelectedData] = useState<LicenseProj | null>(null)
  const [modalMode, setModalMode] = useState<ModalMode>('create')
  const [isModalOpen, setModalOpen] = useState(false)
  const [globalFilter, setGlobalFilter] = useState('')
  const [page, setPageState] = useState(1)
  const [pageSize, setPageSizeState] = useState(30)

  const {
    data: pagedLicense = emptyPagedLicense,
    isLoading: loadingList,
    isFetching: fetchingList,
    error: listError,
    refetch: refetchPage,
  } = useQuery<PagedResponse<LicenseProj>, Error>({
    queryKey: licenseKeys.list(globalFilter, page, pageSize),
    queryFn: async () => {
      const response = await LicensesService.getAllAsync(globalFilter, page, pageSize)
      return response ?? emptyPagedLicense
    },
    staleTime: 1000 * 60 * 5,
  })

  const {
    data: detailData,
    isLoading: loadingDetail,
    isFetching: fetchingDetail,
    error: detailError,
  } = useQuery<ApiResponse<LicenseProj | null> | null, Error>({
    queryKey: licenseKeys.detail(licenseId ?? 0),
    queryFn: async () => {
      if (!licenseId || licenseId <= 0) return null
      const response = await LicensesService.getByIdAsync(licenseId)
      return response ?? null
    },
    enabled: typeof licenseId === 'number' && licenseId > 0,
    staleTime: 1000 * 60 * 5,
  })

  const createMutation = useMutation<ApiResponse<LicenseProj>, Error, LicenseRequest>({
    mutationFn: async values => {
      return await LicensesService.createAsync(values as LicenseProj)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: licenseKeys.all })
    },
    onError: err => {
      toast.error(err?.message ?? 'Error al crear la licencia')
    },
  })

  const updateMutation = useMutation<
    ApiResponse<LicenseProj>,
    Error,
    { id: number; values: LicenseRequest }
  >({
    mutationFn: async ({ id, values }) => {
      const payload = {
        ...(selectedData ?? {}),
        ...values,
        id,
      } as LicenseProj

      return await LicensesService.updateAsync(id, payload)
    },
    onSuccess: async (updatedItem, variables) => {
      const licenseData = updatedItem.data ?? null

      queryClient.setQueryData<ApiResponse<LicenseProj | null>>(
        licenseKeys.detail(variables.id),
        {
          ...updatedItem,
          data: licenseData,
        }
      )

      setSelectedData(prev =>
        prev?.id === variables.id ? licenseData : prev
      )

      await queryClient.invalidateQueries({ queryKey: licenseKeys.all })
    },
    onError: err => {
      toast.error(err?.message ?? 'Error al actualizar la licencia')
    },
  })

  const toggleMutation = useMutation<void, Error, number>({
    mutationFn: async id => {
      await LicensesService.toggleAsync(id)
    },
    onSuccess: async (_, id) => {
      queryClient.setQueriesData<PagedResponse<LicenseProj>>(
        { queryKey: licenseKeys.all },
        old => {
          if (!old?.items) return old

          return {
            ...old,
            items: old.items.map(item =>
              item.id === id
                ? { ...item, isActive: !item.isActive }
                : item
            ),
          }
        }
      )

      setSelectedData(prev =>
        prev?.id === id ? { ...prev, isActive: !prev.isActive } : prev
      )

      await queryClient.invalidateQueries({ queryKey: licenseKeys.all })
    },
    onError: err => {
      toast.error(err?.message ?? 'Error al cambiar el estado de la licencia')
    },
  })

  const fetchPage = useCallback(
    async (p = page, s = pageSize) => {
      setPageState(p)
      setPageSizeState(s)

      const result = await queryClient.fetchQuery<PagedResponse<LicenseProj>>({
        queryKey: licenseKeys.list(globalFilter, p, s),
        queryFn: async () => {

          const response = await LicensesService.getAllAsync(globalFilter, p, s)
          return response ?? emptyPagedLicense
        },
        staleTime: 1000 * 60 * 5,
      })

      return result
    },
    [globalFilter, page, pageSize, queryClient]
  )

  const getById = useCallback(
    async (id: number) => {
      try {
        const res = await LicensesService.getByIdAsync(id)

        if (res?.success) {
          setSelectedData(res.data)

          queryClient.setQueryData<ApiResponse<LicenseProj | null>>(
            licenseKeys.detail(id),
            res
          )

          return res.data
        }

        toast.error(res?.message ?? 'No se pudo obtener la licencia')
        return null
      } catch (err: any) {
        toast.error(err?.message ?? 'Error al obtener la licencia')
        return null
      }
    },
    [queryClient]
  )

  const create = useCallback(
    async (values: LicenseRequest) => {
      try {
        return await createMutation.mutateAsync(values)
      } catch {
        return null
      }
    },
    [createMutation]
  )

  const update = useCallback(
    async (id: number, values: LicenseRequest) => {
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

  const openCreate = useCallback(() => {
    setSelectedData(null)
    setModalMode('create')
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((item: LicenseProj) => {
    setSelectedData(item)
    setModalMode('edit')
    setModalOpen(true)
  }, [])

  const openView = useCallback((item: LicenseProj) => {
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
    async (values: LicenseRequest) => {
      let result: ApiResponse<LicenseProj | null> | null = null

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

  useEffect(() => {
    if (typeof licenseId !== 'number' || licenseId <= 0) {
      setSelectedData(null)
      return
    }

    if (detailData?.success) {
      setSelectedData(detailData.data)
    }
  }, [licenseId, detailData])

  const data = useMemo(() => pagedLicense?.items ?? [], [pagedLicense])

  const totalCount = pagedLicense?.meta?.totalCount ?? 0

  const loadingMutations =
    createMutation.isPending ||
    updateMutation.isPending ||
    toggleMutation.isPending

  const loading =
    loadingList ||
    fetchingList ||
    loadingDetail ||
    fetchingDetail ||
    loadingMutations

  const error = useMemo(
    () =>
      createMutation.error ||
      updateMutation.error ||
      toggleMutation.error ||
      detailError ||
      listError ||
      null,
    [
      createMutation.error,
      updateMutation.error,
      toggleMutation.error,
      detailError,
      listError,
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
    refetchPage,

    setPage: (p: number) => {
      setPageState(p)
    },

    setPageSize: (s: number) => {
      setPageSizeState(s)
      setPageState(1)
    },

    setGlobalFilter,
    openCreate,
    openEdit,
    openView,
    closeModal,
    handleSubmit,
    fetchPage,
    create,
    update,
    toggle,
    getById,
  }
}

export default useLicenses