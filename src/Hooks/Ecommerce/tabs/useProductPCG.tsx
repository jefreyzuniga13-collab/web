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
import { cleanText } from "@/Utils/ECommerce/formatters"

type Mode = "idle" | "category" | "search" | "all" | "code"

interface UseProductPCGOptions {
  initialPageSize?: number
}

const PRODUCT_LIST_STALE_TIME = 1000 * 60 * 2
const PRODUCT_LIST_GC_TIME = 1000 * 60 * 15

const PRODUCT_DETAIL_STALE_TIME = 1000 * 60 * 5
const PRODUCT_DETAIL_GC_TIME = 1000 * 60 * 30

const MODIFIERS_STALE_TIME = 1000 * 60 * 5
const MODIFIERS_GC_TIME = 1000 * 60 * 30

const EMPTY_MODIFIERS: ProductoModificadorPCGInterface[] = []

const productListKey = (
  mode: Mode,
  category: string | null,
  search: string | null,
  pageSize: number,
  codPrecio: string
) =>
  [
    "product-pcg-list",
    mode,
    category ?? "",
    search ?? "",
    pageSize,
    codPrecio,
  ] as const

const productCodeKey = (code: string | null) =>
  ["product-pcg-code", code ?? ""] as const

const productModifiersKey = (
  code: string | null,
  codPrecio: string
) =>
  [
    "product-pcg-modifiers",
    code ?? "",
    codPrecio,
  ] as const

export function useProductPCG(options?: UseProductPCGOptions) {
  const queryClient = useQueryClient()

  const initialPageSize = options?.initialPageSize ?? 50

  const [pageSize, setPageSize] =
    useState<number>(initialPageSize)

  const [mode, setMode] =
    useState<Mode>("idle")

  const [lastCategory, setLastCategory] =
    useState<string | null>(null)

  const [lastSearch, setLastSearch] =
    useState<string | null>(null)

  const [selectedCode, setSelectedCode] =
    useState<string | null>(null)

  const [modifierCode, setModifierCode] =
    useState<string | null>(null)

  const [modifierCodPrecio, setModifierCodPrecio] =
    useState<string>("")

  const [codPrecio, setCodPrecioState] =
    useState<string>("")

  const listEnabled =
    mode === "category" ||
    mode === "search" ||
    mode === "all"

  const normalizedCodPrecio = useMemo(() => {
    return cleanText(codPrecio)
  }, [codPrecio])

  const setCodPrecio = useCallback(
    (value: string | null | undefined) => {
      setCodPrecioState(cleanText(value))
    },
    []
  )

  const listQueryKey = useMemo(
    () =>
      productListKey(
        mode,
        lastCategory,
        lastSearch,
        pageSize,
        normalizedCodPrecio
      ),
    [
      mode,
      lastCategory,
      lastSearch,
      pageSize,
      normalizedCodPrecio,
    ]
  )

  const listQuery = useInfiniteQuery<
    ProductoPCGInterface[],
    Error
  >({
    queryKey: listQueryKey,
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
      if (!lastPage?.length) {
        return undefined
      }

      if (lastPage.length < pageSize) {
        return undefined
      }

      return allPages.length
    },

    staleTime: PRODUCT_LIST_STALE_TIME,
    gcTime: PRODUCT_LIST_GC_TIME,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  })

  const codeQuery = useQuery<
    ProductoPCGInterface | ProductoPCGInterface[] | null,
    Error
  >({
    queryKey: productCodeKey(selectedCode),
    enabled: mode === "code" && Boolean(selectedCode),

    queryFn: async () => {
      if (!selectedCode) {
        return null
      }

      return await ProductPCGService.GetByCode(selectedCode)
    },

    staleTime: PRODUCT_DETAIL_STALE_TIME,
    gcTime: PRODUCT_DETAIL_GC_TIME,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  })

  const modifiersQuery = useQuery<
    ProductoModificadorPCGInterface[],
    Error
  >({
    queryKey: productModifiersKey(
      modifierCode,
      modifierCodPrecio
    ),

    enabled:
      Boolean(modifierCode) &&
      Boolean(modifierCodPrecio),

    queryFn: async () => {
      if (!modifierCode || !modifierCodPrecio) {
        return []
      }

      return (
        (await ProductPCGService.getProductModifiers(
          modifierCode,
          modifierCodPrecio
        )) ?? []
      )
    },

    staleTime: MODIFIERS_STALE_TIME,
    gcTime: MODIFIERS_GC_TIME,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  })

  const productPcg = useMemo<ProductoPCGInterface[]>(() => {
    if (mode === "code") {
      const data = codeQuery.data

      if (!data) {
        return []
      }

      return Array.isArray(data) ? data : [data]
    }

    const pages = listQuery.data?.pages ?? []
    const products = new Map<string, ProductoPCGInterface>()

    for (const pageItems of pages) {
      for (const product of pageItems ?? []) {
        const key = cleanText(product.codProducto)

        if (!key || products.has(key)) {
          continue
        }

        products.set(key, product)
      }
    }

    return Array.from(products.values())
  }, [mode, codeQuery.data, listQuery.data?.pages])

  const productModifiers =
    modifiersQuery.data ?? EMPTY_MODIFIERS

  const page = useMemo(() => {
    if (mode === "code" || mode === "idle") {
      return 0
    }

    return Math.max(
      (listQuery.data?.pages?.length ?? 1) - 1,
      0
    )
  }, [mode, listQuery.data?.pages?.length])

  const hasMore =
    mode !== "code" &&
    mode !== "idle" &&
    Boolean(listQuery.hasNextPage)

  /*
   * Solo muestra el loader principal cuando todavía no hay datos.
   * Una actualización de fondo no reemplaza una lista ya visible.
   */
  const loadingProductPcg = useMemo(() => {
    if (mode === "code") {
      return codeQuery.isPending
    }

    if (listEnabled) {
      return listQuery.isPending
    }

    return false
  }, [
    mode,
    listEnabled,
    codeQuery.isPending,
    listQuery.isPending,
  ])

  const error =
    codeQuery.error ??
    listQuery.error ??
    modifiersQuery.error ??
    null

  const reset = useCallback(() => {
    setMode("idle")
    setLastCategory(null)
    setLastSearch(null)
    setSelectedCode(null)
    setModifierCode(null)
    setModifierCodPrecio("")
  }, [])

  const GetAll = useCallback(
    (descripcion: string) => {
      const term = cleanText(descripcion)

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
      const category = cleanText(codGrupo)

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
      const code = cleanText(codProducto)

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
  }, [
    listEnabled,
    listQuery.hasNextPage,
    listQuery.isFetchingNextPage,
    listQuery.fetchNextPage,
  ])

  const getProductModifiers = useCallback(
    async (
      codProducto: string,
      codPrecioParam?: string
    ): Promise<ProductoModificadorPCGInterface[]> => {
      const code = cleanText(codProducto)
      const priceCode = cleanText(
        codPrecioParam || normalizedCodPrecio
      )

      if (!code || !priceCode) {
        setModifierCode(null)
        setModifierCodPrecio("")
        return []
      }

      setModifierCode(code)
      setModifierCodPrecio(priceCode)

      return await queryClient.fetchQuery<
        ProductoModificadorPCGInterface[]
      >({
        queryKey: productModifiersKey(
          code,
          priceCode
        ),

        queryFn: async () => {
          return (
            (await ProductPCGService.getProductModifiers(
              code,
              priceCode
            )) ?? []
          )
        },

        staleTime: MODIFIERS_STALE_TIME,
        gcTime: MODIFIERS_GC_TIME,
      })
    },
    [queryClient, normalizedCodPrecio]
  )

  const isSearching = mode === "search"
  const isCategory = mode === "category"

  const refetch = useCallback(async () => {
    if (mode === "code") {
      return await codeQuery.refetch()
    }

    if (listEnabled) {
      return await listQuery.refetch()
    }

    if (modifierCode && modifierCodPrecio) {
      return await modifiersQuery.refetch()
    }

    return null
  }, [
    mode,
    listEnabled,
    modifierCode,
    modifierCodPrecio,
    codeQuery,
    listQuery,
    modifiersQuery,
  ])

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

    isFetchingNextPage:
      listQuery.isFetchingNextPage,

    refetch,
  }
}