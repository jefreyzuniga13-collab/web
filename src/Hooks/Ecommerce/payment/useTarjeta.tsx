import { useCallback, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { TarjetaPCGService } from "@/Services/Ecommerce/TarjetaPCGService"
import type { TarjetaModelInterface } from "@/Interfaces/Ecommerce/TarjetaInterface"
import type { ApiPCGResponse } from "@/Interfaces/Common/GlobalPCGInterface"

interface UseTarjetaPCGOptions {
  idUsuario?: number | string | null
  enabled?: boolean
}

export function useTarjetaPCG(options?: UseTarjetaPCGOptions) {
  const queryClient = useQueryClient()

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)

  const idUsuario = useMemo(() => {
    if (options?.idUsuario === null || options?.idUsuario === undefined) return null
    const value = String(options.idUsuario).trim()
    return value || null
  }, [options?.idUsuario])

  const enabledList = (options?.enabled ?? true) && !!idUsuario
  const enabledCard = !!idUsuario && !!selectedCardId

  const tarjetasQuery = useQuery<ApiPCGResponse<TarjetaModelInterface[]>, Error>({
    queryKey: ["tarjetas-pcg", "lista", idUsuario],
    enabled: enabledList,
    queryFn: async () => {
      if (!idUsuario) {
        return {
          success: false,
          message: "IdUsuario requerido",
          data: [],
        }
      }

      return await TarjetaPCGService.GetByUser(idUsuario)
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  })

  const tarjetaQuery = useQuery<ApiPCGResponse<TarjetaModelInterface>, Error>({
    queryKey: ["tarjetas-pcg", "detalle", idUsuario, selectedCardId],
    enabled: enabledCard,
    queryFn: async () => {
      if (!idUsuario || !selectedCardId) {
        return {
          success: false,
          message: "IdUsuario e IdTarjeta requeridos",
          data: {} as TarjetaModelInterface,
        }
      }

      return await TarjetaPCGService.GetByUserAndCard(idUsuario, selectedCardId)
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })

  const crearTarjetaMutation = useMutation<
    ApiPCGResponse<TarjetaModelInterface>,
    Error,
    TarjetaModelInterface
  >({
    mutationFn: async (req) => {
      return await TarjetaPCGService.CreateCard(req)
    },
    onSuccess: async (_, variables) => {
      const userId = String(variables.idUsuario)
      await queryClient.invalidateQueries({
        queryKey: ["tarjetas-pcg", "lista", userId],
      })
    },
  })

  const eliminarTarjetaMutation = useMutation<
    ApiPCGResponse<TarjetaModelInterface>,
    Error,
    { idUsuario: string; idTarjeta: string }
  >({
    mutationFn: async ({ idUsuario, idTarjeta }) => {
      return await TarjetaPCGService.DeleteCard(idUsuario, idTarjeta)
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["tarjetas-pcg", "lista", variables.idUsuario],
      })

      await queryClient.invalidateQueries({
        queryKey: ["tarjetas-pcg", "detalle", variables.idUsuario, variables.idTarjeta],
      })

      if (selectedCardId === variables.idTarjeta) {
        setSelectedCardId(null)
      }
    },
  })

  const tarjetas = useMemo<TarjetaModelInterface[]>(() => {
    return tarjetasQuery.data?.data ?? []
  }, [tarjetasQuery.data])

  const tarjetaSeleccionada = useMemo<TarjetaModelInterface | null>(() => {
    return tarjetaQuery.data?.data ?? null
  }, [tarjetaQuery.data])

  const tarjetaPorDefecto = useMemo<TarjetaModelInterface | null>(() => {
    return tarjetas.find((x) => x.porDefecto) ?? null
  }, [tarjetas])

  const loadingTarjetas = useMemo(() => {
    return tarjetasQuery.isPending || tarjetasQuery.isFetching
  }, [tarjetasQuery.isPending, tarjetasQuery.isFetching])

  const loadingTarjeta = useMemo(() => {
    return tarjetaQuery.isPending || tarjetaQuery.isFetching
  }, [tarjetaQuery.isPending, tarjetaQuery.isFetching])

  const creatingCard = crearTarjetaMutation.isPending
  const deletingCard = eliminarTarjetaMutation.isPending

  const error = useMemo(() => {
    return (
      tarjetasQuery.error ??
      tarjetaQuery.error ??
      crearTarjetaMutation.error ??
      eliminarTarjetaMutation.error ??
      null
    )
  }, [
    tarjetasQuery.error,
    tarjetaQuery.error,
    crearTarjetaMutation.error,
    eliminarTarjetaMutation.error,
  ])

  const GetByUser = useCallback(async (usuarioId?: string | number | null) => {
    const userId = String(usuarioId ?? idUsuario ?? "").trim()
    if (!userId) return []

    const response = await queryClient.fetchQuery<ApiPCGResponse<TarjetaModelInterface[]>>({
      queryKey: ["tarjetas-pcg", "lista", userId],
      queryFn: async () => {
        return await TarjetaPCGService.GetByUser(userId)
      },
      staleTime: 1000 * 60 * 5,
    })

    return response.data ?? []
  }, [idUsuario, queryClient])

  const GetByUserAndCard = useCallback(async (usuarioId: string | number, tarjetaId: string | number) => {
    const userId = String(usuarioId ?? "").trim()
    const cardId = String(tarjetaId ?? "").trim()

    if (!userId || !cardId) return null

    setSelectedCardId(cardId)

    const response = await queryClient.fetchQuery<ApiPCGResponse<TarjetaModelInterface>>({
      queryKey: ["tarjetas-pcg", "detalle", userId, cardId],
      queryFn: async () => {
        return await TarjetaPCGService.GetByUserAndCard(userId, cardId)
      },
      staleTime: 1000 * 60 * 5,
    })

    return response.data ?? null
  }, [queryClient])

  const CreateCard = useCallback(async (req: TarjetaModelInterface) => {
    const response = await crearTarjetaMutation.mutateAsync(req)
    return response.data
  }, [crearTarjetaMutation])

  const DeleteCard = useCallback(async (usuarioId: string | number, tarjetaId: string | number) => {
    const userId = String(usuarioId ?? "").trim()
    const cardId = String(tarjetaId ?? "").trim()

    if (!userId || !cardId) return null

    const response = await eliminarTarjetaMutation.mutateAsync({
      idUsuario: userId,
      idTarjeta: cardId,
    })

    return response.data
  }, [eliminarTarjetaMutation])

  const setSelectedCard = useCallback((tarjetaId: string | number | null) => {
    const value = String(tarjetaId ?? "").trim()
    setSelectedCardId(value || null)
  }, [])

  const clearSelectedCard = useCallback(() => {
    setSelectedCardId(null)
  }, [])

  const refetchTarjetas = useCallback(async () => {
    if (!idUsuario) return null
    return await tarjetasQuery.refetch()
  }, [idUsuario, tarjetasQuery])

  const refetchTarjeta = useCallback(async () => {
    if (!idUsuario || !selectedCardId) return null
    return await tarjetaQuery.refetch()
  }, [idUsuario, selectedCardId, tarjetaQuery])

  return {
    tarjetas,
    tarjetaSeleccionada,
    tarjetaPorDefecto,

    loadingTarjetas,
    loadingTarjeta,
    creatingCard,
    deletingCard,
    error,

    selectedCardId,
    setSelectedCard,
    clearSelectedCard,

    GetByUser,
    GetByUserAndCard,
    CreateCard,
    DeleteCard,

    refetchTarjetas,
    refetchTarjeta,

    successList: tarjetasQuery.data?.success ?? false,
    messageList: tarjetasQuery.data?.message ?? "",
    successCard: tarjetaQuery.data?.success ?? false,
    messageCard: tarjetaQuery.data?.message ?? "",
  }
}