import { useCallback, useMemo, useState } from "react"
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import type {
  ProductoModificadorPCGInterface,
  ProductoPCGInterface,
} from "@/Interfaces/Chat/ProductPCGInterface"
import { ProductPCGService } from "@/Services/Ecommerce/ProductPCGService"

type Mode = "idle" | "category" | "search" | "all" | "code"

interface UseProductPCGOptions {
  initialPageSize?: number
}

const normalizarTexto = (value: string | null | undefined) => {
  return String(value ?? "").trim()
}

export function useProductPCG(options?: UseProductPCGOptions) {
  const queryClient = useQueryClient()
  const initialPageSize = options?.initialPageSize ?? 50

  const [pageSize, setPageSize] = useState<number>(initialPageSize)
  const [mode, setMode] = useState<Mode>("idle")
  const [lastCategory, setLastCategory] = useState<string | null>(null)
  const [lastSearch, setLastSearch] = useState<string | null>(null)
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [modifierCode, setModifierCode] = useState<string | null>(null)
  const [codPrecio, setCodPrecioState] = useState<string>("")

  const listEnabled =
    mode === "category" ||
    mode === "search" ||
    mode === "all"

  const normalizedCodPrecio = useMemo(() => {
    return normalizarTexto(codPrecio)
  }, [codPrecio])

  const setCodPrecio = useCallback((value: string | null | undefined) => {
    setCodPrecioState(normalizarTexto(value))
  }, [])

  const listQuery = useInfiniteQuery<ProductoPCGInterface[], Error>({
    queryKey: [
      "product-pcg-list",
      mode,
      lastCategory,
      lastSearch,
      pageSize,
      normalizedCodPrecio,
    ],
    enabled: listEnabled,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const page = Number(pageParam)

      if (mode === "category" && lastCategory) {
        return (
          (await ProductPCGService.GetByCategory(
            lastCategory,
            normalizedCodPrecio,
            page,
            pageSize
          )) ?? []
        )
      }

      if (mode === "search" && lastSearch) {
        return (
          (await ProductPCGService.getAll(
            normalizedCodPrecio,
            page,
            pageSize,
            lastSearch
          )) ?? []
        )
      }

      if (mode === "all") {
        return (
          (await ProductPCGService.getAll(
            normalizedCodPrecio,
            page,
            pageSize
          )) ?? []
        )
      }

      return []
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage?.length || lastPage.length < pageSize) return undefined
      return allPages.length
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  })

  const codeQuery = useQuery<
    ProductoPCGInterface | ProductoPCGInterface[] | null,
    Error
  >({
    queryKey: ["product-pcg-code", selectedCode],
    enabled: mode === "code" && !!selectedCode,
    queryFn: async () => {
      if (!selectedCode) return null
      return await ProductPCGService.GetByCode(selectedCode)
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })

  const modifiersQuery = useQuery<ProductoModificadorPCGInterface[], Error>({
    queryKey: ["product-pcg-modifiers", modifierCode],
    enabled: !!modifierCode,
    queryFn: async () => {
      if (!modifierCode) return []
      return (await ProductPCGService.getProductModifiers(modifierCode)) ?? []
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })

  const productPcg = useMemo<ProductoPCGInterface[]>(() => {
    if (mode === "code") {
      const data = codeQuery.data
      if (!data) return []
      return Array.isArray(data) ? data : [data]
    }

    const pages = listQuery.data?.pages ?? []
    const map = new Map<string, ProductoPCGInterface>()

    for (const page of pages) {
      for (const item of page ?? []) {
        const key = String(item.codProducto ?? "")
        if (!key) continue
        if (!map.has(key)) {
          map.set(key, item)
        }
      }
    }

    return Array.from(map.values())
  }, [mode, codeQuery.data, listQuery.data])

  const productModifiers = useMemo(() => {
    return modifiersQuery.data ?? []
  }, [modifiersQuery.data])

  const page = useMemo(() => {
    if (mode === "code" || mode === "idle") return 0
    return Math.max((listQuery.data?.pages?.length ?? 1) - 1, 0)
  }, [mode, listQuery.data])

  const hasMore = useMemo(() => {
    if (mode === "code" || mode === "idle") return false
    return !!listQuery.hasNextPage
  }, [mode, listQuery.hasNextPage])

  const loadingProductPcg = useMemo(() => {
    if (mode === "code") {
      return codeQuery.isPending || codeQuery.isFetching
    }

    if (listEnabled) {
      return listQuery.isPending || listQuery.isFetching
    }

    return false
  }, [
    mode,
    listEnabled,
    codeQuery.isPending,
    codeQuery.isFetching,
    listQuery.isPending,
    listQuery.isFetching,
  ])

  const error = useMemo(() => {
    return codeQuery.error ?? listQuery.error ?? modifiersQuery.error ?? null
  }, [codeQuery.error, listQuery.error, modifiersQuery.error])

  const reset = useCallback(() => {
    setMode("idle")
    setLastCategory(null)
    setLastSearch(null)
    setSelectedCode(null)
    setModifierCode(null)
  }, [])

  const GetAll = useCallback(
    (descripcion: string) => {
      const term = normalizarTexto(descripcion)

      if (!term) {
        reset()
        return
      }

      setSelectedCode(null)
      setLastCategory(null)
      setLastSearch(term)
      setMode("search")
    },
    [reset]
  )

  const GetByCategory = useCallback(
    (codGrupo: string) => {
      const category = normalizarTexto(codGrupo)

      if (!category) {
        reset()
        return
      }

      setSelectedCode(null)
      setLastSearch(null)
      setLastCategory(category)
      setMode("category")
    },
    [reset]
  )

  const GetByCode = useCallback(
    (codProducto: string) => {
      const code = normalizarTexto(codProducto)

      if (!code) {
        reset()
        return
      }

      setLastCategory(null)
      setLastSearch(null)
      setSelectedCode(code)
      setMode("code")
    },
    [reset]
  )

  const GetEverything = useCallback(() => {
    setSelectedCode(null)
    setLastCategory(null)
    setLastSearch(null)
    setMode("all")
  }, [])

  const loadNextPage = useCallback(async () => {
    if (!listEnabled) return
    if (!listQuery.hasNextPage) return
    if (listQuery.isFetchingNextPage) return

    await listQuery.fetchNextPage()
  }, [listEnabled, listQuery])

  const getProductModifiers = useCallback(
    async (codProducto: string) => {
      const code = normalizarTexto(codProducto)

      if (!code) {
        setModifierCode(null)
        return []
      }

      const queryKey = ["product-pcg-modifiers", code]

      const data = await ProductPCGService.getProductModifiers(code)

      queryClient.setQueryData<ProductoModificadorPCGInterface[]>(
        queryKey,
        data ?? []
      )

      setModifierCode(code)

      return data ?? []
    },
    [queryClient]
  )

  const isSearching = mode === "search"
  const isCategory = mode === "category"

  return {
    codPrecio,
    setCodPrecio,
    productPcg,
    productModifiers,
    loadingProductPcg,
    error,
    page,
    pageSize,
    setPageSize,
    hasMore,
    reset,

    GetAll,
    GetByCode,
    GetByCategory,
    GetEverything,

    loadNextPage,
    getProductModifiers,

    isSearching,
    isCategory,

    isFetchingNextPage: listQuery.isFetchingNextPage,
    refetch: async () => {
      if (mode === "code") return await codeQuery.refetch()
      if (listEnabled) return await listQuery.refetch()
      return null
    },
  }
}