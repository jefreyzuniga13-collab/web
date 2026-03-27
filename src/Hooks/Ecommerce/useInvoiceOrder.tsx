import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  Currencyto,
  InvoiceOrderInterface,
  InvoiceOrderRequestDto,
  NearestBranchRequestDto,
  NearestBranchResponseDto,
  PrintOrdenFactInterfaceRaw,
} from '@/Interfaces/Ecommerce/InvoiceOrderInterface'
import { InvoiceOrderService } from '@/Services/Ecommerce/InvoiceOrderService'
import { toast } from 'react-toastify'
import type { FacturaTempo } from '@/Interfaces/Ecommerce/FacturaTempo'

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

const invoiceOrderKeys = {
  all: ['invoice-order'] as const,
  latest: (id: number) => [...invoiceOrderKeys.all, 'latest', id] as const,
  nearestBranch: (req: NearestBranchRequestDto) =>
    [...invoiceOrderKeys.all, 'nearest-branch', JSON.stringify(req)] as const,
  transportationCost: (req: number) =>
    [...invoiceOrderKeys.all, 'transportation-cost', req] as const,
  currency: () => [...invoiceOrderKeys.all, 'currency'] as const,
  printDetFac: (req: string) => [...invoiceOrderKeys.all, 'print-det-fac', req] as const,
}

const useInvoiceOrder = () => {
  const queryClient = useQueryClient()

  const [invoiceOrders, setInvoiceOrders] = useState<InvoiceOrderRequestDto | null>(null)
  const [invoiceOrder, setInvoiceOrder] = useState<InvoiceOrderInterface | null>(null)
  const [nearestBranch, setNearestBranch] = useState<NearestBranchResponseDto | null>(null)
  const [transportationCost, setTransportationCost] = useState<number>(0)
  const [printOrdenFac, setPrintOrdenFac] = useState<PrintOrdenFactInterfaceRaw | null>(null)

  const {
    data: currency = [],
    isLoading: loadingCurrency,
    isFetching: fetchingCurrency,
    error: currencyError,
  } = useQuery<Currencyto[], Error>({
    queryKey: invoiceOrderKeys.currency(),
    queryFn: async () => {
      const res: ApiResponse<Currencyto[]> = await InvoiceOrderService.GetCurrency()
      if (!res.success) {
        toast.error(res.message)
        return []
      }
      return res.data ?? []
    },
    staleTime: 1000 * 60 * 30,
  })

  const createMutation = useMutation<
    ApiResponse<unknown>,
    Error,
    InvoiceOrderRequestDto
  >({
    mutationFn: req => InvoiceOrderService.Create(req),
    onSuccess: async (res, req) => {
      if (!res.success) {
        toast.error(res.message)
        return
      }
      setInvoiceOrders(req)
      await queryClient.invalidateQueries({ queryKey: invoiceOrderKeys.all })
    },
  })

  const insertaFacturaMutation = useMutation<
    ApiResponse<unknown>,
    Error,
    FacturaTempo
  >({
    mutationFn: req => InvoiceOrderService.CreatePCG(req),
    onSuccess: async res => {
      if (!res.success) {
        toast.error(res.message)
        return
      }
      await queryClient.invalidateQueries({ queryKey: invoiceOrderKeys.all })
    },
  })

  const latestMutation = useMutation<
    InvoiceOrderInterface | null,
    Error,
    number
  >({
    mutationFn: async req => {
      const res: ApiResponse<InvoiceOrderInterface> =
        await InvoiceOrderService.GetLastest(req)

      if (!res.success) {
        toast.error(res.message)
        return null
      }

      return res.data ?? null
    },
    onSuccess: (data, req) => {
      setInvoiceOrder(data)
      queryClient.setQueryData(invoiceOrderKeys.latest(req), data)
    },
  })

  const nearestBranchMutation = useMutation<
    NearestBranchResponseDto | null,
    Error,
    NearestBranchRequestDto
  >({
    mutationFn: async req => {
      const res: ApiResponse<NearestBranchResponseDto> =
        await InvoiceOrderService.GetNearestBranch(req)

      if (!res.success) {
        toast.error(res.message)
        return null
      }

      return res.data ?? null
    },
    onSuccess: (data, req) => {
      setNearestBranch(data)
      queryClient.setQueryData(invoiceOrderKeys.nearestBranch(req), data)
    },
  })

  const transportationCostMutation = useMutation<number | null, Error, number>({
    mutationFn: async req => {
      const res: ApiResponse<number> =
        await InvoiceOrderService.GetTransportationCost(req)

      if (!res.success) {
        toast.error(res.message)
        return null
      }

      return res.data ?? 0
    },
    onSuccess: (data, req) => {
      const cost = data ?? 0
      setTransportationCost(cost)
      queryClient.setQueryData(invoiceOrderKeys.transportationCost(req), cost)
    },
  })

  const printDetFacMutation = useMutation<
    PrintOrdenFactInterfaceRaw | null,
    Error,
    string
  >({
    // mutationFn: async req => {
    //   const res: ApiResponse<PrintOrdenFactInterfaceRaw> =
    //     await InvoiceOrderService.PrintDetFac(req)

    //   if (!res.success) {
    //     toast.error(res.message)
    //     return null
    //   }

    //   return res.data ?? null
    // },
    // onSuccess: (data, req) => {
    //   setPrintOrdenFac(data)
    //   queryClient.setQueryData(invoiceOrderKeys.printDetFac(req), data)
    // },
  })

  const CreateAsync = useCallback(
    (req: InvoiceOrderRequestDto) => createMutation.mutateAsync(req),
    [createMutation]
  )

  const InsertaFacturaAsync = useCallback(
    (req: FacturaTempo) => insertaFacturaMutation.mutateAsync(req),
    [insertaFacturaMutation]
  )

  const GetLastestAsync = useCallback(
    (req: number) => latestMutation.mutateAsync(req),
    [latestMutation]
  )

  const GetNearestBranchAsync = useCallback(
    (req: NearestBranchRequestDto) =>
      nearestBranchMutation.mutateAsync(req),
    [nearestBranchMutation]
  )

  const GetTransportationCostAsync = useCallback(
    (req: number) => transportationCostMutation.mutateAsync(req),
    [transportationCostMutation]
  )

  const GetCurrencyAsync = useCallback(async () => {
    return await queryClient.fetchQuery({
      queryKey: invoiceOrderKeys.currency(),
      queryFn: async () => {
        const res: ApiResponse<Currencyto[]> =
          await InvoiceOrderService.GetCurrency()

        if (!res.success) {
          toast.error(res.message)
          return []
        }

        return res.data ?? []
      },
    })
  }, [queryClient])

  const PrintDetFacAsync = useCallback(
    (req: string) => printDetFacMutation.mutateAsync(req),
    [printDetFacMutation]
  )

  const loadingInvoice =
    createMutation.isPending || insertaFacturaMutation.isPending

  const loading =
    loadingCurrency ||
    fetchingCurrency ||
    latestMutation.isPending ||
    nearestBranchMutation.isPending ||
    transportationCostMutation.isPending ||
    printDetFacMutation.isPending

  const error = useMemo(
    () =>
      currencyError ||
      createMutation.error ||
      insertaFacturaMutation.error ||
      latestMutation.error ||
      nearestBranchMutation.error ||
      transportationCostMutation.error ||
      printDetFacMutation.error ||
      null,
    [
      currencyError,
      createMutation.error,
      insertaFacturaMutation.error,
      latestMutation.error,
      nearestBranchMutation.error,
      transportationCostMutation.error,
      printDetFacMutation.error,
    ]
  )

  return {
    invoiceOrders,
    invoiceOrder,
    nearestBranch,
    transportationCost,
    currency,
    loading,
    error,
    CreateAsync,
    GetLastestAsync,
    GetNearestBranchAsync,
    GetTransportationCostAsync,
    GetCurrencyAsync,
    PrintDetFacAsync,
    printOrdenFac,
    setPrintOrdenFac,
    loadingInvoice,
    InsertaFacturaAsync,
  }
}

export default useInvoiceOrder