import { useCallback, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-toastify"

import type {
  Currencyto,
  InvoiceOrderInterface,
  InvoiceOrderRequestDto,
  PrintOrdenFactInterfaceRaw
} from "@/Interfaces/Ecommerce/InvoiceOrderInterface"

import type { FacturaTempo } from "@/Interfaces/Ecommerce/FacturaTempo"

import type {
  NearestBranchRequestDto,
  NearestBranchResponseDto
} from "@/Interfaces/Ecommerce/BranchInterfaces"

import { InvoiceOrderService } from "@/Services/Ecommerce/InvoiceOrderService"

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

const invoiceOrderKeys = {
  all: ["invoice-order"] as const,

  latest: (id: number) =>
    [...invoiceOrderKeys.all, "latest", id] as const,

  nearestBranch: (req: NearestBranchRequestDto) =>
    [...invoiceOrderKeys.all, "nearest-branch", JSON.stringify(req)] as const,

  transportationCost: (distanceKm: number) =>
    [...invoiceOrderKeys.all, "transportation-cost", distanceKm] as const,

  currency: () =>
    [...invoiceOrderKeys.all, "currency"] as const,

  printDetFac: (
    codSucursal: string,
    fecha: string,
    consecutivo: number,
    tipoServicio: number
  ) =>
    [
      ...invoiceOrderKeys.all,
      "print-det-fac",
      codSucursal,
      fecha,
      consecutivo,
      tipoServicio
    ] as const
}

type PrintDetFacParams = {
  codSucursal: string
  fecha: string
  consecutivo: number
  tipoServicio: number
}

const useInvoiceOrder = () => {
  const queryClient = useQueryClient()

  const [invoiceOrders, setInvoiceOrders] =
    useState<InvoiceOrderRequestDto | null>(null)

  const [invoiceOrder, setInvoiceOrder] =
    useState<InvoiceOrderInterface | null>(null)

  const [nearestBranch, setNearestBranch] =
    useState<NearestBranchResponseDto | null>(null)

  const [transportationCost, setTransportationCost] = useState<number>(0)

  const [printOrdenFac, setPrintOrdenFac] =
    useState<PrintOrdenFactInterfaceRaw | null>(null)

  /**
   * Carga las formas de pago disponibles.
   */
  const {
    data: currency = [],
    isLoading: loadingCurrency,
    isFetching: fetchingCurrency,
    error: currencyError
  } = useQuery<Currencyto[], Error>({
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
    staleTime: 1000 * 60 * 30
  })

  /**
   * Crea una orden de factura.
   */
  const createMutation = useMutation<
    ApiResponse<unknown>,
    Error,
    InvoiceOrderRequestDto
  >({
    mutationFn: (req) => InvoiceOrderService.Create(req),
   retry: 0,
    onSuccess: async (res, req) => {
      if (!res.success) {
        toast.error(res.message)
        return
      }

      setInvoiceOrders(req)

      await queryClient.invalidateQueries({
        queryKey: invoiceOrderKeys.all
      })
    }
  })

  /**
   * Inserta la factura PCG final.
   */
  const insertaFacturaMutation = useMutation<
    ApiResponse<unknown>,
    Error,
    FacturaTempo
  >({
    mutationFn: (req) => InvoiceOrderService.CreatePCG(req),
    retry: 0,
    onSuccess: async (res) => {
      if (!res.success) {
        toast.error(res.message)
        return
      }

      await queryClient.invalidateQueries({
        queryKey: invoiceOrderKeys.all
      })
    }
  })

  /**
   * Obtiene la última orden por id de usuario o referencia.
   */
  const latestMutation = useMutation<
    InvoiceOrderInterface | null,
    Error,
    number
  >({
    mutationFn: async (req) => {
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

      queryClient.setQueryData(
        invoiceOrderKeys.latest(req),
        data
      )
    }
  })

  /**
   * Obtiene la sucursal más cercana a una ubicación.
   */
  const nearestBranchMutation = useMutation<
    NearestBranchResponseDto | null,
    Error,
    NearestBranchRequestDto
  >({
    mutationFn: async (req) => {
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

      queryClient.setQueryData(
        invoiceOrderKeys.nearestBranch(req),
        data
      )
    }
  })

  /**
   * Obtiene costo de transporte según distancia.
   */
  const transportationCostMutation = useMutation<
    number | null,
    Error,
    number
  >({
    mutationFn: async (distanceKm) => {
      const res: ApiResponse<number> =
        await InvoiceOrderService.GetTransportationCost(distanceKm)

      if (!res.success) {
        toast.error(res.message)
        return null
      }

      return res.data ?? 0
    },
    onSuccess: (data, distanceKm) => {
      const cost = data ?? 0

      setTransportationCost(cost)

      queryClient.setQueryData(
        invoiceOrderKeys.transportationCost(distanceKm),
        cost
      )
    }
  })

  /**
   * Imprime u obtiene el detalle de factura para generar PDF.
   */
  const printDetFacMutation = useMutation<
    PrintOrdenFactInterfaceRaw | null,
    Error,
    PrintDetFacParams
  >({
    mutationFn: async (req) => {
      const res = await InvoiceOrderService.PrintDetFac(
        req.codSucursal,
        req.fecha,
        req.consecutivo,
        req.tipoServicio
      )

      if (!res?.success) {
        toast.error(res?.message ?? "No se pudo obtener el detalle de factura")
        return null
      }

      return res.data ?? null
    },
    onSuccess: (data, req) => {
      setPrintOrdenFac(data)

      queryClient.setQueryData(
        invoiceOrderKeys.printDetFac(
          req.codSucursal,
          req.fecha,
          req.consecutivo,
          req.tipoServicio
        ),
        data
      )
    }
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
    (distanceKm: number) =>
      transportationCostMutation.mutateAsync(distanceKm),
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
      staleTime: 1000 * 60 * 30
    })
  }, [queryClient])

  const PrintDetFacAsync = useCallback(
    (req: PrintDetFacParams) =>
      printDetFacMutation.mutateAsync(req),
    [printDetFacMutation]
  )

  const loadingInvoice =
    createMutation.isPending ||
    insertaFacturaMutation.isPending

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
      printDetFacMutation.error
    ]
  )

  return {
    invoiceOrders,
    invoiceOrder,

    nearestBranch,
    transportationCost,

    currency,
    printOrdenFac,

    loading,
    loadingInvoice,
    error,

    CreateAsync,
    InsertaFacturaAsync,
    GetLastestAsync,
    GetNearestBranchAsync,
    GetTransportationCostAsync,
    GetCurrencyAsync,
    PrintDetFacAsync,

    setPrintOrdenFac
  }
}

export default useInvoiceOrder